import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { loadOpenApiSpec } from "./loadOpenApiSpec";

describe("loadOpenApiSpec", () => {
  it("reads and validates openapi.json from the working directory", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-"));
    writeFileSync(
      path.join(dir, "openapi.json"),
      JSON.stringify({
        openapi: "3.0.0",
        info: { title: "D&D API", version: "1.0.0" },
        paths: { "/health": { get: { responses: { "200": { description: "ok" } } } } }
      }),
      "utf-8"
    );

    const spec = loadOpenApiSpec(dir);

    expect(spec.openapi).toBe("3.0.0");
    expect(spec.info.title).toBe("D&D API");
    expect(spec).toHaveProperty("paths");
  });

  it("throws when the file is missing", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-missing-"));
    expect(() => loadOpenApiSpec(dir)).toThrow(/No se encontró openapi.json/);
  });

  it("throws when the JSON is not a valid OpenAPI object", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-invalid-"));
    writeFileSync(path.join(dir, "openapi.json"), JSON.stringify({ foo: "bar" }), "utf-8");
    expect(() => loadOpenApiSpec(dir)).toThrow(/forma OpenAPI esperada/);
  });
});
