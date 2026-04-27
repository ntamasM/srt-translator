import { getPackages, savePackage } from "./db";
import type { TranslationPackage } from "../types/settings";

export async function importPackages(
  incoming: Partial<TranslationPackage>[],
): Promise<number> {
  if (!incoming.length) return 0;

  const current = await getPackages();
  const existingNames = new Set(current.map((p) => p.name));

  let count = 0;
  for (const pkg of incoming) {
    if (!pkg.name || !pkg.matchingWords) continue;

    let finalName = pkg.name;
    if (existingNames.has(finalName)) {
      let counter = 2;
      while (existingNames.has(`${pkg.name} (${counter})`)) counter++;
      finalName = `${pkg.name} (${counter})`;
    }
    existingNames.add(finalName);

    const newPkg: TranslationPackage = {
      id: crypto.randomUUID(),
      name: finalName,
      titleKeyword: pkg.titleKeyword ?? "",
      keywords: pkg.keywords ?? [],
      matchingWords: pkg.matchingWords ?? [],
      removalWords: pkg.removalWords ?? [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePackage(newPkg);
    count++;
  }
  return count;
}
