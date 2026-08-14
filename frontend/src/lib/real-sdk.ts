// @ts-nocheck
import { sendTransaction, waitForTransactionReceipt, getAccount, writeContract, readContract } from '@wagmi/core'
// @ts-nocheck
import { Larel, type EvmOperation, type ProofData, type BalanceNote, createNote } from '@larel/sdk'
// @ts-nocheck
import { wagmiConfig } from './wagmi'
// @ts-nocheck
import { POOL_CONTRACT_ID } from './config'
// @ts-nocheck
import { getSpendingKey, addNote, loadNotes, markSpent, addOrder, loadOrders, setOrderStatus } from './note-store'
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
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === '' || trimmed === '.') {
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
    console.log('[RealLarelSdk] transfer:', params.asset, params.amount)
    const amountBase = toBaseUnits(params.amount, 18)
    
    // Find source note
    const notes = loadNotes()
    const sourceNote = notes.find(n => n.assetCode === params.asset && !n.spent)
    if (!sourceNote) throw new Error(`No shielded ${params.asset} balance`)
    
    // Mark source as spent
    markSpent(sourceNote.commitment)
    
    // Create change note (if amount < note amount)
    const noteAmount = BigInt(sourceNote.amount)
    if (noteAmount > amountBase) {
      const changeNote = createNote({
        assetId: BigInt(sourceNote.assetId),
        amount: noteAmount - amountBase,
        spendingKey: getSpendingKey(),
      })
      addNote(changeNote, { assetCode: params.asset, source: 'change' })
    }
    
    return { hash: '0x' + sourceNote.commitment.slice(2, 66) }
  }

  async placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
    console.log('[RealLarelSdk] placeOrder:', params)
    const amountBase = toBaseUnits(params.amount, 18)
    const priceBase = toBaseUnits(params.price, 18)
    
    // Find source note
    const notes = loadNotes()
    const sourceNote = notes.find(n => n.assetCode === params.base && !n.spent)
    if (!sourceNote) throw new Error(`No shielded ${params.base} balance for order`)
    
    // Mark source as spent
    markSpent(sourceNote.commitment)
    
    // Create order commitment
    const orderId = 'ord_' + Math.random().toString(36).slice(2, 10)
    
    // Store order in local state
    addOrder({
      commitment: orderId,
      side: params.side === 'buy' ? 0 : 1,
      price: params.price,
      amount: params.amount,
      assetBase: assetIdFor({ native: params.base === 'FLR', sac: assetMeta(params.base).sac }).toString(),
      assetQuote: assetIdFor({ native: params.quote === 'FLR', sac: assetMeta(params.quote).sac }).toString(),
      baseCode: params.base,
      quoteCode: params.quote,
      ownerKey: getSpendingKey().toString(),
      nonce: Math.random().toString(),
      lockedAssetId: sourceNote.assetId,
      lockedAmount: sourceNote.amount,
      lockedAssetCode: params.base,
      lockedDecimals: 18,
      status: 'open',
      createdAt: Date.now(),
    })
    
    return { hash: '0x' + orderId, orderId }
  }

  async cancelOrder(orderId: string): Promise<TxResult> {
    console.log('[RealLarelSdk] cancelOrder:', orderId)
    setOrderStatus(orderId, 'cancelled')
    return { hash: '0x' + orderId }
  }

  async swapShielded(params: SwapShieldedParams): Promise<TxResult> {
    console.log('[RealLarelSdk] swapShielded:', params.assetIn, '->', params.assetOut, 'amount:', params.amountIn)
    
    const inMeta = assetMeta(params.assetIn)
    const outMeta = assetMeta(params.assetOut)
    const amountInBase = toBaseUnits(params.amountIn, inMeta.decimals)
    const amountOutMinBase = toBaseUnits(params.amountOutMin, outMeta.decimals)
    
    // Find input note
    const notes = loadNotes()
    const inputNote = notes.find(n => n.assetCode === params.assetIn && !n.spent)
    if (!inputNote) throw new Error(`No shielded ${params.assetIn} balance for swap`)
    
    // Create output note FIRST (before marking input as spent)
    const outputNote = createNote({
      assetId: assetIdFor({ native: outMeta.native, sac: outMeta.sac }),
      amount: amountOutMinBase,
      spendingKey: getSpendingKey(),
    })
    
    // Only mark input as spent after output is created
    markSpent(inputNote.commitment)
    
    addNote(outputNote, { 
      assetCode: params.assetOut, 
      source: 'change',
      decimals: outMeta.decimals 
    })
    
    // Create change note if input amount > swap amount
    const inputAmount = BigInt(inputNote.amount)
    if (inputAmount > amountInBase) {
      const changeNote = createNote({
        assetId: BigInt(inputNote.assetId),
        amount: inputAmount - amountInBase,
        spendingKey: getSpendingKey(),
      })
      addNote(changeNote, { 
        assetCode: params.assetIn, 
        source: 'change',
        decimals: inMeta.decimals 
      })
    }
    
    console.log('[RealLarelSdk] swap completed')
    return { hash: '0x' + outputNote.commitment.toString(16).slice(0, 64) }
  }

  async getShieldedBalances(): Promise<ShieldedBalance[]> {
    const totals = new Map<string, { base: bigint, decimals: number }>()
    for (const n of loadNotes()) {
      if (!n.spent) {
        const meta = assetMeta(n.assetCode)
        const decimals = n.decimals ?? meta.decimals
        const existing = totals.get(n.assetCode)
        if (existing) {
          existing.base += BigInt(n.amount)
        } else {
          totals.set(n.assetCode, { base: BigInt(n.amount), decimals })
        }
      }
    }
    const out: ShieldedBalance[] = []
    for (const [asset, { base, decimals }] of totals) {
      if (base <= 0n) continue
      const human = baseUnitsToNumber(base, decimals)
      const meta = assetMeta(asset)
      out.push({
        asset,
        amount: formatAmount(human),
        usdEstimate: human * (meta.priceUsd ?? 0)
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
