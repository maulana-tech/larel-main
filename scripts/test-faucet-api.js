import fetch from 'node-fetch';

const DEPLOYER_PUB = 'GAMTL7UDBTTR3EJO3ILB3UWHY2QMLQJGUXX44BJVW5PAB6LAZAW2DCSK';
const OFFICIAL_USDC = 'CB3TLW74NBIOT3BUWOZ3TUM6RFDF6A4GVIRUQRQZABG5KPOUL4JJOV2F';

async function testFaucetApi() {
  const url = `https://api.soroswap.finance/api/faucet?address=${DEPLOYER_PUB}&contract=${OFFICIAL_USDC}`;
  console.log("Calling faucet API:", url);
  
  try {
    const res = await fetch(url, { method: 'POST' });
    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (e) {
    console.error("API Error:", e);
  }
}

testFaucetApi();
