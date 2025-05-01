"use client";
import { useEffect, useMemo, useState } from "react";
import { PositionDirection } from "@drift-labs/sdk";
import { useDriftStore } from "@/app/store/userdriftstore";
import toast from "react-hot-toast";

const ORDER_TYPE = {
  MARKET: 0,
  LIMIT: 1,
  ORACLE_OFFSET: 2,
};

const ORDER_TYPE_LABELS = {
  [ORDER_TYPE.MARKET]: { name: "Auction‑Market", icon: "🏛️" },
  [ORDER_TYPE.LIMIT]: { name: "Limit", icon: "📊" },
  [ORDER_TYPE.ORACLE_OFFSET]: { name: "Oracle Offset", icon: "🎯" },
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    const baseSize = Number(size);
    if (!baseSize || baseSize <= 0) {
      toast.error("Enter a valid size");
      setIsSubmitting(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  /** ─────────────── UI elements ─────────────── */
  const inputClassName =
    "w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all";
  const labelClassName = "block text-sm text-gray-400 mb-2";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Place Perp Order</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Oracle:</span>
          <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
            ${oraclePrice.toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Type */}
        <div className="space-y-2">
          <label className={labelClassName}>Order Type</label>
          <select
            value={orderType}
            onChange={(e) => {
              const value = Number(e.target.value);
              console.log("Selected order type:", value, typeof value);
              setOrderType(value);
            }}
            className={inputClassName}
          >
            {Object.entries(ORDER_TYPE).map(([key, value]) => (
              <option key={key} value={value}>
                {ORDER_TYPE_LABELS[value].icon} {ORDER_TYPE_LABELS[value].name}
              </option>
            ))}
          </select>
        </div>

        {/* Direction */}
        <div className="space-y-2">
          <label className={labelClassName}>Direction</label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-700/50 rounded-lg">
            {[PositionDirection.LONG, PositionDirection.SHORT].map((dir) => (
              <button
                type="button"
                key={dir === PositionDirection.LONG ? "long" : "short"}
                onClick={() => setDirection(dir)}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  direction === dir
                    ? dir === PositionDirection.LONG
                      ? "bg-green-500 text-white shadow-lg"
                      : "bg-red-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {dir === PositionDirection.LONG ? "Long 📈" : "Short 📉"}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <label className={labelClassName}>Size (base units)</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="100"
            className={inputClassName}
          />
        </div>

        {/* Price Inputs */}
        {orderType === ORDER_TYPE.LIMIT && (
          <div className="space-y-2">
            <label className={labelClassName}>Limit Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">$</span>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className={`${inputClassName} pl-8`}
              />
            </div>
          </div>
        )}

        {orderType === ORDER_TYPE.MARKET && (
          <div className="space-y-4">
            <label className={labelClassName}>Auction Prices</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Start
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={auctionStart}
                    onChange={(e) => setAuctionStart(e.target.value)}
                    className={`${inputClassName} pl-8`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={auctionEnd}
                    onChange={(e) => setAuctionEnd(e.target.value)}
                    className={`${inputClassName} pl-8`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Final
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    $
                  </span>
                  <input
                    type="number"
                    value={auctionFinal}
                    onChange={(e) => setAuctionFinal(e.target.value)}
                    className={`${inputClassName} pl-8`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {orderType === ORDER_TYPE.ORACLE_OFFSET && (
          <div className="space-y-2">
            <label className={labelClassName}>Offset from Oracle (±)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">$</span>
              <input
                type="number"
                value={priceOffset}
                onChange={(e) => setPriceOffset(e.target.value)}
                placeholder="0.05"
                className={`${inputClassName} pl-8`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Effective price: $
              {(oraclePrice + Number(priceOffset || 0)).toFixed(2)}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 
            ${
              direction === PositionDirection.LONG
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            `Place ${
              direction === PositionDirection.LONG ? "Long" : "Short"
            } Order`
          )}
        </button>
      </form>
    </div>
  );
}
