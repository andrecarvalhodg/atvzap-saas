/**
 * Design System Utilities
 *
 * Helper functions for converting token keys to CSS custom property names.
 */

/**
 * Converts a camelCase token key to a CSS custom property name.
 *
 * @example
 * tokenKeyToCssVar("cardForeground") // "--card-foreground"
 * tokenKeyToCssVar("primary")        // "--primary"
 * tokenKeyToCssVar("chart1")         // "--chart-1"
 */
export function tokenKeyToCssVar(key: string): string {
  const kebab = key
    .replace(/([a-z])(\d)/g, "$1-$2")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase();

  return `--${kebab}`;
}

/**
 * Converts a token key to a sidebar-prefixed CSS custom property name.
 *
 * @example
 * sidebarKeyToCssVar("primary")           // "--sidebar-primary"
 * sidebarKeyToCssVar("primaryForeground") // "--sidebar-primary-foreground"
 */
export function sidebarKeyToCssVar(key: string): string {
  const kebab = key
    .replace(/([a-z])(\d)/g, "$1-$2")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase();

  return `--sidebar-${kebab}`;
}
