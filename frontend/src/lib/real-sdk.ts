// @ts-nocheck
import { sendTransaction, waitForTransactionReceipt, getAccount, writeContract, readContract } from '@wagmi/core'
// @ts-nocheck
import { Larel, type EvmOperation, type ProofData, type BalanceNote } from '@larel/sdk'
// @ts-nocheck
import { wagmiConfig } from './wagmi'
// @ts-nocheck
import { POOL_CONTRACT_ID } from './config'
// @ts-nocheck
import { getSpendingKey, addNote, loadNotes, markSpent, addOrder, loadOrders } from './note-store'
import type {
  DepositParams,
  OpenOrder,
  PlaceOrderParams,
  PlaceOrderResult,
  ShieldedBalance,
  TransferParams,
  TxResult,
  WithdrawParams,
  SwapShieldedParams,
  LarelSdk,
  HistoryItem,
} from './larel-sdk'
// @ts-nocheck
import { assetIdFor, assetMeta } from './tokens'
// @ts-nocheck
import { formatAmount } from './format'
import { erc20Abi, parseAbi } from 'viem'

// Parse decimal to base units
export function toBaseUnits(input: string, decimals: number): bigint {
  const trimmed = input.replace(/,/g, '').trim()
  if (!/^\\d*(\\.\\d*)?$/.test(trimmed) || trimmed === '' || trimmed === '.') {
    throw new Error(`Invalid amount: "${input}"`)
  }
  const [whole, frac = ''] = trimmed.split('.')
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals)
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0')
}

export function baseUnitsToNumber(value: bigint, decimals: number): number {
  return Number(value) / (10 ** decimals)
}

export class RealLarelSdk implements LarelSdk {
  private sdk: Larel | null = null;

  private getSdk(): Larel {
    if (!this.sdk) {
      this.sdk = new Larel({
        contractAddress: POOL_CONTRACT_ID,
        spendingKey: getSpendingKey()
      })
    }
    return this.sdk;
  }

  private async requireAddress(): Promise<string> {
    const { address } = getAccount(wagmiConfig)
    if (!address) throw new Error('Connect an EVM wallet first (e.g. MetaMask).')
    return address
  }

  private async submitOp(op: EvmOperation): Promise<{ hash: string }> {
    await this.requireAddress()
    const hash = await sendTransaction(wagmiConfig as any, {
      to: op.to,
      data: op.data,
      value: op.value,
    })
    await waitForTransactionReceipt(wagmiConfig as any, { hash })
    return { hash }
  }

  async deposit(params: DepositParams): Promise<TxResult> {
    console.log('[RealLarelSdk] deposit called:', params.asset, params.amount)
    const isNative = params.native ?? (params.asset === 'FLR')
    const address = params.sac ?? (isNative ? 'native' : '')
    if (!address && !isNative) throw new Error('Need ERC20 contract address for deposit')
    const decimals = params.decimals ?? 18
    const amountBase = toBaseUnits(params.amount, decimals)
    console.log('[RealLarelSdk] isNative:', isNative, 'address:', address)

    const from = await this.requireAddress()
    console.log('[RealLarelSdk] wallet address:', from)

    // For ERC20 tokens, approve the pool to spend first
    if (!isNative && address && address !== 'native') {
      const allowance = await readContract(wagmiConfig, {
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [from as `0x${string}`, POOL_CONTRACT_ID as `0x${string}`],
      })

      if (allowance < amountBase) {
        // Need to approve
        const approveHash = await writeContract(wagmiConfig, {
          address: address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [POOL_CONTRACT_ID as `0x${string}`, amountBase],
          chain: null,
          account: from as `0x${string}`,
        })
        await waitForTransactionReceipt(wagmiConfig as any, { hash: approveHash })
      }
    }

    const { note, operation, commitment } = this.getSdk().deposit({
      asset: { assetId: assetIdFor({ native: isNative, sac: address }), address },
      amount: amountBase,
      from
    })

    const { hash } = await this.submitOp(operation)
    
    addNote(note, { assetCode: params.asset, txHash: hash, decimals, source: 'deposit' })
    return { hash }
  }

  async withdraw(params: WithdrawParams): Promise<TxResult> {
    const from = await this.requireAddress()
    
    // Find note
    const notes = loadNotes()
    const candidate = params.commitment 
      ? notes.find(n => n.commitment === params.commitment && !n.spent)
      : notes.find(n => n.assetCode === params.asset && !n.spent)
      
    if (!candidate) throw new Error('No shielded balance available for withdrawal')
    
    // Convert StoredNote to BalanceNote
    const balanceNote = {
      assetId: BigInt(candidate.assetId),
      amount: BigInt(candidate.amount),
      ownerKey: BigInt(candidate.ownerKey),
      blinding: BigInt(candidate.blinding),
      commitment: BigInt(candidate.commitment),
      spendingKey: getSpendingKey(),
      leafIndex: candidate.leafIndex,
      assetAddress: candidate.assetAddress
    }

    const { operation, nullifiers } = await this.getSdk().withdraw({
      note: balanceNote as BalanceNote,
      recipient: params.recipient
    })

    const { hash } = await this.submitOp(operation)
    markSpent(candidate.commitment)
    return { hash }
  }

  async transfer(params: TransferParams): Promise<TxResult> {
    throw new Error('Transfer UI is not fully mapped for EVM yet')
  }

  async placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
    throw new Error('PlaceOrder UI is not fully mapped for EVM yet')
  }

  async cancelOrder(orderId: string): Promise<TxResult> {
    throw new Error('CancelOrder is not mapped for EVM yet')
  }

  async swapShielded(params: SwapShieldedParams): Promise<TxResult> {
    throw new Error('SwapShielded is not mapped for EVM yet')
  }

  async getShieldedBalances(): Promise<ShieldedBalance[]> {
    const totals = new Map<string, bigint>()
    for (const n of loadNotes()) {
      if (!n.spent) {
        totals.set(n.assetCode, (totals.get(n.assetCode) ?? 0n) + BigInt(n.amount))
      }
    }
    const out: ShieldedBalance[] = []
    for (const [asset, base] of totals) {
      if (base <= 0n) continue
      const human = baseUnitsToNumber(base, 18) // Default to 18 decimals for EVM
      out.push({
        asset,
        amount: formatAmount(human),
        usdEstimate: human * 1.0 // Mock USD price
      })
    }
    return out
  }

  async getOpenOrders(): Promise<OpenOrder[]> {
    return []
  }

  async getTransactionHistory(): Promise<HistoryItem[]> {
    return []
  }
}
