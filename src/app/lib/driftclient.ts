import { Connection } from "@solana/web3.js";
import { DriftClient, User } from "@drift-labs/sdk";
import { DriftWalletAdapterWrapper } from "../lib/driftWalletWrapper";
import { WalletContextState } from "@solana/wallet-adapter-react";

const RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;

// Initialize Drift Client
export const initializeDriftClient = async (
  adapter: WalletContextState
): Promise<DriftClient> => {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const wrappedWallet = new DriftWalletAdapterWrapper(adapter);

  const driftClient = new DriftClient({
    connection,
    wallet: wrappedWallet,
    env: "devnet",
  });

  await driftClient.subscribe();
  console.log("✅ DriftClient initialized", driftClient);
  return driftClient;
};

// Initialize Subaccount
export const initializeUserAccount = async (
  driftClient: DriftClient,
  subAccountId: number
) => {
  const [txSig, userPubKey] = await driftClient.initializeUserAccount(
    subAccountId,
    "subaccount"
  );
  console.log("✅ User initialized:", txSig);
  return userPubKey;
};

// Get a User (subaccount)
export const getUserSubaccount = async (
  driftClient: DriftClient,
  subAccountId: number
): Promise<User> => {
  const user = driftClient.getUser(subAccountId);
  await user.subscribe();
  return user;
};

// Deposit
export const depositToUser = async (
  driftClient: DriftClient,
  amount: number,
  marketIndex: number,
  subAccountId: number
) => {
  const finalAmount = driftClient.convertToSpotPrecision(marketIndex, amount);
  const ata = await driftClient.getAssociatedTokenAccount(marketIndex);
  await driftClient.deposit(finalAmount, marketIndex, ata, subAccountId);
  console.log(
    `✅ Deposited ${amount} to market ${marketIndex} for subaccount ${subAccountId}`
  );
};

// Withdraw
export const withdrawFromUser = async (
  driftClient: DriftClient,
  amount: number,
  marketIndex: number
) => {
  const finalAmount = driftClient.convertToSpotPrecision(marketIndex, amount);
  const ata = await driftClient.getAssociatedTokenAccount(marketIndex);
  await driftClient.withdraw(finalAmount, marketIndex, ata);
  console.log(
    `✅ Withdrew ${amount} from market ${marketIndex} for subaccount `
  );
};
