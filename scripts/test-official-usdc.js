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

async function tryMint() {
  const account = await server.getAccount(DEPLOYER_PUB);
  const usdcContract = new Contract(OFFICIAL_USDC);
  
  // Let's try calling 'mint'
  console.log("Trying 'mint'...");
  const mintOp = usdcContract.call('mint', 
    scvAddress(DEPLOYER_PUB),
    scvI128(100000000000n)
  );
  
  const tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: PASSPHRASE })
    .addOperation(mintOp)
    .setTimeout(30)
    .build();

  try {
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      console.log("Mint simulation failed:", sim.error);
    } else {
      console.log("Mint simulation succeeded! We can use mint!");
      return;
    }
  } catch (e) {
    console.log("Mint error:", e);
  }

  // Let's try calling 'faucet'
  console.log("Trying 'faucet'...");
  const faucetOp = usdcContract.call('faucet', 
    scvAddress(DEPLOYER_PUB)
  );
  const tx2 = new TransactionBuilder(account, { fee: '100000', networkPassphrase: PASSPHRASE })
    .addOperation(faucetOp)
    .setTimeout(30)
    .build();

  try {
    const sim2 = await server.simulateTransaction(tx2);
    if (rpc.Api.isSimulationError(sim2)) {
      console.log("Faucet simulation failed:", sim2.error);
    } else {
      console.log("Faucet simulation succeeded! We can use faucet!");
      return;
    }
  } catch (e) {
    console.log("Faucet error:", e);
  }
}

tryMint().catch(console.error);
