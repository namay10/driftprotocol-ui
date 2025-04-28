// lib/DriftWalletWrapper.ts
import { IWallet } from "@drift-labs/sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

export class DriftWalletAdapterWrapper implements IWallet {
  private adapter: WalletContextState;

  constructor(adapter: WalletContextState) {
    if (
      !adapter.publicKey ||
      !adapter.signTransaction ||
      !adapter.signAllTransactions
    ) {
      throw new Error("Wallet adapter not fully connected or incompatible");
    }

    this.adapter = adapter;
  }

  get publicKey() {
    return this.adapter.publicKey!;
  }

  async signTransaction(tx: Transaction): Promise<Transaction> {
    if (!this.adapter.signTransaction) {
      throw new Error("signTransaction not implemented");
    }
    return await this.adapter.signTransaction(tx);
  }

  async signAllTransactions(txs: Transaction[]): Promise<Transaction[]> {
    if (!this.adapter.signAllTransactions) {
      throw new Error("signAllTransactions not implemented");
    }
    return await this.adapter.signAllTransactions(txs);
  }
}
