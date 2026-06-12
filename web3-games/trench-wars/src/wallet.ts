/** Minimal Phantom/Solana wallet adapter. No external Solana SDK required for v1 — we only need the public key. */

export interface SolanaProvider {
  isPhantom?: boolean
  publicKey?: { toString(): string }
  connect(): Promise<{ publicKey: { toString(): string } }>
  disconnect(): Promise<void>
}

export function getProvider(): SolanaProvider | null {
  const anyWindow = window as any
  return anyWindow.phantom?.solana || anyWindow.solana || null
}

export function isWalletAvailable(): boolean {
  return !!getProvider()
}

export async function connectWallet(): Promise<string> {
  const provider = getProvider()
  if (!provider) throw new Error('no Solana wallet found — install Phantom')
  const res = await provider.connect()
  return res.publicKey.toString()
}

export async function disconnectWallet(): Promise<void> {
  const provider = getProvider()
  await provider?.disconnect()
}
