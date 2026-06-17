export function estimateHostClawback(
  refundAmount: number,
  grossAmount: number,
  hostEarnings: number,
  escrowStatus: string
): number {
  if (escrowStatus !== "released" || grossAmount <= 0) return 0;
  return Math.round((refundAmount / grossAmount) * hostEarnings * 100) / 100;
}
