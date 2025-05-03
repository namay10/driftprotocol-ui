import React, { useEffect, useState } from "react";
import { useDriftStore } from "../store/userdriftstore";
import toast from "react-hot-toast";

const CreateAccount: React.FC = () => {
  const { driftClient, currentSubaccountId, refreshUser, walletAdapter } =
    useDriftStore();

  const [subaccountExists, setSubaccountExists] = useState<boolean | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driftClient) return;
    try {
      const exists = driftClient.hasUser(currentSubaccountId);
      setSubaccountExists(exists);
    } catch (e) {
      setSubaccountExists(false);
    }
  }, [driftClient, currentSubaccountId]);

  const handleInitialize = async () => {
    if (!driftClient || !walletAdapter) {
      setError("Drift client or wallet not initialized");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Initialize subaccount
      await driftClient.initializeUserAccount(
        currentSubaccountId,
        "subaccount"
      );
      toast.success("Subaccount initialized!");
      // 3. Refresh user data
      await refreshUser();
      setSubaccountExists(true);
    } catch (e: any) {
      setError(e.message || "Failed to initialize and deposit");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-xl shadow-lg p-6 mt-10 border border-gray-700">
      <div className="mb-4 flex justify-between items-center">
        <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
          Airdrop SOL
        </span>
        <span className="text-gray-400 text-xs">
          Subaccount {currentSubaccountId}
        </span>
      </div>
      <h2 className="text-lg font-semibold mb-2">Initialize Subaccount</h2>
      <p className="text-gray-400 mb-4 text-sm">
        To start using Drift, you need to create a Account.
      </p>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        onClick={handleInitialize}
        disabled={loading}
      >
        {loading ? "Processing..." : "Initialize Account "}
      </button>
    </div>
  );
};

export default CreateAccount;
