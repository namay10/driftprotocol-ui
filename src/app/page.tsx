import WalletConnectButton from "./components/WalletConnectbutton";
import { SubaccountDetails } from "./components/SubaccountDetails";
import { DepositWithdrawForm } from "./components/DepositWithdraw";
import PerpOrderPanel from "./components/PerpOrderPanel";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl text-white mb-4">Drift Subaccounts Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl">
        <div className="bg-gray-800 p-4 rounded-lg">
          <SubaccountDetails />
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <DepositWithdrawForm />
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <PerpOrderPanel />
        </div>
      </div>
    </main>
  );
}
