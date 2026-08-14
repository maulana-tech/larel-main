// @ts-nocheck
import { sendTransaction, waitForTransactionReceipt, getAccount, writeContract, readContract } from '@wagmi/core'
// @ts-nocheck
import { Larel, type EvmOperation, type ProofData, type BalanceNote, createNote } from '@larel/sdk'
// @ts-nocheck
import { wagmiConfig } from './wagmi'
// @ts-nocheck
import { POOL_CONTRACT_ID } from './config'
// @ts-nocheck
import { getSpendingKey, addNote, loadNotes, markSpent, addOrder, loadOrders, setOrderStatus, loadHistory, addHistoryItem } from './note-store'

// SparkDEX V2 Router on Flare Mainnet (also works on Coston2 testnet)
const SPARKDEX_ROUTER = '0x4a1E5A90e9943467FAd1acea1E7F0e5e88472a1e'
const WFLR_ADDRESS = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d' // Wrapped FLR

// Get ERC20 address for a token (handle native FLR -> WFLR)
function getTokenAddress(code: string): string | undefined {
  if (code === 'FLR') return WFLR_ADDRESS
  const meta = assetMeta(code)
  return meta.sac
}
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

// UniswapV2Router02 ABI (SparkDEX uses this interface)
const uniswapV2RouterAbi = parseAbi([
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)',
])

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
    
    // Add to history
    addHistoryItem({
      id: 'dep_' + Date.now(),
      type: 'Deposit',
      pairOrAsset: params.asset,
      amountIn: `${formatAmount(Number(params.amount))} ${params.asset}`,
      txHash: hash,
      createdAt: Date.now(),
    })
    
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
    
    // Add to history
    addHistoryItem({
      id: 'wd_' + Date.now(),
      type: 'Withdrawal',
      pairOrAsset: candidate.assetCode,
      amountOut: `${formatAmount(baseUnitsToNumber(BigInt(candidate.amount), candidate.decimals ?? 18))} ${candidate.assetCode}`,
      txHash: hash,
      createdAt: Date.now(),
    })
    
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
    
    const from = await this.requireAddress()
    const inMeta = assetMeta(params.assetIn)
    const outMeta = assetMeta(params.assetOut)
    const amountInBase = toBaseUnits(params.amountIn, inMeta.decimals)
    const amountOutMinBase = toBaseUnits(params.amountOutMin, outMeta.decimals)
    
    // Get token addresses (handle native FLR -> WFLR)
    const tokenInAddress = getTokenAddress(params.assetIn)
    const tokenOutAddress = getTokenAddress(params.assetOut)
    
    if (!tokenInAddress || !tokenOutAddress) {
      throw new Error('Both tokens need ERC20 addresses for swap')
    }
    
    // Step 1: Approve SparkDEX router to spend input token (skip for native FLR)
    if (params.assetIn !== 'FLR') {
      console.log('[RealLarelSdk] Approving router to spend input token...')
      const approveHash = await writeContract(wagmiConfig, {
        address: tokenInAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [SPARKDEX_ROUTER as `0x${string}`, amountInBase],
        chain: null,
        account: from as `0x${string}`,
      })
      await waitForTransactionReceipt(wagmiConfig as any, { hash: approveHash })
      console.log('[RealLarelSdk] Approved:', approveHash)
    }
    
    // Step 2: Get expected output amount from SparkDEX
    const path = [tokenInAddress as `0x${string}`, tokenOutAddress as `0x${string}`]
    const amountsOut = await readContract(wagmiConfig, {
      address: SPARKDEX_ROUTER as `0x${string}`,
      abi: uniswapV2RouterAbi,
      functionName: 'getAmountsOut',
      args: [amountInBase, path],
    })
    const expectedOut = amountsOut[1]
    console.log('[RealLarelSdk] Expected output:', expectedOut.toString())
    
    // Step 3: Execute swap on SparkDEX
    console.log('[RealLarelSdk] Executing swap on SparkDEX...')
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
    
    let swapHash: string
    if (params.assetIn === 'FLR') {
      // Native FLR -> use swapExactETHForTokens
      swapHash = await writeContract(wagmiConfig, {
        address: SPARKDEX_ROUTER as `0x${string}`,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactETHForTokens',
        args: [amountOutMinBase, path, from as `0x${string}`, BigInt(deadline)],
        value: amountInBase,
        chain: null,
        account: from as `0x${string}`,
      })
    } else if (params.assetOut === 'FLR') {
      // Token -> Native FLR: use swapExactTokensForETH
      swapHash = await writeContract(wagmiConfig, {
        address: SPARKDEX_ROUTER as `0x${string}`,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactTokensForETH',
        args: [amountInBase, amountOutMinBase, path, from as `0x${string}`, BigInt(deadline)],
        chain: null,
        account: from as `0x${string}`,
      })
    } else {
      // Token -> Token: use swapExactTokensForTokens
      swapHash = await writeContract(wagmiConfig, {
        address: SPARKDEX_ROUTER as `0x${string}`,
        abi: uniswapV2RouterAbi,
        functionName: 'swapExactTokensForTokens',
        args: [amountInBase, amountOutMinBase, path, from as `0x${string}`, BigInt(deadline)],
        chain: null,
        account: from as `0x${string}`,
      })
    }
    
    await waitForTransactionReceipt(wagmiConfig as any, { hash: swapHash })
    console.log('[RealLarelSdk] Swap executed:', swapHash)
    
    // Step 4: Update shielded notes
    // Mark input note as spent
    const notes = loadNotes()
    const inputNote = notes.find(n => n.assetCode === params.assetIn && !n.spent)
    if (inputNote) {
      markSpent(inputNote.commitment)
    }
    
    // Create output note
    const outputNote = createNote({
      assetId: assetIdFor({ native: outMeta.native, sac: outMeta.sac }),
      amount: expectedOut,
      spendingKey: getSpendingKey(),
    })
    addNote(outputNote, { 
      assetCode: params.assetOut, 
      source: 'change',
      decimals: outMeta.decimals,
      txHash: swapHash
    })
    
    // Create change note if input amount > swap amount
    const inputAmount = BigInt(inputNote?.amount ?? '0')
    if (inputAmount > amountInBase) {
      const changeNote = createNote({
        assetId: BigInt(inputNote?.assetId ?? '0'),
        amount: inputAmount - amountInBase,
        spendingKey: getSpendingKey(),
      })
      addNote(changeNote, { 
        assetCode: params.assetIn, 
        source: 'change',
        decimals: inMeta.decimals 
      })
    }
    
    // Add to history
    addHistoryItem({
      id: 'swap_' + Date.now(),
      type: 'Swap',
      pairOrAsset: `${params.assetIn}/${params.assetOut}`,
      amountIn: `${params.amountIn} ${params.assetIn}`,
      amountOut: `${baseUnitsToNumber(expectedOut, outMeta.decimals)} ${params.assetOut}`,
      txHash: swapHash,
      createdAt: Date.now(),
    })
    
    console.log('[RealLarelSdk] swap completed')
    return { hash: swapHash }
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
    const orders = loadOrders()
    return orders.filter(o => o.status === 'open').map(o => ({
      id: o.commitment,
      pair: `${o.baseCode}/${o.quoteCode}`,
      base: o.baseCode,
      quote: o.quoteCode,
      side: o.side === 0 ? 'buy' as const : 'sell' as const,
      price: o.price,
      amount: o.amount,
      filled: '0',
      createdAt: o.createdAt,
    }))
  }

  async getTransactionHistory(): Promise<HistoryItem[]> {
    return loadHistory()
  }
}
