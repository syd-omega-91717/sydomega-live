import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createSupabaseContext } from 'npm:@supabase/server@1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sydomega.com',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

const ALLOWED_ACTIONS = new Set([
  'catalog',
  'module_manifest',
  'module_state',
  'module_read',
  'create_service_order',
  'create_consult_intake',
  'create_media_job',
  'upsert_investment_watchlist',
  'verify_blockchain_ownership',
  'issue_referral_code',
  'attribute_referral',
  'enqueue_agent_task',
  'elemental_cosmology_read',
  'elemental_interpretation_read',
  'elemental_simulation_run',
])

const MAX_BODY_BYTES = 64 * 1024
const RPC_TIMEOUT_MS = 8_000

const CHAIN_RPC: Record<number, string> = {
  1: 'https://ethereum-rpc.publicnode.com',
  137: 'https://polygon-bor-rpc.publicnode.com',
  8453: 'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc',
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const UINT_RE = /^(0|[1-9][0-9]*)$/

function pad64(value: string) {
  return value.replace(/^0x/, '').padStart(64, '0')
}

function decodeAddress(result: unknown): string | null {
  if (typeof result !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(result)) return null
  return '0x' + result.slice(-40)
}

function decodeUint(result: unknown): bigint | null {
  if (typeof result !== 'string' || !/^0x[0-9a-fA-F]+$/.test(result)) return null
  try { return BigInt(result) } catch { return null }
}

async function rpcCall(endpoint: string, method: string, params: unknown[]): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS)
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`rpc_http_${response.status}`)
    const body = await response.json()
    if (body?.error) throw new Error(typeof body.error.message === 'string' ? body.error.message : 'rpc_error')
    return body?.result
  } finally {
    clearTimeout(timer)
  }
}

async function verifyOwnership(input: Record<string, unknown>) {
  const chainId = Number(input.chain_id)
  const contract = typeof input.contract_address === 'string' ? input.contract_address.trim() : ''
  const wallet = typeof input.wallet_address === 'string' ? input.wallet_address.trim() : ''
  const tokenStandard = input.token_standard === 'ERC721' || input.token_standard === 'ERC1155' ? input.token_standard : ''
  const tokenId = typeof input.token_id === 'string' ? input.token_id.trim() : String(input.token_id ?? '')
  if (!CHAIN_RPC[chainId] || !ADDRESS_RE.test(contract) || !ADDRESS_RE.test(wallet) || !tokenStandard || !UINT_RE.test(tokenId)) {
    return { verification_status: 'INVALID_INPUT', chain_id: chainId, contract_address: contract, wallet_address: wallet, token_standard: tokenStandard, token_id: tokenId }
  }

  const rpc = CHAIN_RPC[chainId]
  const blockHex = await rpcCall(rpc, 'eth_blockNumber', [])
  const blockNumber = decodeUint(blockHex)
  let observedOwner: string | null = null
  let balance: string | null = null
  let status: 'VERIFIED' | 'NOT_OWNER' | 'NOT_FOUND' = 'NOT_FOUND'

  if (tokenStandard === 'ERC721') {
    const data = '0x6352211e' + pad64(tokenId)
    const result = await rpcCall(rpc, 'eth_call', [{ to: contract, data }, 'latest'])
    observedOwner = decodeAddress(result)
    if (observedOwner) status = observedOwner.toLowerCase() === wallet.toLowerCase() ? 'VERIFIED' : 'NOT_OWNER'
  } else {
    const data = '0x00fdd58e' + pad64(wallet) + pad64(tokenId)
    const result = await rpcCall(rpc, 'eth_call', [{ to: contract, data }, 'latest'])
    const amount = decodeUint(result)
    if (amount !== null) {
      balance = amount.toString()
      status = amount > 0n ? 'VERIFIED' : 'NOT_OWNER'
    }
  }

  return {
    chain_id: chainId,
    contract_address: contract.toLowerCase(),
    token_standard: tokenStandard,
    token_id: tokenId,
    wallet_address: wallet.toLowerCase(),
    observed_owner: observedOwner?.toLowerCase() ?? null,
    balance,
    rpc_endpoint: rpc,
    verification_status: status,
    provider_block_number: blockNumber?.toString() ?? null,
    proof: {
      method: tokenStandard === 'ERC721' ? 'ownerOf(uint256)' : 'balanceOf(address,uint256)',
      checked_at: new Date().toISOString(),
      chain_id: chainId,
    },
  }
}

export default {
  fetch: async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: corsHeaders })
    }

    try {
      const contentLength = Number(req.headers.get('content-length') ?? 0)
      if (contentLength > MAX_BODY_BYTES) {
        return Response.json({ error: 'request_too_large' }, { status: 413, headers: corsHeaders })
      }

      const { data: ctx, error: authError } = await createSupabaseContext(req, { auth: 'user' })
      if (authError || !ctx?.userClaims?.sub) {
        return Response.json(
          { error: authError?.code ?? 'invalid_session' },
          { status: authError?.status ?? 401, headers: corsHeaders },
        )
      }

      const body = await req.json()
      const action = typeof body?.action === 'string' ? body.action : ''
      const payload = body?.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
        ? body.payload
        : {}

      if (!ALLOWED_ACTIONS.has(action)) {
        return Response.json({ error: 'action_not_allowed' }, { status: 400, headers: corsHeaders })
      }

      if (action === 'elemental_cosmology_read' || action === 'elemental_interpretation_read' || action === 'elemental_simulation_run') {
        try {
          const elementalAction = action === 'elemental_cosmology_read'
            ? 'cosmology.read'
            : action === 'elemental_interpretation_read'
              ? 'interpretation.read'
              : 'simulation.run'
          const { data, error } = await ctx.supabaseAdmin.rpc('omega_elemental_runtime', {
            p_action: elementalAction,
            p_payload: payload,
          })
          if (error) throw error
          return Response.json({ ok: true, action, data }, { headers: corsHeaders })
        } catch (error) {
          console.error('omega-runtime-gateway elemental runtime', error)
          return Response.json({ error: 'elemental_runtime_failed' }, { status: 502, headers: corsHeaders })
        }
      }

      if (action === 'verify_blockchain_ownership') {
        try {
          const verification = await verifyOwnership(payload)
          const { data, error } = await ctx.supabaseAdmin.rpc('record_blockchain_ownership_verification', {
            p_user_id: ctx.userClaims.sub,
            p_verification: verification,
          })
          if (error) throw error
          return Response.json({ ok: true, action, data }, { headers: corsHeaders })
        } catch (error) {
          console.error('omega-runtime-gateway blockchain verification', error)
          return Response.json({ error: 'blockchain_verification_failed' }, { status: 502, headers: corsHeaders })
        }
      }

      const { data, error } = await ctx.supabaseAdmin.rpc('omega_runtime_dispatch', {
        p_actor_user_id: ctx.userClaims.sub,
        p_action: action,
        p_payload: payload,
      })
      if (error) throw error

      return Response.json({ ok: true, action, data }, { headers: corsHeaders })
    } catch (error) {
      console.error('omega-runtime-gateway', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'runtime_error' },
        { status: 500, headers: corsHeaders },
      )
    }
  },
}
