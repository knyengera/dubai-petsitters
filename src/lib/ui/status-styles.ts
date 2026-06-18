/** Brand-aligned status and badge utility classes backed by CSS tokens. */

export const statusBadge = {
  success: "bg-success-muted text-success border border-success-border",
  successSolid: "bg-success text-success-foreground",
  warning: "bg-warning-muted text-warning border border-warning-border",
  warningSolid: "bg-warning text-warning-foreground",
  info: "bg-info-muted text-info border border-info-border",
  infoSolid: "bg-info text-info-foreground",
  destructive:
    "bg-destructive/10 text-destructive border border-destructive/20 dark:bg-destructive/20",
  destructiveSolid: "bg-destructive text-destructive-foreground",
  muted: "bg-muted text-muted-foreground border border-border",
} as const;

export const statusPill = {
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  info: "bg-info-muted text-info",
  destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
} as const;

export const ratingStar = "fill-rating text-rating";
export const ratingStarMuted = "fill-rating-muted text-rating-muted";

export const appointmentStatus = {
  pending: statusBadge.warning,
  confirmed: statusBadge.success,
  completed: statusBadge.info,
  cancelled: statusBadge.destructive,
} as const;

export const bookingStatus = {
  pending: "bg-warning-muted text-warning border-warning-border",
  confirmed: "bg-success-muted text-success border-success-border",
  completed: "bg-info-muted text-info border-info-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

export const lostPetStatus = {
  lost: statusBadge.success,
  found: statusBadge.success,
  reunited: statusBadge.info,
} as const;

export const blogCategoryColor: Record<string, string> = {
  pet_care: "bg-accent text-accent-foreground",
  health: "bg-success text-success-foreground",
  training: "bg-primary text-primary-foreground",
  nutrition: "bg-info text-info-foreground",
  lifestyle: "bg-primary/80 text-primary-foreground",
  news: "bg-warning text-warning-foreground",
};
