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
import toast from "react-hot-toast";

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

export const useDriftStore = create<DriftState>((set, get) => ({
  driftClient: null,
  user: null,
  walletAdapter: null,
  currentSubaccountId: 0,
  currentMarketIndex: 0, // default to SOL‑PERP (market index 0)
  markets: {},
  oraclePrices: {},

  setSubaccountId: (id) => set({ currentSubaccountId: id }),
  setMarketIndex: (idx) => set({ currentMarketIndex: idx }),

  //initialize drift client
  initClient: async (walletAdapter) => {
    set({ walletAdapter });

    try {
      const driftClient = await initializeDriftClient(walletAdapter);
      set({ driftClient });
      toast.success("Drift client initialized successfully");

      await get().refreshMarket(0);

      await get().refreshUser();

      const pollInterval = setInterval(async () => {
        await get().refreshMarket(get().currentMarketIndex);
      }, 5000);

      driftClient.eventEmitter.on("error", () => {
        clearInterval(pollInterval);
        toast.error("Drift client connection error");
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize Drift client");
    }
  },

  //refresh user
  refreshUser: async () => {
    const { driftClient, currentSubaccountId } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    try {
      const user = await getUserSubaccount(driftClient, currentSubaccountId);
      set({ user });
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh user data");
    }
  },

  //refresh market
  refreshMarket: async (marketIndexParam) => {
    const marketIndex = marketIndexParam ?? get().currentMarketIndex ?? 0;
    const { driftClient } = get();
    if (!driftClient) return;

    try {
      const acct = driftClient.getPerpMarketAccount(0);
      const oracleData = driftClient.getOracleDataForPerpMarket(0);
      const humanPrice = Number(oracleData.price.toString()) / 1e6;

      if (acct) {
        set((state) => ({
          ...state,
          markets: { ...state.markets, [marketIndex]: acct },
          oraclePrices: { ...state.oraclePrices, [marketIndex]: humanPrice },
        }));
      }
    } catch (err: any) {
      console.error("Failed refreshing market", err);
      toast.error(err.message || "Failed to refresh market data");
    }
  },

  //deposit
  deposit: async (amount) => {
    const { driftClient, currentMarketIndex, currentSubaccountId } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    try {
      await depositToUser(
        driftClient,
        amount,
        currentMarketIndex,
        currentSubaccountId
      );
      await get().refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Deposit failed");
      throw err;
    }
  },

  //withdraw
  withdraw: async (amount) => {
    const { driftClient, currentMarketIndex } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    try {
      await withdrawFromUser(driftClient, amount, currentMarketIndex);
      await get().refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
      throw err;
    }
  },

  //place auction market order
  placeAuctionMarketOrder: async (args) => {
    const { driftClient } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    try {
      await placeAuctionMarketPerpOrder({ ...args, driftClient });
      await get().refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to place auction market order");
      throw err;
    }
  },

  //place limit order
  placeLimitOrder: async (args) => {
    const { driftClient } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    try {
      await placeLimitPerpOrder({ ...args, driftClient });
      await get().refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to place limit order");
      throw err;
    }
  },

  //place oracle offset order
  placeOracleOffsetOrder: async (args) => {
    const { driftClient } = get();
    if (!driftClient) throw new Error("DriftClient not initialised");

    try {
      await placeOracleOffsetPerpOrder({ ...args, driftClient });
      await get().refreshUser();
    } catch (err: any) {
      toast.error(err.message || "Failed to place oracle offset order");
      throw err;
    }
  },
}));
