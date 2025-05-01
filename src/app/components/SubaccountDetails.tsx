"use client";
import { useEffect, useMemo, useState } from "react";
import { useDriftStore } from "@/app/store/userdriftstore";
import {
  BN,
  getTokenAmount,
  SpotBalanceType,
  LAMPORTS_PRECISION,
  QUOTE_PRECISION,
  PRICE_PRECISION,
} from "@drift-labs/sdk";

export default function SubaccountDetails() {
  const {
    user,
    driftClient,
    currentSubaccountId,
    setSubaccountId,
    refreshUser,
  } = useDriftStore();

  const [refreshing, setRefreshing] = useState(false);

  const subaccounts = useMemo(() => {
    if (!driftClient) return [];
    return [...driftClient.users.values()].map(
      (u) => [Number(u.getUserAccount().subAccountId), u] as const
    );
  }, [driftClient]);

  const selectedSubUser = useMemo(() => {
    if (!driftClient) return undefined;
    return driftClient.getUser(currentSubaccountId);
  }, [driftClient, currentSubaccountId]);

  const orders = useMemo(() => {
    if (!selectedSubUser) return [];
    return selectedSubUser
      .getUserAccount()
      .orders.filter((o) => o.orderId !== 0);
  }, [selectedSubUser]);

  const priceUsd = useMemo(() => {
    if (!driftClient) return 0;
    return (
      driftClient.getOracleDataForSpotMarket(1).price.toNumber() /
      PRICE_PRECISION.toNumber()
    );
  }, [driftClient]);

  const solBalance = useMemo(() => {
    if (!selectedSubUser || !driftClient) return 0;
    const pos = selectedSubUser.getSpotPosition(1);
    const lamports = getTokenAmount(
      pos!.scaledBalance,
      driftClient?.getSpotMarketAccount(1)!,
      SpotBalanceType.DEPOSIT
    );
    return lamports.toNumber() / LAMPORTS_PRECISION.toNumber();
  }, [selectedSubUser, driftClient]);

  const collateralUsd = useMemo(() => {
    if (!selectedSubUser) return 0;
    return (
      selectedSubUser.getTotalCollateral().toNumber() /
      QUOTE_PRECISION.toNumber()
    );
  }, [selectedSubUser]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  if (subaccounts.length === 0) {
    return <div className="p-4 text-center">No subaccount loaded</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Subaccount Details</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Subaccount</label>
        <select
          value={currentSubaccountId}
          onChange={(e) => setSubaccountId(Number(e.target.value))}
          className="w-full bg-gray-700 p-2 rounded border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        >
          {subaccounts.map(([id]) => (
            <option key={id} value={id}>
              Subaccount {id}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoCard
          label="SOL Balance"
          value={`${solBalance.toFixed(4)} SOL`}
          className="bg-gray-700"
        />
        <InfoCard
          label="Total Collateral"
          value={`$${collateralUsd.toFixed(2)}`}
          className="bg-gray-700"
        />
        <InfoCard
          label="Oracle Price"
          value={`$${priceUsd.toFixed(2)} /SOL`}
          className="bg-gray-700"
        />
        <InfoCard
          label="Health"
          value={selectedSubUser ? selectedSubUser.getHealth().toFixed(2) : "0"}
          className="bg-gray-700"
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-semibold">Orders</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <Th>Market</Th>
                <Th>Side</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Limit</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-900">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    No orders
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => {
                  const orderType = Object.keys(order.orderType)[0];
                  const side = Object.keys(order.direction)[0];
                  const status = Object.keys(order.status)[0];
                  const size = (order.baseAssetAmount.toNumber() / 1e9).toFixed(
                    4
                  );
                  const limit = (order.price.toNumber() / 1e9).toFixed(3);
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-800 transition-colors"
                    >
                      <Td>{orderType}</Td>
                      <Td
                        className={`capitalize ${
                          side.toLowerCase() === "long"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {side}
                      </Td>
                      <Td className="capitalize">{orderType}</Td>
                      <Td>{size}</Td>
                      <Td>{limit}</Td>
                      <Td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            status.toLowerCase() === "open"
                              ? "bg-green-500/20 text-green-400"
                              : status.toLowerCase() === "filled"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {status}
                        </span>
                      </Td>
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
}

function InfoCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`p-3 rounded-lg ${className}`}>
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
