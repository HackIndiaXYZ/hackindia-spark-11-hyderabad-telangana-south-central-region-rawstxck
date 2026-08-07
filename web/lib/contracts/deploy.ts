import algosdk from 'algosdk';
import * as fs from 'fs';
import * as path from 'path';

// Load from .env manually if needed, or rely on process.env
const envPath = path.resolve(__dirname, '../web/.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const token = '';
const server = 'https://testnet-api.algonode.cloud';
const port = 443;
const algodClient = new algosdk.Algodv2(token, server, port);

async function deploy() {
  const mnemonic = process.env.ALGO_MNEMONIC;
  if (!mnemonic) {
    console.error('ALGO_MNEMONIC must be set in web/.env');
    process.exit(1);
  }
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  console.log(`Deploying from account: ${account.addr}`);

  const approvalPath = path.join(__dirname, 'attestation', 'approval.teal');
  const clearPath = path.join(__dirname, 'attestation', 'clear.teal');

  const approvalTeal = fs.readFileSync(approvalPath, 'utf8');
  const clearTeal = fs.readFileSync(clearPath, 'utf8');

  console.log('Compiling TEAL...');
  const compiledApproval = await algodClient.compile(approvalTeal).do();
  const compiledClear = await algodClient.compile(clearTeal).do();

  const approvalBytes = new Uint8Array(Buffer.from(compiledApproval.result, 'base64'));
  const clearBytes = new Uint8Array(Buffer.from(compiledClear.result, 'base64'));

  const params = await algodClient.getTransactionParams().do();

  console.log('Creating application...');
  // Create Application
  const txn = algosdk.makeApplicationCreateTxnFromObject({
    sender: account.addr,
    suggestedParams: params,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    approvalProgram: approvalBytes,
    clearProgram: clearBytes,
    numLocalInts: 0,
    numLocalByteSlices: 0,
    numGlobalInts: 0, 
    numGlobalByteSlices: 0,
  });

  const signedTxn = txn.signTxn(account.sk);
  const txInfo = await algodClient.sendRawTransaction(signedTxn).do();
  const txid1 = txInfo.txid || (txInfo as any).txid;
  console.log(`Submitted App Creation Transaction: ${txid1}`);

  // Wait for confirmation
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txid1, 4);
  const appId = confirmedTxn.applicationIndex || (confirmedTxn as any).applicationIndex;
  console.log(`Deployed App ID: ${appId}`);

  console.log('Funding application account for boxes...');
  // Now fund the app address with some Algos so it can allocate boxes
  const appAddr = algosdk.getApplicationAddress(appId);
  const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.addr,
    receiver: appAddr,
    amount: 1000000, // 1 Algo to cover many boxes
    suggestedParams: params
  });
  const signedFundTxn = fundTxn.signTxn(account.sk);
  const fundTxInfo = await algodClient.sendRawTransaction(signedFundTxn).do();
  const txid2 = fundTxInfo.txid || (fundTxInfo as any).txid;
  console.log(`Funded App at ${appAddr}. TxId: ${txid2}`);
  await algosdk.waitForConfirmation(algodClient, txid2, 4);

  console.log(`\nDeployment complete! Add the following to your .env files:`);
  console.log(`ALGO_APP_ID=${appId}`);
}

deploy().catch(console.error);
