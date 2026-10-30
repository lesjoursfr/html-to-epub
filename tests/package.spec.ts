import assert from "assert";
import ejs from "ejs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { EPub } from "../src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("Package document", () => {
  for (const version of [2, 3]) {
    it(`only references manifest items from the spine of a v${version} book with a cover`, async () => {
      const epub = new EPub(
        {
          title: "Cover in the spine",
          description: "The cover page is referenced once.",
          cover: "cover.png",
          version,
          content: [
            { title: "Before", data: "<p>Before the table of contents</p>", beforeToc: true },
            { title: "Chapter", data: "<p>Text</p>" },
          ],
        },
        resolve(__dirname, "cover-spine.epub")
      );

      const opf = await ejs.renderFile(resolve(__dirname, `../templates/epub${version}/content.opf.ejs`), epub);
      const manifest = [...opf.matchAll(/<item id="([^"]+)"/g)].map((match) => match[1]);
      const spine = [...opf.matchAll(/<itemref idref="([^"]+)"/g)].map((match) => match[1]);
      assert.deepStrictEqual(spine, ["cover", "content_1_item_1", "toc", "content_2_item_2"]);
      for (const idref of spine) {
        assert(manifest.includes(idref), `spine item ${idref} is not in the manifest`);
      }
    });
  }
});
