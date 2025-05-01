import { DriftClient, OrderType, PositionDirection, BN } from "@drift-labs/sdk";

interface BasePerpOrderArgs {
  driftClient: DriftClient;
  marketIndex: number;
  baseSize: number; //e.g. 100 means 100 SOL
  direction: PositionDirection; // LONG | SHORT
}

/** 1. Auction Market Order ---------------------------------------- */
export interface AuctionMarketArgs extends BasePerpOrderArgs {
  startPrice: number;
  endPrice: number;
  finalPrice: number;
  auctionDurationSlots?: number;
  secondsToLive?: number;
}

export const placeAuctionMarketPerpOrder = async ({
  driftClient,
  marketIndex,
  baseSize,
  direction,
  startPrice,
  endPrice,
  finalPrice,
  auctionDurationSlots = 30,
  secondsToLive = 120,
}: AuctionMarketArgs) => {
  const now = Math.floor(Date.now() / 1000);

  const orderParams = {
    orderType: OrderType.MARKET,
    marketIndex,
    direction,
    baseAssetAmount: driftClient.convertToPerpPrecision(baseSize),
    auctionStartPrice: driftClient.convertToPricePrecision(startPrice),
    auctionEndPrice: driftClient.convertToPricePrecision(endPrice),
    price: driftClient.convertToPricePrecision(finalPrice),
    auctionDuration: auctionDurationSlots,
    maxTs: new BN(now + secondsToLive),
  };

  const order = await driftClient.placePerpOrder(orderParams);
  console.log("order", order);
  return order;
};

export interface LimitOrderArgs extends BasePerpOrderArgs {
  limitPrice: number;
}

export const placeLimitPerpOrder = async ({
  driftClient,
  marketIndex,
  baseSize,
  direction,
  limitPrice,
}: LimitOrderArgs) => {
  const orderParams = {
    orderType: OrderType.LIMIT,
    marketIndex,
    direction,
    baseAssetAmount: driftClient.convertToPerpPrecision(baseSize),
    price: driftClient.convertToPricePrecision(limitPrice),
  };

  return driftClient.placePerpOrder(orderParams);
};

export interface OracleOffsetOrderArgs extends BasePerpOrderArgs {
  priceOffset: number; // +0.05 → bid above oracle by 5 cents
}

export const placeOracleOffsetPerpOrder = async ({
  driftClient,
  marketIndex,
  baseSize,
  direction,
  priceOffset,
}: OracleOffsetOrderArgs) => {
  const orderParams = {
    orderType: OrderType.LIMIT,
    marketIndex,
    direction,
    baseAssetAmount: driftClient.convertToPerpPrecision(baseSize),
    oraclePriceOffset: driftClient
      .convertToPricePrecision(priceOffset)
      .toNumber(),
  };

  return driftClient.placePerpOrder(orderParams);
};
