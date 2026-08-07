import algosdk from 'algosdk';

const token = '';
const server = 'https://testnet-api.algonode.cloud';
const port = 443;
const algodClient = new algosdk.Algodv2(token, server, port);

export async function attestScan(scanHash: string, passed: boolean): Promise<string> {
  const mnemonic = process.env.ALGO_MNEMONIC;
  const appIdStr = process.env.ALGO_APP_ID;

  if (!mnemonic || !appIdStr) {
    throw new Error('Missing ALGO_MNEMONIC or ALGO_APP_ID in environment');
  }

  const appId = parseInt(appIdStr, 10);
  const account = algosdk.mnemonicToSecretKey(mnemonic);

  const params = await algodClient.getTransactionParams().do();

  const arg0 = new Uint8Array(Buffer.from('attest'));
  const arg1 = new Uint8Array(Buffer.from(scanHash, 'hex'));
  const arg2 = new Uint8Array([passed ? 1 : 0]);

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: account.addr,
    appIndex: appId,
    suggestedParams: params,
    appArgs: [arg0, arg1, arg2],
    boxes: [{
      appIndex: appId,
      name: arg1 // box name is the scan hash itself
    }]
  });

  const signedTxn = txn.signTxn(account.sk);
  const txInfo = await algodClient.sendRawTransaction(signedTxn).do();

  // Return immediately without waiting to avoid blocking the API response
  return txInfo.txid || (txInfo as any).txid;
}
