import { Contract, Keypair, TransactionBuilder, rpc, Address, nativeToScVal } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-rpc.testnet.stellar.gateway.fm';
const PASSPHRASE = 'Test SDF Network ; September 2015';

const DEPLOYER_SECRET = 'SDZAFZVHZHOY3V4EHJF2MRCJNP4ZEPXIIXI4Y6P5IWFN6NDF7K4BF5S6';
const DEPLOYER_PUB = 'GAMTL7UDBTTR3EJO3ILB3UWHY2QMLQJGUXX44BJVW5PAB6LAZAW2DCSK';

const OFFICIAL_USDC = 'CB3TLW74NBIOT3BUWOZ3TUM6RFDF6A4GVIRUQRQZABG5KPOUL4JJOV2F';

const server = new rpc.Server(RPC_URL);
const kp = Keypair.fromSecret(DEPLOYER_SECRET);

const scvAddress = (addr) => new Address(addr).toScVal();
const scvI128 = (n) => nativeToScVal(n, { type: "i128" });

async function checkUSDC() {
  const account = await server.getAccount(DEPLOYER_PUB);
  const usdcContract = new Contract(OFFICIAL_USDC);
  
  // Try to actually submit a mint
  console.log("Submitting 'mint' transaction...");
  const mintOp = usdcContract.call('mint', 
    scvAddress(DEPLOYER_PUB),
    scvI128(100000000n)
  );
  
  let tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: PASSPHRASE })
    .addOperation(mintOp)
    .setTimeout(30)
    .build();

  tx.sign(kp);
  
  try {
    const sent = await server.sendTransaction(tx);
    console.log("Tx status:", sent.status, "hash:", sent.hash);
    if (sent.status !== 'ERROR') {
      // wait for confirmation
      let confirmed = false;
      for (let i = 0; i < 10; i++) {
        const txStatus = await server.getTransaction(sent.hash);
        if (txStatus.status === 'SUCCESS') {
          console.log("MINT SUCCESS ON-CHAIN!");
          confirmed = true;
          break;
        } else if (txStatus.status === 'FAILED') {
          console.log("MINT FAILED ON-CHAIN!", txStatus.resultResultMetaXdr);
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    } else {
      console.log("Send failed:", sent.errorResult);
    }
  } catch (e) {
    console.log("Error submitting mint:", e);
  }
}

checkUSDC().catch(console.error);
