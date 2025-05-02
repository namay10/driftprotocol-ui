"use client";
import { useState } from "react";
import { useDriftStore } from "@/app/store/userdriftstore";
import {
  getTokenAmount,
  SpotBalanceType,
  LAMPORTS_PRECISION,
  QUOTE_PRECISION,
} from "@drift-labs/sdk";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import toast from "react-hot-toast";

export default function InputWalletData() {
  const { driftClient } = useDriftStore();
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletData, setWalletData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWalletData(null);

    try {
      if (!walletAddress || walletAddress.length !== 44) {
        toast.error("Please enter a valid Solana wallet address");
        return;
      }

      const publicKey = new PublicKey(walletAddress);
      const connection = new Connection(
        `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
      );

      const balance = await connection.getBalance(publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;

      const data = {
        solBalance,
        hasDriftData: false,
      };

      if (driftClient) {
        try {
          const user = await driftClient.getUser(0, publicKey);
          if (user) {
            const solPosition = user.getSpotPosition(1);
            const spotMarket = driftClient.getSpotMarketAccount(1);

            if (solPosition && spotMarket) {
              const driftSolBalance =
                getTokenAmount(
                  solPosition.scaledBalance,
                  spotMarket,
                  SpotBalanceType.DEPOSIT
                ).toNumber() / LAMPORTS_PRECISION.toNumber();

              const collateralUsd =
                user.getTotalCollateral().toNumber() /
                QUOTE_PRECISION.toNumber();
              const health = user.getHealth().toFixed(2);
              const totalDeposits = user
                .getUserAccount()
                .totalDeposits.toNumber();
              const totalWithdraws = user
                .getUserAccount()
                .totalWithdraws.toNumber();

              Object.assign(data, {
                hasDriftData: true,
                driftSolBalance,
                collateralUsd,
                health,
                totalDeposits,
                totalWithdraws,
              });
              toast.success("Successfully fetched wallet data");
            }
          } else {
            toast.error("No Drift account found for this wallet", {
              icon: "⚠️",
            });
          }
        } catch (driftError) {
          console.warn("Failed to fetch Drift data:", driftError);
          toast.error("Could not fetch Drift data", { icon: "⚠️" });
        }
      }

      setWalletData(data);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch wallet data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <h3 className="text-lg font-semibold mb-4">Wallet Data Lookup</h3>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label
            htmlFor="walletAddress"
            className="block text-sm text-gray-400 mb-1"
          >
            Wallet Address
          </label>
          <input
            type="text"
            id="walletAddress"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Solana wallet address"
            className="w-full bg-gray-700 p-2 rounded text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {loading ? "Loading..." : "Lookup"}
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {walletData && (
        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            <h4 className="text-md font-semibold">Solana Wallet Data</h4>
            <InfoRow
              label="SOL Balance"
              value={`${walletData.solBalance.toFixed(4)} SOL`}
            />
          </div>

          {walletData.hasDriftData ? (
            <div className="space-y-2 text-sm">
              <h4 className="text-md font-semibold">Drift Protocol Data</h4>
              <InfoRow
                label="Drift SOL Balance"
                value={`${walletData.driftSolBalance.toFixed(4)} SOL`}
              />
              <InfoRow
                label="Total Collateral"
                value={`$${walletData.collateralUsd.toFixed(2)}`}
              />
              <InfoRow label="Health" value={walletData.health} />
              <InfoRow
                label="Total Deposits"
                value={walletData.totalDeposits}
              />
              <InfoRow
                label="Total Withdrawals"
                value={walletData.totalWithdraws}
              />
            </div>
          ) : (
            <div className="text-red-500">Drift Account Not Found</div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
