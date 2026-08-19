import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportRoot = path.resolve(root, "..", "output", "abyss-timer-react-vite-github");
const iconSourceRoot = "/home/ubuntu/webdev-static-assets/abyss-timer-icons";

const copy = (from, to) => cp(from, to, { recursive: true, force: true });

async function rewrite(relativePath, replacements) {
  const target = path.join(exportRoot, relativePath);
  let content = await readFile(target, "utf8");
  for (const [from, to] of replacements) content = content.replaceAll(from, to);
  await writeFile(target, content);
}

await rm(exportRoot, { recursive: true, force: true });
await mkdir(exportRoot, { recursive: true });

for (const item of ["client", "server", "shared", "patches", ".github", "scripts"]) {
  await copy(path.join(root, item), path.join(exportRoot, item));
}
for (const item of [".gitignore", ".prettierignore", ".prettierrc", "README.md", "GITHUB_PUBLISHING_GUIDE.md", "MIGRATION_SPEC.md", "MIGRATION_VERIFICATION.md", "components.json", "package.json", "pnpm-lock.yaml", "tsconfig.json", "tsconfig.node.json", "vite.config.ts"]) {
  await copy(path.join(root, item), path.join(exportRoot, item));
}

for (const iconName of ["icon-192.png", "icon-512.png", "icon-maskable-512.png"]) {
  await copy(path.join(iconSourceRoot, iconName), path.join(exportRoot, "client", "public", iconName));
}

const iconReplacements = [
  ["/manus-storage/icon-192_ad047a43.png", "./icon-192.png"],
  ["/manus-storage/icon-512_a07e22fb.png", "./icon-512.png"],
  ["/manus-storage/icon-maskable-512_564cedcc.png", "./icon-maskable-512.png"],
];
await rewrite("client/public/manifest.json", iconReplacements);
await rewrite("client/index.html", [["/manus-storage/icon-512_a07e22fb.png", "./icon-512.png"]]);

console.log(`GitHub export ready: ${exportRoot}`);
