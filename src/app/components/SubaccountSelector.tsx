"use client";
import { useDriftStore } from "@/app/store/userdriftstore";
import { useMemo } from "react";

const SubaccountList = () => {
  const { user, currentSubaccountId, setSubaccountId, initUser } =
    useDriftStore();

  const subaccounts = useMemo(() => {
    if (!user?.driftClient) return [];
    const usersMap = user.driftClient.users;
    return Array.from(usersMap.entries()); // [ [subAccountId, User], ... ]
  }, [user]);

  const handleSelect = async (subId: number) => {
    setSubaccountId(subId);
    await initUser(); // refresh user data
  };

  if (!subaccounts.length) {
    return (
      <div className="text-sm text-gray-500">
        No subaccounts initialized yet.
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">🧾 Subaccounts</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {subaccounts.map(([subId, subUser]) => {
          const balance = subUser.getTotalCollateral();
          const isActive = Number(subId) === currentSubaccountId;

          return (
            <div
              key={subId}
              className={`rounded-lg border px-4 py-3 shadow-sm cursor-pointer transition duration-200 ${
                isActive
                  ? "bg-blue-50 border-blue-400"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
              onClick={() => handleSelect(Number(subId))}
            >
              <div className="text-sm text-gray-600">Subaccount #{subId}</div>
              <div className="text-md font-bold">
                {/* {formatBNWithMarket(balance, 1)} SOL{" "} */}
                {/* default marketIndex = 1 for SOL */}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {isActive ? "Currently Viewing" : "Click to View"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubaccountList;
