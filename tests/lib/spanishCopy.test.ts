import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_DIRECTORIES = ["app", "components", "lib"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx"]);
const MOJIBAKE_MARKERS = ["Ã", "Â", "�"];

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getSourceFiles(path);
    }

    return TEXT_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

describe("copy en español", () => {
  it("no contiene marcadores habituales de codificación dañada", () => {
    const affectedFiles = SOURCE_DIRECTORIES.flatMap(getSourceFiles).filter((file) => {
      const content = readFileSync(file, "utf8");
      return MOJIBAKE_MARKERS.some((marker) => content.includes(marker));
    });

    expect(affectedFiles).toEqual([]);
  });
});
