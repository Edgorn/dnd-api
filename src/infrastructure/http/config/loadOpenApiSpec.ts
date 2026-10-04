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

export function getOpenApiJsonPath(cwd: string = process.cwd()): string {
  return path.resolve(cwd, "openapi.json");
}

export function loadOpenApiSpec(cwd: string = process.cwd()): OpenApiSpec {
  const openApiPath = getOpenApiJsonPath(cwd);
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
