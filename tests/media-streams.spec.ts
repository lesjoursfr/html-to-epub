import assert from "assert";
import { existsSync, WriteStream } from "fs";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { createServer } from "http";
import { tmpdir } from "os";
import { join } from "path";
import { EPub } from "../src/index.js";

const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/z9sAAAAASUVORK5CYII=",
  "base64"
);

describe("Media stream completion", () => {
  const server = createServer((_request, response) => {
    response.setHeader("Content-Type", "image/png");
    response.end(image);
  });
  const originalWrite = WriteStream.prototype._write;
  let directory: string;
  let imageUrl: string;
  let pendingWrites: Promise<void>[];

  before(async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    assert(address && typeof address !== "string");
    imageUrl = `http://127.0.0.1:${address.port}/image.png`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  });

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "epub-media-streams-"));
    pendingWrites = [];
  });

  afterEach(async () => {
    await Promise.all(pendingWrites);
    WriteStream.prototype._write = originalWrite;
    await rm(directory, { recursive: true, force: true });
  });

  async function fixture(location: "cover" | "chapter", remote = false) {
    const source = join(directory, "source.png");
    await writeFile(source, image);
    const url = remote ? imageUrl : source;
    const epub = new EPub(
      {
        title: "Image stream regression",
        description: "Verify that image copies finish before use.",
        tempDir: directory,
        ...(location === "cover" ? { cover: url } : {}),
        content: [
          { title: "Chapter", data: location === "chapter" ? `<img src="${url}" alt="A pixel">` : "<p>Text</p>" },
        ],
      },
      join(directory, "book.epub")
    );
    const destination = join(
      epub.tempEpubDir,
      "OEBPS",
      location === "cover" ? "cover.png" : `images/${epub.images[0].id}.png`
    );
    return { epub, source, destination };
  }

  for (const location of ["cover", "chapter"] as const) {
    for (const transport of ["local", "HTTP"] as const) {
      it(`waits for ${transport} ${location} image writes before using the image`, async () => {
        const { epub, destination } = await fixture(location, transport === "HTTP");
        WriteStream.prototype._write = function (chunk, encoding, callback) {
          if (this.path !== destination) {
            return originalWrite.call(this, chunk, encoding, callback);
          }
          // Reproduce a readable ending while its destination is still empty.
          pendingWrites.push(
            new Promise((resolve) => {
              setTimeout(() => {
                originalWrite.call(this, chunk, encoding, (error) => {
                  callback(error);
                  resolve();
                });
              }, 250);
            })
          );
        };
        let generated = false;
        // Inspect the file at the point it would be added to the EPUB archive.
        epub["generate"] = async () => {
          generated = true;
          assert.deepStrictEqual(await readFile(destination), image);
        };

        await epub.render();

        assert(generated);
        assert.strictEqual(pendingWrites.length, 1);
        if (location === "cover") {
          assert.deepStrictEqual(epub.coverDimensions, { width: 1, height: 1 });
        }
      });
    }

    it(`rejects ${location} destination write errors and removes the partial image`, async () => {
      const { epub, destination } = await fixture(location);
      const failure = new Error("Simulated destination write failure");
      WriteStream.prototype._write = function (chunk, encoding, callback) {
        if (this.path !== destination) {
          return originalWrite.call(this, chunk, encoding, callback);
        }
        originalWrite.call(this, chunk.subarray(0, 8), encoding, () => callback(failure));
      };

      await assert.rejects(epub.render(), (error) => error === failure);
      assert.strictEqual(existsSync(destination), false);
    });

    it(`rejects missing ${location} sources and removes the destination`, async () => {
      const { epub, source, destination } = await fixture(location);
      await rm(source);

      await assert.rejects(epub.render(), { code: "ENOENT" });
      assert.strictEqual(existsSync(destination), false);
    });
  }
});
