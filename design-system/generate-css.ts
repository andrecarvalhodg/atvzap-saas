/**
 * Design System CSS Generator
 *
 * Reads design tokens and generates CSS custom properties in app/globals.css.
 * Replaces content between TOKENS:START / TOKENS:END markers, or falls back
 * to replacing existing :root and .dark blocks on first run.
 *
 * Usage:
 *   npx tsx design-system/generate-css.ts           # write changes
 *   npx tsx design-system/generate-css.ts --check    # compare without writing (CI)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { tokens } from "./tokens";
import { tokenKeyToCssVar } from "./utils";

const MARKER_START = "/* TOKENS:START */";
const MARKER_END = "/* TOKENS:END */";

const GLOBALS_PATH = path.resolve(__dirname, "..", "app", "globals.css");

// ── Helpers ──────────────────────────────────────────────────────────────

/** Keys that belong to the sidebar group (prefixed with "sidebar"). */
function isSidebarKey(key: string): boolean {
  return key.startsWith("sidebar");
}

/** Convert a sidebar-prefixed key to its CSS var name. */
function sidebarKeyToVar(key: string): string {
  // "sidebarPrimary" → "sidebar-primary"
  const rest = key.slice("sidebar".length);
  const kebab = rest
    .replace(/([a-z])(\d)/g, "$1-$2")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase();
  return `--sidebar${kebab}`;
}

/**
 * Build the CSS custom properties block for a given color map.
 */
function buildCssVars(
  colorMap: Record<string, string>,
  indent: string = "    ",
): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(colorMap)) {
    const varName = isSidebarKey(key)
      ? sidebarKeyToVar(key)
      : tokenKeyToCssVar(key);
    lines.push(`${indent}${varName}: ${value};`);
  }

  return lines.join("\n");
}

/**
 * Generate the full :root block wrapped in markers.
 */
function generateRootBlock(): string {
  const vars = buildCssVars(tokens.colors as unknown as Record<string, string>);
  return [
    MARKER_START,
    `:root {`,
    vars,
    `    --radius: ${tokens.radius};`,
    `    --font-sans: ${tokens.fontSans};`,
    `    --font-mono: ${tokens.fontMono};`,
    `}`,
    "",
    `.dark {`,
    buildCssVars(tokens.dark as unknown as Record<string, string>),
    `}`,
    MARKER_END,
  ].join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const checkMode = process.argv.includes("--check");

  if (!fs.existsSync(GLOBALS_PATH)) {
    console.error(`Error: ${GLOBALS_PATH} not found.`);
    process.exit(1);
  }

  const original = fs.readFileSync(GLOBALS_PATH, "utf-8");
  let updated: string;

  const hasMarkers =
    original.includes(MARKER_START) && original.includes(MARKER_END);

  if (hasMarkers) {
    // Replace between markers (inclusive)
    const startIdx = original.indexOf(MARKER_START);
    const endIdx = original.indexOf(MARKER_END) + MARKER_END.length;
    updated =
      original.slice(0, startIdx) +
      generateRootBlock() +
      original.slice(endIdx);
  } else {
    // First run: replace existing :root { ... } and .dark { ... } blocks
    const rootBlock = generateRootBlock();

    // Match :root { ... } and .dark { ... } blocks
    const rootRegex = /:root\s*\{[^}]*\}/;
    const darkRegex = /\.dark\s*\{[^}]*\}/;

    if (rootRegex.test(original) && darkRegex.test(original)) {
      // Remove the existing .dark block first, then replace :root with
      // the full generated block (which includes both :root and .dark)
      const withoutDark = original.replace(darkRegex, "");
      updated = withoutDark.replace(rootRegex, rootBlock);
      // Clean up any leftover blank lines from removing .dark
      updated = updated.replace(/\n{3,}/g, "\n\n");
    } else if (rootRegex.test(original)) {
      updated = original.replace(rootRegex, rootBlock);
    } else {
      // No existing blocks found; prepend after @import statements
      const lastImport = original.lastIndexOf("@import");
      if (lastImport !== -1) {
        const lineEnd = original.indexOf("\n", lastImport);
        updated =
          original.slice(0, lineEnd + 1) +
          "\n" +
          rootBlock +
          "\n" +
          original.slice(lineEnd + 1);
      } else {
        updated = rootBlock + "\n\n" + original;
      }
    }
  }

  if (checkMode) {
    if (original === updated) {
      console.log("CSS tokens are up to date.");
      process.exit(0);
    } else {
      console.error(
        "CSS tokens are out of date. Run `npx tsx design-system/generate-css.ts` to update.",
      );
      process.exit(1);
    }
  }

  fs.writeFileSync(GLOBALS_PATH, updated, "utf-8");
  console.log(`Updated ${GLOBALS_PATH}`);
}

main();
