import { Account, Contract, Keypair, TransactionBuilder, xdr, rpc, Address, nativeToScVal } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-rpc.testnet.stellar.gateway.fm';
const PASSPHRASE = 'Test SDF Network ; September 2015';

const DEPLOYER_SECRET = 'SDZAFZVHZHOY3V4EHJF2MRCJNP4ZEPXIIXI4Y6P5IWFN6NDF7K4BF5S6';
const DEPLOYER_PUB = 'GAMTL7UDBTTR3EJO3ILB3UWHY2QMLQJGUXX44BJVW5PAB6LAZAW2DCSK';

const USDC = 'CCHX6LQDC6KHW6YBPNU4DVO4L4YO2JQXWQMVQPUAZBVZP5FWNXILCDZW';
const XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const SOROSWAP_ROUTER = 'CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD';

const server = new rpc.Server(RPC_URL);
const kp = Keypair.fromSecret(DEPLOYER_SECRET);

const scvAddress = (addr) => new Address(addr).toScVal();
const scvI128 = (n) => nativeToScVal(n, { type: "i128" });
const scvU64 = (n) => nativeToScVal(n, { type: "u64" });
const scvU32 = (n) => nativeToScVal(n, { type: "u32" });

async function submitTx(op) {
  const account = await server.getAccount(DEPLOYER_PUB);
  const tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: PASSPHRASE })
    .addOperation(op)
    .setTimeout(120)
    .build();

  // Prepare transaction
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(kp);

  console.log("Submitting transaction...");
  const res = await server.sendTransaction(prepared);
  if (res.status === 'ERROR') {
    throw new Error(JSON.stringify(res));
  }

  // Wait for tx using SDK loop logic
  for (let i = 0; i < 50; i++) {
    const txRes = await server.getTransaction(res.hash);
    if (txRes.status === 'SUCCESS') {
      console.log("Success! Hash:", res.hash);
      return txRes;
    }
    if (txRes.status === 'FAILED') {
      throw new Error("Tx failed on-chain: " + JSON.stringify(txRes));
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Transaction confirmation timeout.');
}

async function main() {
  console.log("1. Minting USDC...");
  const usdcContract = new Contract(USDC);
  const mintOp = usdcContract.call('mint', 
    scvAddress(DEPLOYER_PUB),
    scvI128(100000000000000n) // 10,000,000 USDC (7 decimals)
  );
  await submitTx(mintOp);

  console.log("2. Approving USDC for Soroswap Router...");
  const approveUsdcOp = usdcContract.call('approve',
    scvAddress(DEPLOYER_PUB),
    scvAddress(SOROSWAP_ROUTER),
    scvI128(100000000000000n),
    scvU32(4000000)
  );
  await submitTx(approveUsdcOp);

  console.log("3. Approving XLM for Soroswap Router...");
  const xlmContract = new Contract(XLM);
  const approveXlmOp = xlmContract.call('approve',
    scvAddress(DEPLOYER_PUB),
    scvAddress(SOROSWAP_ROUTER),
    scvI128(100000000000000n),
    scvU32(4000000)
  );
  await submitTx(approveXlmOp);

  console.log("4. Adding Liquidity on Soroswap...");
  const routerContract = new Contract(SOROSWAP_ROUTER);
  const addLiqOp = routerContract.call('add_liquidity',
    scvAddress(USDC),
    scvAddress(XLM),
    scvI128(10000000000n), // 1,000 USDC desired (7 decimals)
    scvI128(57170000000n), // 5,717 XLM desired (7 decimals)
    scvI128(10000n), // 0.001 USDC min
    scvI128(10000n), // 0.001 XLM min
    scvAddress(DEPLOYER_PUB),
    scvU64(9999999999n)
  );
  await submitTx(addLiqOp);
  console.log("DONE!");
}

main().catch(console.error);
