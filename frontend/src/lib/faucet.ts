/**
 * Faucet mints mock tokens.
 * Currently disabled on EVM migration.
 */
export async function faucetMint(_tokenAddress: string, _amount: bigint): Promise<string> {
  throw new Error('Faucet is not yet available on the EVM deployment.');
}
