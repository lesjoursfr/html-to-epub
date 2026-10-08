import AdmZip from "adm-zip";
import assert from "assert";
import { existsSync, readFileSync, statSync, unlinkSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { EPub, EpubOptions } from "../src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("XHTML Void Tags & Output Stream", () => {
  const inputName = "book-void-tags-v3";
  const outputPath = resolve(__dirname, `./${inputName}.epub`);

  afterEach(() => {
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }
  });

  it("should output self-closing tags (<img ... />, <br />, <hr />) and flush completely to disk", async () => {
    const params = JSON.parse(
      readFileSync(resolve(__dirname, `./${inputName}.json`), { encoding: "utf8" })
    ) as EpubOptions;
    const epub = new EPub(params, outputPath);

    const op = await epub.render();
    assert.strictEqual(op.result, "ok");

    // Verify output file exists and is flushed immediately upon Promise resolution
    assert.strictEqual(existsSync(outputPath), true, "Output EPUB file must exist immediately after render()");
    const fileStat = statSync(outputPath);
    assert.ok(fileStat.size > 0, "Output EPUB file must have non-zero size");

    // Inspect the generated XHTML inside the EPUB zip
    const zip = new AdmZip(outputPath);
    const chapterEntry = zip.getEntry("OEBPS/0_void-tags-chapter.xhtml");
    assert.ok(chapterEntry !== null, "Chapter entry OEBPS/0_void-tags-chapter.xhtml must exist in EPUB");

    const xhtml = chapterEntry.getData().toString("utf8");

    // Assert that void tags are rendered with self-closing syntax (<... />)
    assert.match(xhtml, /<img\s[^>]*\/>/, "img tag must be self-closing (<img ... />)");
    assert.match(xhtml, /<br\s*\/>/, "br tag must be self-closing (<br />)");
    assert.match(xhtml, /<hr\s*\/>/, "hr tag must be self-closing (<hr />)");

    // Assert that separate closing tags for void elements are NOT present
    assert.doesNotMatch(xhtml, /<\/img>/, "img tag must not have a separate </img> closing tag");
    assert.doesNotMatch(xhtml, /<\/br>/, "br tag must not have a separate </br> closing tag");
    assert.doesNotMatch(xhtml, /<\/hr>/, "hr tag must not have a separate </hr> closing tag");
  }).timeout(30000);
});
