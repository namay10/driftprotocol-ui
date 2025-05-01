"use client";

import WalletConnectButton from "./components/WalletConnectbutton";
import SubaccountDetails from "./components/SubaccountDetails";
import { DepositWithdrawForm } from "./components/DepositWithdraw";
import PerpOrderPanel from "./components/PerpOrderPanel";
import React from "react";
import InputWalletData from "./components/InputWalletData";

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`h-full rounded-xl border border-gray-700 bg-gray-800/60 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-gray-600 hover:shadow-xl ${className}`}
  >
    {children}
  </div>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Sticky header with glass effect */}
      <header className="sticky top-0 z-10 w-full border-b border-gray-800 bg-gray-900/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold md:text-2xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Drift Sub-Accounts Dashboard
            </h1>
            <span className="hidden md:inline-block px-2 py-1 text-xs font-medium text-gray-400 border border-gray-700 rounded-full">
              Devnet
            </span>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      {/* Main content with responsive grid */}
      <section className="mx-auto w-full max-w-7xl p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main trading interface */}
          <div className="lg:col-span-8 grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <SubaccountDetails />
            </Card>
            <Card>
              <DepositWithdrawForm />
            </Card>
            <Card>
              <PerpOrderPanel />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <InputWalletData />
            </Card>
            {/* Additional widgets can be added here */}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Built with ❤️ By Namay Gupta</p>
        </footer>
      </section>
    </main>
  );
}
