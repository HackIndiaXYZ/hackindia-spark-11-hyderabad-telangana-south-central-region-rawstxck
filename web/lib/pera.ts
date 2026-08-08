import { PeraWalletConnect } from "@perawallet/connect";

let peraWalletInstance: PeraWalletConnect | null = null;

export function getPeraWallet() {
  if (typeof window === "undefined") {
    return null; // SSR safety
  }
  if (!peraWalletInstance) {
    peraWalletInstance = new PeraWalletConnect({ chainId: 416002 });
  }
  return peraWalletInstance;
}
