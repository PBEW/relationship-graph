/** WCAG relative luminance of a #RRGGBB colour, or null if it isn't one. */
function luminance(color: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return null;
  const channel = (start: number) => {
    const value = parseInt(color.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/**
 * The colour to draw a relationship type's dot or graph line with. Near-black
 * types (the built-in "บล็อก" is #171717) vanish on the dark theme, so they
 * follow the foreground instead. Never use this as a text colour.
 */
export function readableTypeColor(color: string): string {
  const value = luminance(color);
  return value !== null && value < 0.05 ? "var(--foreground)" : color;
}
