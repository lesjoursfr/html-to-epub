import assert from "assert";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { EPub, EpubOptions } from "../src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("strictXhtml option", () => {
  const inputName = "book-void-tags-v3";
  const outputPath = resolve(__dirname, `./${inputName}.epub`);

  afterEach(() => {
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }
  });

  interface TestCase {
    title: string;
    strictXhtml?: boolean | null;
    expectSelfClosing: boolean;
  }

  const testCases: TestCase[] = [
    {
      title: "should preserve backward-compatible non-self-closing tags when omitted (undefined)",
      strictXhtml: undefined,
      expectSelfClosing: false,
    },
    {
      title: "should preserve backward-compatible non-self-closing tags when explicitly false",
      strictXhtml: false,
      expectSelfClosing: false,
    },
    {
      title: "should preserve backward-compatible non-self-closing tags when null",
      strictXhtml: null,
      expectSelfClosing: false,
    },
    {
      title: "should output XML self-closing tags when true",
      strictXhtml: true,
      expectSelfClosing: true,
    },
  ];

  testCases.forEach(({ title, strictXhtml, expectSelfClosing }) => {
    it(title, async () => {
      const baseParams = JSON.parse(
        readFileSync(resolve(__dirname, `./${inputName}.json`), { encoding: "utf8" })
      ) as EpubOptions;

      const params: EpubOptions = {
        ...baseParams,
        ...(strictXhtml !== undefined ? { strictXhtml: strictXhtml as boolean } : {}),
      };
      if (strictXhtml === undefined) {
        delete params.strictXhtml;
      }

      const epub = new EPub(params, outputPath);
      const op = await epub.render();
      assert.strictEqual(op.result, "ok");

      assert.ok(epub.content.length > 0, "EPUB must have at least one content chapter");
      const xhtml = epub.content[0].data;

      if (expectSelfClosing) {
        // In strictXhtml mode, void tags must be self-closing (<... />)
        assert.match(xhtml, /<img\s[^>]*\/>/, "img tag must be self-closing (<img ... />)");
        assert.match(xhtml, /<br\s*\/>/, "br tag must be self-closing (<br />)");
        assert.match(xhtml, /<hr\s*\/>/, "hr tag must be self-closing (<hr />)");

        assert.doesNotMatch(xhtml, /<\/img>/, "img tag must not have separate </img> closing tag");
        assert.doesNotMatch(xhtml, /<\/br>/, "br tag must not have separate </br> closing tag");
        assert.doesNotMatch(xhtml, /<\/hr>/, "hr tag must not have separate </hr> closing tag");
      } else {
        // By default or non-true, void tags must preserve explicit separate closing tags (<...></...>)
        assert.match(xhtml, /<img\s[^>]*><\/img>/, "img tag must have separate closing tag by default");
        assert.match(xhtml, /<br><\/br>/, "br tag must have separate closing tag by default");
        assert.match(xhtml, /<hr><\/hr>/, "hr tag must have separate closing tag by default");

        assert.doesNotMatch(xhtml, /<img\s[^>]*\/>/, "img tag should not be self-closing by default");
        assert.doesNotMatch(xhtml, /<br\s*\/>/, "br tag should not be self-closing by default");
        assert.doesNotMatch(xhtml, /<hr\s*\/>/, "hr tag should not be self-closing by default");
      }
    }).timeout(30000);
  });
});
