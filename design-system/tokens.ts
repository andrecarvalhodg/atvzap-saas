/**
 * Design System Tokens
 *
 * Single source of truth for all design tokens used across the application.
 * Colors use oklch format for perceptual uniformity.
 * Primary brand color: Emerald Green (#10b981)
 */

export interface ColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
}

export interface DesignTokens {
  colors: ColorTokens;
  dark: ColorTokens;
  radius: string;
  fontSans: string;
  fontMono: string;
}

export const tokens: DesignTokens = {
  colors: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0.004 285.82)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0.004 285.82)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0.004 285.82)",
    primary: "oklch(0.696 0.17 162.48)",
    primaryForeground: "oklch(1 0 0)",
    secondary: "oklch(0.967 0.001 286.38)",
    secondaryForeground: "oklch(0.205 0.006 285.82)",
    muted: "oklch(0.967 0.001 286.38)",
    mutedForeground: "oklch(0.556 0.01 285.94)",
    accent: "oklch(0.967 0.001 286.38)",
    accentForeground: "oklch(0.205 0.006 285.82)",
    destructive: "oklch(0.577 0.245 27.33)",
    border: "oklch(0.922 0.004 286.32)",
    input: "oklch(0.922 0.004 286.32)",
    ring: "oklch(0.696 0.17 162.48)",
    chart1: "oklch(0.696 0.17 162.48)",
    chart2: "oklch(0.6 0.118 184.71)",
    chart3: "oklch(0.398 0.07 227.39)",
    chart4: "oklch(0.828 0.189 84.43)",
    chart5: "oklch(0.769 0.188 70.08)",
    sidebarBackground: "oklch(0.985 0 0)",
    sidebarForeground: "oklch(0.145 0.004 285.82)",
    sidebarPrimary: "oklch(0.696 0.17 162.48)",
    sidebarPrimaryForeground: "oklch(1 0 0)",
    sidebarAccent: "oklch(0.967 0.001 286.38)",
    sidebarAccentForeground: "oklch(0.205 0.006 285.82)",
    sidebarBorder: "oklch(0.922 0.004 286.32)",
    sidebarRing: "oklch(0.696 0.17 162.48)",
  },

  dark: {
    background: "oklch(0.145 0.004 285.82)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.145 0.004 285.82)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.145 0.004 285.82)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.696 0.17 162.48)",
    primaryForeground: "oklch(1 0 0)",
    secondary: "oklch(0.269 0.006 285.89)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0.006 285.89)",
    mutedForeground: "oklch(0.708 0.01 285.94)",
    accent: "oklch(0.269 0.006 285.89)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.577 0.245 27.33)",
    border: "oklch(0.269 0.006 285.89)",
    input: "oklch(0.269 0.006 285.89)",
    ring: "oklch(0.696 0.17 162.48)",
    chart1: "oklch(0.696 0.17 162.48)",
    chart2: "oklch(0.6 0.118 184.71)",
    chart3: "oklch(0.398 0.07 227.39)",
    chart4: "oklch(0.828 0.189 84.43)",
    chart5: "oklch(0.769 0.188 70.08)",
    sidebarBackground: "oklch(0.17 0.005 285.82)",
    sidebarForeground: "oklch(0.985 0 0)",
    sidebarPrimary: "oklch(0.696 0.17 162.48)",
    sidebarPrimaryForeground: "oklch(1 0 0)",
    sidebarAccent: "oklch(0.269 0.006 285.89)",
    sidebarAccentForeground: "oklch(0.985 0 0)",
    sidebarBorder: "oklch(0.269 0.006 285.89)",
    sidebarRing: "oklch(0.696 0.17 162.48)",
  },

  radius: "0.625rem",
  fontSans: "var(--font-sans)",
  fontMono: "var(--font-geist-mono)",
};
