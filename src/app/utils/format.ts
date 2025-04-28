import { BN } from "@coral-xyz/anchor";

// Use market-specific decimals
const MARKET_DECIMALS: Record<number, number> = {
  0: 6, // USDC
  1: 9, // SOL
  10: 6, // JITO, example
};

export function formatBNWithMarket(
  bn: BN | undefined,
  marketIndex: number,
  precision = 4
): string {
  if (!bn) return "0.0000";
  const decimals = MARKET_DECIMALS[marketIndex] || 6;
  return (bn.toNumber() / 10 ** decimals).toFixed(precision);
}
  return `${integerPartdeci  malPart}`;
}
