import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadOpenApiSpec, tryLoadOpenApiSpec } from "./loadOpenApiSpec";

const validSpec = {
  openapi: "3.0.0",
  info: { title: "D&D API", version: "1.0.0" },
  paths: { "/health": { get: { responses: { "200": { description: "ok" } } } } }
};

describe("loadOpenApiSpec", () => {
  it("reads and validates openapi.json from the working directory", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-"));
    writeFileSync(path.join(dir, "openapi.json"), JSON.stringify(validSpec), "utf-8");

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

describe("tryLoadOpenApiSpec", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the spec when openapi.json exists and is valid", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-try-ok-"));
    writeFileSync(path.join(dir, "openapi.json"), JSON.stringify(validSpec), "utf-8");

    const spec = tryLoadOpenApiSpec(dir, { extraPaths: [] });

    expect(spec?.openapi).toBe("3.0.0");
    expect(spec?.info.title).toBe("D&D API");
  });

  it("returns null when the file is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-try-missing-"));

    expect(tryLoadOpenApiSpec(dir, { extraPaths: [] })).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("returns null when the JSON is not a valid OpenAPI object", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const dir = mkdtempSync(path.join(tmpdir(), "openapi-try-invalid-"));
    writeFileSync(path.join(dir, "openapi.json"), JSON.stringify({ foo: "bar" }), "utf-8");

    expect(tryLoadOpenApiSpec(dir, { extraPaths: [] })).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("loads from extraPaths when the working directory has no openapi.json", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "openapi-try-cwd-"));
    const extraDir = mkdtempSync(path.join(tmpdir(), "openapi-try-extra-"));
    const extraPath = path.join(extraDir, "openapi.json");
    writeFileSync(extraPath, JSON.stringify(validSpec), "utf-8");

    const spec = tryLoadOpenApiSpec(cwd, { extraPaths: [extraPath] });

    expect(spec?.info.title).toBe("D&D API");
  });
});
