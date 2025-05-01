// components/DepositWithdrawForm.tsx
"use client";

import { useState } from "react";
import { useDriftStore } from "@/app/store/userdriftstore";

const marketOptions = [
  { label: "USDC", value: 0, decimals: 6, icon: "💵" },
  { label: "SOL", value: 1, decimals: 9, icon: "◎" },
  { label: "JITO", value: 10, decimals: 6, icon: "🪙" },
];

export const DepositWithdrawForm = () => {
  const [amount, setAmount] = useState("");
  const [marketIndex, setMarketIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  const {
    deposit,
    withdraw,
    setMarketIndex: setStoreMarketIndex,
    currentSubaccountId,
    setSubaccountId,
    driftClient,
  } = useDriftStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setLoading(true);
    setStoreMarketIndex(marketIndex);

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

  const subaccounts = driftClient
    ? Array.from(driftClient.users.values()).map((u) =>
        Number(u.getUserAccount().subAccountId)
      )
    : [];

  const selectedMarket = marketOptions.find((m) => m.value === marketIndex);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Deposit / Withdraw</h3>
        <span className="text-sm text-gray-400">
          Account #{currentSubaccountId}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-700/50 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("deposit")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === "deposit"
                ? "bg-green-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Deposit
          </button>
          <button
            type="button"
            onClick={() => setMode("withdraw")}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              mode === "withdraw"
                ? "bg-red-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Subaccount Selector */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Subaccount</label>
          <select
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            value={currentSubaccountId}
            onChange={(e) => setSubaccountId(Number(e.target.value))}
          >
            {subaccounts.map((id) => (
              <option key={id} value={id}>
                Subaccount {id}
              </option>
            ))}
          </select>
        </div>

        {/* Market Selector */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Token</label>
          <select
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            value={marketIndex}
            onChange={(e) => setMarketIndex(Number(e.target.value))}
          >
            {marketOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              placeholder={`Enter ${selectedMarket?.label} amount`}
              step="any"
              min="0"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              {selectedMarket?.icon}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
            mode === "deposit"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
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
            `${mode === "deposit" ? "Deposit" : "Withdraw"} ${
              selectedMarket?.label
            }`
          )}
        </button>
      </form>
    </div>
  );
};
