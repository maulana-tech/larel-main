import { Contract, Keypair, TransactionBuilder, rpc, Address } from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-rpc.testnet.stellar.gateway.fm';
const PASSPHRASE = 'Test SDF Network ; September 2015';

const DEPLOYER_PUB = 'GAMTL7UDBTTR3EJO3ILB3UWHY2QMLQJGUXX44BJVW5PAB6LAZAW2DCSK';
const FACTORY = 'CDP3HMUH6SMS3S7NPGNDJLULCOXXEPSHY4JKUKMBNQMATHDHWXRRJTBY';
const USDC = 'CB3TLW74NBIOT3BUWOZ3TUM6RFDF6A4GVIRUQRQZABG5KPOUL4JJOV2F';
const NATIVE_XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

const server = new rpc.Server(RPC_URL);

async function checkFactory() {
  const account = await server.getAccount(DEPLOYER_PUB);
  const factoryContract = new Contract(FACTORY);
  
  // Call 'get_pair'
  console.log("Simulating 'get_pair' call...");
  const op = factoryContract.call('get_pair', new Address(USDC).toScVal(), new Address(NATIVE_XLM).toScVal());
  const tx = new TransactionBuilder(account, { fee: '100000', networkPassphrase: PASSPHRASE })
    .addOperation(op)
    .setTimeout(30)
    .build();

  try {
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      console.log("get_pair simulation failed:", sim.error);
    } else {
      const resultVal = sim.result.retval;
      console.log("get_pair simulation succeeded! Result ScVal:", JSON.stringify(resultVal));
    }
  } catch (e) {
    console.log("Error:", e);
  }
}

checkFactory().catch(console.error);
