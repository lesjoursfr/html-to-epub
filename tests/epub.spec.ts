import assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { EPub, EpubOptions } from "../src/index.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

async function runTestOn(input: string): Promise<boolean> {
  const params = JSON.parse(readFileSync(resolve(__dirname, `./${input}.json`), { encoding: "utf8" })) as EpubOptions;
  params.userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36";
  const output = resolve(__dirname, `./${input}.epub`);

  const epub = new EPub(params, output);
  const op = await epub.render();
  return op.result === "ok";
}

it("Ebook > generate v2", async () => {
  assert.strictEqual(await runTestOn("book-v2"), true);
}).timeout(12000);

it("Ebook > generate v3", async () => {
  assert.strictEqual(await runTestOn("book-v3"), true);
}).timeout(12000);

it("Ebook without cover > generate v2", async () => {
  assert.strictEqual(await runTestOn("book-no-cover-v2"), true);
}).timeout(12000);

it("Ebook without cover > generate v3", async () => {
  assert.strictEqual(await runTestOn("book-no-cover-v3"), true);
}).timeout(12000);

it("Ebook without ToC > generate v2", async () => {
  assert.strictEqual(await runTestOn("book-no-toc-v2"), true);
}).timeout(12000);

it("Ebook without ToC > generate v3", async () => {
  assert.strictEqual(await runTestOn("book-no-toc-v3"), true);
}).timeout(12000);

it("Ebook without ToC and without cover > generate v2", async () => {
  assert.strictEqual(await runTestOn("book-no-cover-no-toc-v2"), true);
}).timeout(12000);

it("Ebook without ToC and without cover > generate v3", async () => {
  assert.strictEqual(await runTestOn("book-no-cover-no-toc-v3"), true);
}).timeout(12000);

it("Ebook with collection > generate v3", async () => {
  assert.strictEqual(await runTestOn("book-collection-v3"), true);
}).timeout(12000);

it("Ebook with wrong collection > generate v3", async () => {
  await assert.rejects(
    () => runTestOn("book-collection-v3-unknown-type"),
    new Error('Invalid collections: Wonderland Collection: THIS IS WORNG. Allowed types are "series" and "set".')
  );
}).timeout(12000);

it("HTML Page > generate v2", async () => {
  assert.strictEqual(await runTestOn("article-v2"), true);
}).timeout(12000);

it("HTML Page > generate v3", async () => {
  assert.strictEqual(await runTestOn("article-v3"), true);
}).timeout(12000);

it("HTML Page first image cover > generate v2", async () => {
  assert.strictEqual(await runTestOn("article-first-image-cover-v2"), true);
}).timeout(12000);

it("HTML Page first image cover > generate v3", async () => {
  assert.strictEqual(await runTestOn("article-first-image-cover-v3"), true);
}).timeout(12000);

it("Audio and Video page > generate v3", async () => {
  assert.strictEqual(await runTestOn("audiovideo-v3"), true);
}).timeout(12000);

it("beforeToc content excluded from ToC > generate v3", async () => {
  assert.strictEqual(await runTestOn("book-before-toc-excluded-v3"), true);
}).timeout(12000);

it("beforeToc content excluded from ToC > generate v2", async () => {
  assert.strictEqual(await runTestOn("book-before-toc-excluded-v2"), true);
}).timeout(12000);
