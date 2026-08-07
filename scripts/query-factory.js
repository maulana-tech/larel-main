import { Contract, Keypair, TransactionBuilder, rpc, Address } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-rpc.testnet.stellar.gateway.fm';
const PASSPHRASE = 'Test SDF Network ; September 2015';

const DEPLOYER_PUB = 'GAMTL7UDBTTR3EJO3ILB3UWHY2QMLQJGUXX44BJVW5PAB6LAZAW2DCSK';
const ROUTER = 'CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD';

const server = new rpc.Server(RPC_URL);

async function checkRouter() {
  const account = await server.getAccount(DEPLOYER_PUB);
  const routerContract = new Contract(ROUTER);
  
  // Call 'factory'
  console.log("Simulating 'factory' call...");
  const op = routerContract.call('factory');
  const tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: PASSPHRASE })
    .addOperation(op)
    .setTimeout(30)
    .build();

  try {
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      console.log("Factory simulation failed:", sim.error);
    } else {
      const resultVal = sim.result.retval;
      // Parse address from ScVal
      console.log("Factory simulation succeeded! Result ScVal:", JSON.stringify(resultVal));
    }
  } catch (e) {
    console.log("Error:", e);
  }
}

checkRouter().catch(console.error);
