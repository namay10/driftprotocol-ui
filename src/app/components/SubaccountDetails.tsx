"use client";
import { useMemo, useState } from "react";
import { useDriftStore } from "@/app/store/userdriftstore";

export const SubaccountDetails = () => {
  const {
    user,
    driftClient,
    currentSubaccountId,
    setSubaccountId,
    refreshUser,
  } = useDriftStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // const subaccounts = useMemo(() => {
  //   if (!user?.driftClient) return [];
  //   return Array.from(user.driftClient.users.entries()); // [ [subId, User], ... ]
  // }, [user]);
  const subaccounts = useMemo(() => {
    if (!driftClient) return [];

    return Array.from(driftClient.users.values()).map((u) => {
      const id = Number(u.getUserAccount().subAccountId); // BN → number 0-7
      return [id, u] as const;
    });
  }, [driftClient]);
  // console.log("orders", user?.getOrderByUserOrderId(currentSubaccountId));
  // console.log("openorders", driftClient?.getPerpMarketAccount(0));
  const selectedSubUser = driftClient?.getUser(currentSubaccountId);
  const orders =
    selectedSubUser
      ?.getUserAccount()
      .orders.filter((order) => order.orderId !== 0) ?? [];
  console.log("orders", orders);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  };

  if (subaccounts.length === 0) {
    return <div className="p-4 text-center">No subaccount loaded</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Subaccount Details</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-blue-600 px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Subaccount</label>
        <select
          value={currentSubaccountId}
          onChange={(e) => setSubaccountId(parseInt(e.target.value))}
          className="w-full bg-gray-700 p-2 rounded"
        >
          {subaccounts.map(([id, _u]) => (
            <option key={`sub-${id}`} value={id}>
              Subaccount{id}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Total Collateral:</span>
          {selectedSubUser ? (
            <span>
              {selectedSubUser.getTotalCollateral().toNumber() / 1e7} SOL
            </span>
          ) : (
            <span>0 SOL</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Open Positions:</span>
          {selectedSubUser ? (
            <span>{selectedSubUser.getOpenOrders().length}</span>
          ) : (
            <span>0</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Health:</span>
          {selectedSubUser ? (
            <span>{selectedSubUser.getHealth().toFixed(2)}</span>
          ) : (
            <span>0</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Perp Market:</span>
          {selectedSubUser ? (
            <span>{selectedSubUser.getHealth().toFixed(2)}</span>
          ) : (
            <span>0</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Health:</span>
          {selectedSubUser ? (
            <span>{selectedSubUser.getHealth().toFixed(2)}</span>
          ) : (
            <span>0</span>
          )}
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-2">Orders</h4>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-gray-900 text-white text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-3 py-2 text-left">Market</th>
                <th className="px-3 py-2 text-left">Direction</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left"> Ordered</th>
                <th className="px-3 py-2 text-left">Limit</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-400">
                    No orders
                  </td>
                </tr>
              ) : (
                orders.map((order: any, idx: number) => {
                  // Helper mappings
                  const orderTypeMap: { [key: string]: string } = {
                    limit: "Limit",
                    market: "Market",
                    trigger: "Trigger",
                    oracle: "Oracle",
                  };
                  const directionMap: { [key: string]: string } = {
                    long: "Long",
                    short: "Short",
                  };
                  const statusMap: { [key: string]: string } = {
                    open: "Open",
                    filled: "Filled",
                    canceled: "Cancelled",
                  };

                  // Get the key of the object (e.g., "limit" for orderType)
                  const getKey = (obj: any) =>
                    obj && typeof obj === "object"
                      ? Object.keys(obj)[0]
                      : undefined;

                  const orderTypeKey = getKey(order.orderType);
                  const directionKey = getKey(order.direction);
                  const statusKey = getKey(order.status);

                  const orderType = orderTypeMap[orderTypeKey!!] || "Unknown";
                  const direction = directionMap[directionKey!!] || "Unknown";
                  const status = statusMap[statusKey!!] || "Unknown";

                  // BN formatting helpers
                  const formatBN = (
                    bn: any,
                    marketIndex = 1,
                    precision = 4
                  ) => {
                    if (!bn || typeof bn.toNumber !== "function") return "0";
                    const decimals = marketIndex === 1 ? 9 : 6;
                    return (bn.toNumber() / 10 ** decimals).toFixed(precision);
                  };

                  // Filled/Ordered

                  const ordered = formatBN(
                    order.baseAssetAmount,
                    order.marketIndex
                  );
                  // Limit price
                  const limit = formatBN(order.price, order.marketIndex, 3);
                  // Avg Fill Price (not available in order object, so '-')

                  return (
                    <tr
                      key={idx}
                      className="border-b border-gray-800 hover:bg-gray-800"
                    >
                      <td className="px-3 py-2">{orderType}</td>
                      <td className="px-3 py-2">{direction}</td>
                      <td className="px-3 py-2">{orderType}</td>
                      <td className="px-3 py-2">{ordered}</td>

                      <td className="px-3 py-2">{limit}</td>
                      <td className="px-3 py-2">{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
