"use client";
import React, { useEffect, useMemo, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { useDriftStore } from "@/app/store/userdriftstore";

import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;
export default function WalletContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DriftInitializer>{children}</DriftInitializer>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function DriftInitializer({ children }: { children: ReactNode }) {
  const walletAdapter = useWallet(); // gets WalletContextState
  const { connected, publicKey, signTransaction } = walletAdapter;

  const { initClient, refreshUser } = useDriftStore();

  useEffect(() => {
    const setup = async () => {
      if (!connected || !publicKey || !signTransaction) return;

      try {
        await initClient(walletAdapter);
        await refreshUser();
      } catch (err) {
        console.error("Failed to init Drift:", err);
      }
    };

    setup();
  }, [
    connected,
    publicKey,
    signTransaction,
    initClient,
    refreshUser,
    walletAdapter,
  ]);

  return <>{children}</>;
}
