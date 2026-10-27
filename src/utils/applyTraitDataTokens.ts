export function applyTraitDataTokens(
  texts: string[],
  tokens: Record<string, string> | undefined,
): string[] {
  if (!tokens) return texts;
  return texts.map((text) => applyTokensToText(text, tokens));
}

function applyTokensToText(text: string, tokens: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(tokens)) {
    for (const needle of traitDataNeedles(key)) {
      result = result.replaceAll(needle, value);
    }
  }
  return result;
}

function traitDataInnerKey(key: string): string {
  return key.replace(/^[[{]+/, "").replace(/[\]}]+$/, "");
}

function traitDataNeedles(key: string): string[] {
  const inner = traitDataInnerKey(key);
  const needles: string[] = [];
  if (inner) {
    needles.push(`[${inner}]`, `{${inner}}`);
  }
  if (key && !needles.includes(key)) {
    needles.push(key);
  }
  return needles;
}
