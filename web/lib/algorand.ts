import algosdk from "algosdk";

// TestNet only — this whole feature is a demo payment method, never MainNet.
export const algodClient = new algosdk.Algodv2(
  "", // no token needed for AlgoNode's free public endpoint
  "https://testnet-api.algonode.cloud",
  ""
);

export const indexerClient = new algosdk.Indexer(
  "",
  "https://testnet-idx.algonode.cloud",
  ""
);

export const RECEIVER_ADDRESS = process.env.ALGORAND_RECEIVER_ADDRESS || "DUMMY_ADDRESS";
// Note: We only warn if not running in the browser.
if (typeof window === "undefined" && !process.env.ALGORAND_RECEIVER_ADDRESS) {
  console.warn("ALGORAND_RECEIVER_ADDRESS is not set — falling back to DUMMY_ADDRESS for build. Payments will fail.");
}
