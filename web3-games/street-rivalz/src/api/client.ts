/// <reference types="vite/client" />
import { TrackDef } from '../sim/track'
import { KartInput } from '../sim/kart'
import { Loadout } from '../garage/inventory'
import { HolderTier } from '../data/token'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface ReplayPayload {
  trackDef: TrackDef
  carId: string
  seed: number
  inputs: KartInput[][]
}

export interface VerifyResponse {
  valid: boolean
  finalTime?: number
  error?: string
}

export interface SubmitResponse {
  valid: boolean
  replayId?: string
  finalTime?: number
  mmr?: number
  error?: string
}

export interface Ghost {
  ghostId: string
  accountId: string
  mmr: number
  carId: string
  seed: number
  finalTime: number
  inputs: KartInput[][]
}

export interface LadderRow {
  rank: number
  accountId: string
  bestTime: number
  mmr: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  return res.json() as Promise<T>
}

export const api = {
  verifyReplay: (payload: ReplayPayload) => post<VerifyResponse>('/replays/verify', payload),
  submitReplay: (payload: ReplayPayload) => post<SubmitResponse>('/replays/submit', payload),
  getGhosts: (trackId: string, count = 3, nearMmr = 1000) =>
    get<Ghost[]>(`/ghosts/${trackId}?count=${count}&nearMmr=${nearMmr}`),
  getLadder: (trackId: string, limit = 20) => get<LadderRow[]>(`/ladder/${trackId}?limit=${limit}`),
  getMyRank: (trackId: string) => get<{ rank: number; bestTime: number; mmr: number }>(`/ladder/${trackId}/me`),
  getLoadout: () => get<Loadout & { spoiler?: string | null }>('/garage'),
  saveLoadout: (loadout: Loadout) => post<Loadout & { spoiler?: string | null }>('/garage', loadout),
  getTokenInfo: () => get<{ ticker: string; name: string; network: string; launchUrl: string; tiers: HolderTier[]; prizePool: string }>('/token'),
}
