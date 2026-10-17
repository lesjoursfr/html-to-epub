import AdmZip from "adm-zip";
import assert from "assert";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { EPub, EpubOptions } from "../src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("XHTML Void Tags & strictXhtml Option", () => {
  const inputName = "book-void-tags-v3";
  const outputPath = resolve(__dirname, `./${inputName}.epub`);

  afterEach(() => {
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }
  });

  it("should preserve default compatibility (non-self-closing void tags) when strictXhtml is unset", async () => {
    const params = JSON.parse(
      readFileSync(resolve(__dirname, `./${inputName}.json`), { encoding: "utf8" })
    ) as EpubOptions;
    // Ensure strictXhtml is unset (default)
    delete params.strictXhtml;

    const epub = new EPub(params, outputPath);
    const op = await epub.render();
    assert.strictEqual(op.result, "ok");

    const zip = new AdmZip(outputPath);
    const chapterEntry = zip.getEntry("OEBPS/0_void-tags-chapter.xhtml");
    assert.ok(chapterEntry !== null, "Chapter entry OEBPS/0_void-tags-chapter.xhtml must exist in EPUB");

    const xhtml = chapterEntry.getData().toString("utf8");

    // By default, void elements should be output with explicit closing tags (historical behavior)
    assert.match(xhtml, /<img\s[^>]*><\/img>/, "img tag should have separate closing tag by default");
    assert.match(xhtml, /<br><\/br>/, "br tag should have separate closing tag by default");
    assert.match(xhtml, /<hr><\/hr>/, "hr tag should have separate closing tag by default");
    assert.doesNotMatch(xhtml, /<img\s[^>]*\/>/, "img tag should not be self-closing by default");
    assert.doesNotMatch(xhtml, /<br\s*\/>/, "br tag should not be self-closing by default");
    assert.doesNotMatch(xhtml, /<hr\s*\/>/, "hr tag should not be self-closing by default");
  }).timeout(30000);

  it("should output self-closing tags (<img ... />, <br />, <hr />) when strictXhtml is true", async () => {
    const params = JSON.parse(
      readFileSync(resolve(__dirname, `./${inputName}.json`), { encoding: "utf8" })
    ) as EpubOptions;
    params.strictXhtml = true;

    const epub = new EPub(params, outputPath);
    const op = await epub.render();
    assert.strictEqual(op.result, "ok");

    const zip = new AdmZip(outputPath);
    const chapterEntry = zip.getEntry("OEBPS/0_void-tags-chapter.xhtml");
    assert.ok(chapterEntry !== null, "Chapter entry OEBPS/0_void-tags-chapter.xhtml must exist in EPUB");

    const xhtml = chapterEntry.getData().toString("utf8");

    // In strictXhtml mode, void tags must be self-closing (<... />)
    assert.match(xhtml, /<img\s[^>]*\/>/, "img tag must be self-closing (<img ... />)");
    assert.match(xhtml, /<br\s*\/>/, "br tag must be self-closing (<br />)");
    assert.match(xhtml, /<hr\s*\/>/, "hr tag must be self-closing (<hr />)");

    // In strictXhtml mode, separate closing tags for void elements must NOT be present
    assert.doesNotMatch(xhtml, /<\/img>/, "img tag must not have a separate </img> closing tag");
    assert.doesNotMatch(xhtml, /<\/br>/, "br tag must not have a separate </br> closing tag");
    assert.doesNotMatch(xhtml, /<\/hr>/, "hr tag must not have a separate </hr> closing tag");
  }).timeout(30000);
});
