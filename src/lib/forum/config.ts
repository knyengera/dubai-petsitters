export const FORUM_PAGE_SIZE = 15;

/** Shared forum UI tokens aligned with site theme (primary pink, secondary brown, accent coral). */
export const FORUM_TABLE_HEADER_CLASS =
  "bg-secondary text-secondary-foreground";

export const FORUM_TITLE_LINK_CLASS =
  "font-heading font-semibold text-foreground hover:text-primary transition-colors";

export const FORUM_STATS_CARD_CLASS =
  "bg-gradient-to-br from-primary to-secondary text-primary-foreground";

export const FORUM_STATS_LABEL_CLASS = "text-primary-foreground/75";

export const BOARD_COLORS: Record<string, string> = {
  blue: "bg-primary/10 text-primary",
  pink: "bg-primary/10 text-primary",
  primary: "bg-primary/10 text-primary",
  green: "bg-accent/20 text-[hsl(15_55%_38%)]",
  red: "bg-destructive/10 text-destructive",
  indigo: "bg-secondary/10 text-secondary",
  purple: "bg-primary/15 text-primary",
  amber: "bg-accent/25 text-[hsl(30_45%_32%)]",
  slate: "bg-muted text-muted-foreground",
  secondary: "bg-secondary/10 text-secondary",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
