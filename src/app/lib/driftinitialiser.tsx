"use client";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  DriftClient,
  Wallet as DriftWallet,
  getUserAccountsForAuthority,
} from "@drift-labs/sdk";
import { useDriftStore } from "@/store/driftStore";

export function DriftInitializer({ children }: { children: React.ReactNode }) {
  const { publicKey, signTransaction, connected } = useWallet();

  const setDriftClient = useDriftStore((s) => s.setDriftClient);
  const setUserStats = useDriftStore((s) => s.setUserStats);
  const setSubAccounts = useDriftStore((s) => s.setSubAccounts);

  useEffect(() => {
    const init = async () => {
      if (!connected || !publicKey || !signTransaction) return;

      const connection = new Connection(
        "https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY",
        "confirmed"
      );

      const wallet = new DriftWallet({
        publicKey,
        signTransaction,
      });

      const driftClient = new DriftClient({
        connection,
        wallet,
        env: "mainnet-beta",
      });

      await driftClient.subscribe();
      setDriftClient(driftClient);

      const stats = await driftClient.getUserStatsAccount();
      setUserStats(stats);

      const users = await getUserAccountsForAuthority(
        driftClient.program,
        publicKey
      );
      setSubAccounts(users);
    };

    init();
  }, [publicKey, connected, signTransaction]);

  return <>{children}</>;
}
