"use client";
import { useEffect, useMemo, useState } from "react";
import { PositionDirection } from "@drift-labs/sdk";
import { useDriftStore } from "@/app/store/userdriftstore";
import toast from "react-hot-toast";

/**
 * PerpOrderPanel – UI form to create Drift perp orders (limit, auction‑market, oracle‑offset)
 * Designed for quick drop‑in into any page.tsx. Tailwind, minimal dependencies.
 */

// Define order type constants
const ORDER_TYPE = {
  MARKET: 0,
  LIMIT: 1,
  ORACLE_OFFSET: 2,
};

export default function PerpOrderPanel() {
  /** ─────────────── Store hooks ─────────────── */
  const {
    currentMarketIndex,
    oraclePrices,
    placeLimitOrder,
    placeAuctionMarketOrder,
    placeOracleOffsetOrder,
  } = useDriftStore();

  /** ─────────────── Local state ─────────────── */
  const [orderType, setOrderType] = useState<number>(ORDER_TYPE.MARKET);
  const [direction, setDirection] = useState<PositionDirection>(
    PositionDirection.LONG
  );
  const [size, setSize] = useState<string>(""); // human units

  /* Price state – varies per order type */
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [auctionStart, setAuctionStart] = useState<string>("");
  const [auctionEnd, setAuctionEnd] = useState<string>("");
  const [auctionFinal, setAuctionFinal] = useState<string>("");
  const [priceOffset, setPriceOffset] = useState<string>(""); // oracle offset

  /** ─────────────── Derived helpers ─────────────── */
  const oraclePrice = oraclePrices[currentMarketIndex] ?? 0;

  // When switching to LIMIT, pre‑fill with oraclePrice for convenience
  useEffect(() => {
    if (orderType === ORDER_TYPE.LIMIT) {
      setLimitPrice(oraclePrice.toString());
    } else if (orderType === ORDER_TYPE.MARKET) {
      // sensible defaults: ±0.1 range around oracle
      setAuctionStart((oraclePrice * 0.995).toFixed(2));
      setAuctionEnd((oraclePrice * 1.005).toFixed(2));
      setAuctionFinal((oraclePrice * 1.01).toFixed(2));
    }
  }, [orderType, oraclePrice]);

  /** ─────────────── Submit handler ─────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const baseSize = Number(size);
    if (!baseSize || baseSize <= 0) {
      toast.error("Enter a valid size");
      return;
    }

    try {
      console.log("orderType", orderType, typeof orderType);

      switch (orderType) {
        case ORDER_TYPE.LIMIT: {
          const priceNum = Number(limitPrice);
          if (!priceNum) throw new Error("Invalid limit price");
          console.log("Placing limit order with:", {
            marketIndex: currentMarketIndex,
            baseSize,
            direction,
            limitPrice: priceNum,
          });
          await placeLimitOrder({
            marketIndex: currentMarketIndex,
            baseSize,
            direction,
            limitPrice: priceNum,
          });
          break;
        }
        case ORDER_TYPE.MARKET: {
          const start = Number(auctionStart);
          const end = Number(auctionEnd);
          const final = Number(auctionFinal);
          if (!start || !end || !final)
            throw new Error("Fill all auction price fields");
          console.log("Placing market order with:", {
            marketIndex: currentMarketIndex,
            baseSize,
            direction,
            startPrice: start,
            endPrice: end,
            finalPrice: final,
          });
          await placeAuctionMarketOrder({
            marketIndex: currentMarketIndex,
            baseSize,
            direction,
            startPrice: start,
            endPrice: end,
            finalPrice: final,
          });
          break;
        }
        case ORDER_TYPE.ORACLE_OFFSET: {
          const offset = Number(priceOffset);
          if (!offset) throw new Error("Invalid price offset");
          console.log("Placing oracle offset order with:", {
            marketIndex: currentMarketIndex,
            baseSize,
            direction,
            priceOffset: offset,
          });
          await placeOracleOffsetOrder({
            marketIndex: currentMarketIndex,
            baseSize,
            direction,
            priceOffset: offset,
          });
          break;
        }
        default:
          throw new Error(`Unsupported order type: ${orderType}`);
      }

      toast.success("✅ Order placed");
      // reset size only, keep price handy for next order
      setSize("");
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error(err.message || "Order failed");
    }
  };

  /** ─────────────── UI elements ─────────────── */
  const labelCls = "block text-sm text-gray-400 mb-1";
  const inputCls =
    "w-full bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 rounded-xl p-6 space-y-6 shadow-lg max-w-md mx-auto"
    >
      <h3 className="text-lg font-semibold text-center mb-2">
        Place Perp Order
      </h3>

      {/* Order type */}
      <div>
        <label className={labelCls}>Order Type</label>
        <select
          value={orderType}
          onChange={(e) => {
            const value = Number(e.target.value);
            console.log("Selected order type:", value, typeof value);
            setOrderType(value);
          }}
          className={inputCls}
        >
          <option value={ORDER_TYPE.LIMIT}>Limit</option>
          <option value={ORDER_TYPE.MARKET}>Auction‑Market</option>
          <option value={ORDER_TYPE.ORACLE_OFFSET}>Oracle Offset</option>
        </select>
      </div>

      {/* Direction */}
      <div className="grid grid-cols-2 gap-4">
        {[PositionDirection.LONG, PositionDirection.SHORT].map((dir) => (
          <button
            type="button"
            key={dir === PositionDirection.LONG ? "long" : "short"}
            onClick={() => setDirection(dir)}
            className={`py-2 rounded text-sm font-medium border transition-colors ${
              direction === dir
                ? "bg-blue-600 border-blue-700"
                : "bg-gray-700 border-gray-600 hover:bg-gray-600"
            }`}
          >
            {dir === PositionDirection.LONG ? "Long" : "Short"}
          </button>
        ))}
      </div>

      {/* Size */}
      <div>
        <label className={labelCls}>Size (base units)</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="100"
          className={inputCls}
        />
      </div>

      {/* Price inputs conditional */}
      {orderType === ORDER_TYPE.LIMIT && (
        <div>
          <label className={labelCls}>Limit Price</label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className={inputCls}
          />
        </div>
      )}

      {orderType === ORDER_TYPE.MARKET && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Start</label>
            <input
              type="number"
              value={auctionStart}
              onChange={(e) => setAuctionStart(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End</label>
            <input
              type="number"
              value={auctionEnd}
              onChange={(e) => setAuctionEnd(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Final</label>
            <input
              type="number"
              value={auctionFinal}
              onChange={(e) => setAuctionFinal(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {orderType === ORDER_TYPE.ORACLE_OFFSET && (
        <div>
          <label className={labelCls}>Offset from Oracle (±)</label>
          <input
            type="number"
            value={priceOffset}
            onChange={(e) => setPriceOffset(e.target.value)}
            placeholder="0.05"
            className={inputCls}
          />
          <p className="text-xs text-gray-500 mt-1">
            Current oracle price:{" "}
            <span className="font-mono">{oraclePrice.toFixed(2)}</span>
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold"
      >
        Submit Order
      </button>
    </form>
  );
}
