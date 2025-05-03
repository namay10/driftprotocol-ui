import React, { useState } from "react";
import { useDriftStore } from "../store/userdriftstore";
import toast from "react-hot-toast";

interface SubaccountModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_SUBACCOUNTS = 8;

const SubaccountModal: React.FC<SubaccountModalProps> = ({ open, onClose }) => {
  const { driftClient, refreshUser, walletAdapter } = useDriftStore();
  const usersLength = driftClient?.getUsers().length || 0;
  const nextSubaccountId = usersLength;
  const canAdd = usersLength < MAX_SUBACCOUNTS;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!driftClient || !walletAdapter) {
      setError("Drift client or wallet not initialized");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await driftClient.initializeUserAccount(nextSubaccountId, "subaccount");
      toast.success(`Subaccount ${nextSubaccountId} initialized!`);
      await refreshUser();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to initialize subaccount");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal content */}
        <div
          className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md mx-auto p-6 relative z-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Add New Subaccount
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          <div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-1">
                Next Subaccount ID
              </label>
              <input
                type="number"
                value={nextSubaccountId}
                readOnly
                className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Max 8 subaccounts allowed per user.
              </p>
            </div>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
              onClick={handleCreate}
              disabled={loading || !canAdd}
            >
              {loading
                ? "Processing..."
                : `Create Subaccount ${nextSubaccountId}`}
            </button>
            {!canAdd && (
              <div className="text-yellow-400 text-xs mt-3">
                You have reached the maximum number of subaccounts.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SubaccountModal;
