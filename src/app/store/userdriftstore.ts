// app/store/userdriftstore.ts

/**
 * Zustand store that holds the active Drift SDK connection, the selected
 * sub‑account, live market data and convenience actions for perp orders.
 *
 * Responsibilities
 * ──────────────────────────────────────────────────────────
 * • Initialise / reconnect DriftClient once a wallet is available
 * • Keep the selected `User` (sub‑account) in sync
 * • Expose helpers for deposits/withdrawals (already there) + NEW perp orders
 * • Fetch & subscribe live oracle price + perp‑market metadata so the UI never
 *   has to ask the user to type a price again ➜ auto‑populate instead.
 */

import { create } from "zustand";
import { DriftClient, User, PerpMarketAccount } from "@drift-labs/sdk";
import {
  initializeDriftClient,
  getUserSubaccount,
  depositToUser,
  withdrawFromUser,
} from "@/app/lib/driftclient";
import {
  placeAuctionMarketPerpOrder,
  placeLimitPerpOrder,
  placeOracleOffsetPerpOrder,
  AuctionMarketArgs,
  LimitOrderArgs,
  OracleOffsetOrderArgs,
} from "@/app/lib/perporder";
import { WalletContextState } from "@solana/wallet-adapter-react";

/** ──────────────────────────── STATE TYPES ───────────────────────────── */
interface DriftState {
  // Core
  driftClient: DriftClient | null;
  user: User | null;
  walletAdapter: WalletContextState | null;

  // Sub‑account selection
  currentSubaccountId: number;
  setSubaccountId: (id: number) => void;

  // Market selection & live data
  currentMarketIndex: number;
  setMarketIndex: (idx: number) => void;
  markets: Record<number, PerpMarketAccount>;
  oraclePrices: Record<number, number>; // in human units (e.g. 21.52)

  // Lifecycle helpers
  initClient: (walletAdapter: WalletContextState) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMarket: (marketIndex?: number) => Promise<void>;

  // Spot
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;

  // Perp orders
  placeAuctionMarketOrder: (
    args: Omit<AuctionMarketArgs, "driftClient">
  ) => Promise<void>;
  placeLimitOrder: (args: Omit<LimitOrderArgs, "driftClient">) => Promise<void>;
  placeOracleOffsetOrder: (
    args: Omit<OracleOffsetOrderArgs, "driftClient">
  ) => Promise<void>;
}

/** ──────────────────────────── THE STORE ─────────────────────────────── */
export const useDriftStore = create<DriftState>((set, get) => ({
  // ───────────────────── DEFAULT STATE
  driftClient: null,
  user: null,
  walletAdapter: null,
  currentSubaccountId: 0,
  currentMarketIndex: 0, // default to SOL‑PERP (market 0)
  markets: {},
  oraclePrices: {},

  // ───────────────────── MUTATORS
  setSubaccountId: (id) => set({ currentSubaccountId: id }),
  setMarketIndex: (idx) => set({ currentMarketIndex: idx }),

  // ───────────────────── CONNECTION / INIT
  initClient: async (walletAdapter) => {
    set({ walletAdapter });

    const driftClient = await initializeDriftClient(walletAdapter);
    set({ driftClient });

    // Load first market immediately so UI has data
    await get().refreshMarket(0);

    // Load first sub‑account
    await get().refreshUser();

    // Poll for market updates every 5 seconds
    const pollInterval = setInterval(async () => {
      await get().refreshMarket(get().currentMarketIndex);
    }, 5000);

    // Clean up interval on disconnect
    driftClient.eventEmitter.on("error", () => {
      clearInterval(pollInterval);
    });
  },

  // ───────────────────── USER REFRESH
  refreshUser: async () => {
    const { driftClient, currentSubaccountId } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    const user = await getUserSubaccount(driftClient, currentSubaccountId);
    set({ user });
  },

  // ───────────────────── MARKET REFRESH
  refreshMarket: async (marketIndexParam) => {
    const marketIndex = marketIndexParam ?? get().currentMarketIndex ?? 0;
    const { driftClient } = get();
    if (!driftClient) return;

    try {
      const acct = driftClient.getPerpMarketAccount(0);
      console.log("acct", acct);
      const oracleData = driftClient.getOracleDataForPerpMarket(0);
      console.log("oracleData", oracleData);
      // const humanPrice = Number(
      //   driftClient.convertToPricePrecision(oracleData.price)
      // );
      const humanPrice = Number(oracleData.price.toString()) / 1e6; // or 1e8, check your market's precision!
      console.log("humanPrice", humanPrice);

      if (acct) {
        set((state) => ({
          ...state,
          markets: { ...state.markets, [marketIndex]: acct },
          oraclePrices: { ...state.oraclePrices, [marketIndex]: humanPrice },
        }));
      }
    } catch (err) {
      console.error("Failed refreshing market", err);
    }
  },

  // ───────────────────── SPOT TOOLS
  deposit: async (amount) => {
    const { driftClient, currentMarketIndex, currentSubaccountId } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    await depositToUser(
      driftClient,
      amount,
      currentMarketIndex,
      currentSubaccountId
    );
    await get().refreshUser();
  },

  withdraw: async (amount) => {
    const { driftClient, currentMarketIndex } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    await withdrawFromUser(driftClient, amount, currentMarketIndex);
    await get().refreshUser();
  },

  // ───────────────────── PERP ORDER HELPERS
  placeAuctionMarketOrder: async (args) => {
    const { driftClient } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    await placeAuctionMarketPerpOrder({ ...args, driftClient });
    console.log("placed auction market order");
    await get().refreshUser();
  },

  placeLimitOrder: async (args) => {
    const { driftClient } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    await placeLimitPerpOrder({ ...args, driftClient });
    await get().refreshUser();
  },

  placeOracleOffsetOrder: async (args) => {
    const { driftClient } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    await placeOracleOffsetPerpOrder({ ...args, driftClient });
    await get().refreshUser();
  },
}));
