// components/DepositWithdrawForm.tsx
"use client";

import { useState } from "react";
import { useDriftStore } from "@/app/store/userdriftstore";

const marketOptions = [
  { label: "USDC", value: 0, decimals: 6 },
  { label: "SOL", value: 1, decimals: 9 },
  { label: "JITO", value: 10, decimals: 6 }, // Example
];

export const DepositWithdrawForm = () => {
  const [amount, setAmount] = useState("");
  const [marketIndex, setMarketIndex] = useState(1); // default to SOL
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  const {
    deposit,
    withdraw,
    setMarketIndex: setStoreMarketIndex,
  } = useDriftStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setLoading(true);
    setStoreMarketIndex(marketIndex); // Sync to Zustand

    try {
      if (mode === "deposit") {
        await deposit(numericAmount);
      } else {
        await withdraw(numericAmount);
      }
      setAmount("");
    } catch (err) {
      console.error("Transaction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-4 rounded-lg shadow "
    >
      <h3 className="text-md font-semibold">💵 Deposit / Withdraw</h3>

      {/* Mode Switch */}
      <div className="flex space-x-4 ">
        <button
          type="button"
          onClick={() => setMode("deposit")}
          className={`px-4 py-2 rounded ${
            mode === "deposit" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => setMode("withdraw")}
          className={`px-4 py-2 rounded ${
            mode === "withdraw" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Market Selector */}
      <div>
        <label className="block text-sm mb-1">Token</label>
        <select
          className="border px-3 py-1 rounded w-full"
          value={marketIndex}
          onChange={(e) => setMarketIndex(Number(e.target.value))}
        >
          {marketOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          placeholder="Enter amount"
          step="any"
          min="0"
        />
      </div>

      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded w-full hover:bg-amber-300"
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : mode === "deposit"
          ? "Deposit"
          : "Withdraw"}
      </button>
    </form>
  );
};
