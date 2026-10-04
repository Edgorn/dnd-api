import fs from "fs";
import path from "path";
import { z } from "zod";

export const openApiSpecSchema = z
  .object({
    openapi: z.string().min(1),
    info: z
      .object({
        title: z.string().min(1),
        version: z.string().min(1)
      })
      .passthrough()
  })
  .passthrough();

export type OpenApiSpec = z.infer<typeof openApiSpecSchema>;

export type TryLoadOpenApiOptions = {
  extraPaths?: string[];
};

export function getOpenApiJsonPath(cwd: string = process.cwd()): string {
  return path.resolve(cwd, "openapi.json");
}

export function getModuleRelativeOpenApiPaths(): string[] {
  return [
    path.resolve(__dirname, "../../../../openapi.json"),
    path.resolve(__dirname, "../../../../../openapi.json")
  ];
}

export function loadOpenApiSpecFromFile(openApiPath: string): OpenApiSpec {
  let raw: string;
  try {
    raw = fs.readFileSync(openApiPath, "utf-8");
  } catch {
    throw new Error(`No se encontró openapi.json en ${openApiPath}. Ejecuta pnpm docs:openapi`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`openapi.json no es JSON válido: ${openApiPath}`);
  }

  const result = openApiSpecSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`openapi.json no tiene la forma OpenAPI esperada: ${openApiPath}`);
  }

  return result.data;
}

export function loadOpenApiSpec(cwd: string = process.cwd()): OpenApiSpec {
  return loadOpenApiSpecFromFile(getOpenApiJsonPath(cwd));
}

function tryLoadFromPath(openApiPath: string): OpenApiSpec | null {
  try {
    return loadOpenApiSpecFromFile(openApiPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[OpenAPI] ${message}`);
    return null;
  }
}

export function tryLoadOpenApiSpec(
  cwd: string = process.cwd(),
  options: TryLoadOpenApiOptions = {}
): OpenApiSpec | null {
  const primaryPath = getOpenApiJsonPath(cwd);
  if (fs.existsSync(primaryPath)) {
    return tryLoadFromPath(primaryPath);
  }

  const extraPaths = options.extraPaths ?? getModuleRelativeOpenApiPaths();
  const uniqueExtraPaths = [...new Set(extraPaths.filter((candidate) => candidate !== primaryPath))];

  for (const openApiPath of uniqueExtraPaths) {
    if (!fs.existsSync(openApiPath)) {
      continue;
    }
    return tryLoadFromPath(openApiPath);
  }

  console.warn(
    `[OpenAPI] No se encontró openapi.json en ${primaryPath}. Swagger no se montará. Ejecuta pnpm docs:openapi`
  );
  return null;
}
