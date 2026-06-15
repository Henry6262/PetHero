export type Faction = 'Trader' | 'Jeet'

export interface Commander {
  id: string
  name: string
  faction: Faction
  portrait: string
  flavor: string
}

export const ROSTER: Commander[] = [
  {
    id: 'phoenix',
    name: 'Phoenix',
    faction: 'Trader',
    portrait: '/assets/3d/portraits/phoenix.png',
    flavor: 'Reborn on death. A tempo swing wrapped in fire.',
  },
  {
    id: 'gake',
    name: 'Gake',
    faction: 'Trader',
    portrait: '/assets/3d/portraits/gake.png',
    flavor: 'Salty sailor cat. Anchors the line and buffs the squad.',
  },
  {
    id: 'pepe',
    name: 'Pepe',
    faction: 'Jeet',
    portrait: '/assets/3d/portraits/pepe.png',
    flavor: 'Meme swarm. Overwhelms cheap and spams the trench.',
  },
  {
    id: 'degen',
    name: 'Degen',
    faction: 'Jeet',
    portrait: '/assets/3d/portraits/degen.png',
    flavor: 'High roll. Burst then dump — pray for the candle.',
  },
  {
    id: 'bluemob',
    name: 'Blue Mob',
    faction: 'Jeet',
    portrait: '/assets/3d/portraits/bluemob.png',
    flavor: 'Numbers game. Endless pressure from every angle.',
  },
]

export interface Step {
  n: string
  title: string
  body: string
}

export const STEPS: Step[] = [
  { n: '01', title: 'Build your deck', body: 'Draft commanders and cards into an 8-card war machine.' },
  { n: '02', title: 'Deploy down the lanes', body: 'Spend elixir to send units into the trench in real time.' },
  { n: '03', title: 'Destroy their towers', body: 'Break the enemy line before the timer hits zero.' },
  { n: '04', title: 'Climb the ladder', body: 'Win-gated unlocks and ELO across five tiers.' },
]

export interface Mechanic {
  title: string
  body: string
  span?: boolean
}

export const MECHANICS: Mechanic[] = [
  {
    title: 'Elixir economy',
    body: 'Resource regenerates over time — spend smart, punish overextension.',
    span: true,
  },
  { title: 'Three-lane combat', body: 'Commit and rotate across lanes to break the line.' },
  { title: 'Spell VFX', body: 'Readable feedback on every hit, heal and AoE.' },
  { title: 'Six core mechanics', body: 'Charge, shield, splash, swarm, snipe, revive.' },
  { title: 'Card progression', body: 'Win-gated unlocks deepen your deck over the ladder.', span: true },
]

export interface TokenSplit {
  label: string
  pct: number
  color: string
  note: string
}

export const TOKEN = {
  ticker: '$ROYALE',
  burnedToDate: 1_240_000,
  splits: [
    {
      label: 'Burned',
      pct: 50,
      color: '#ff6a2b',
      note: 'Removed from supply forever — deflationary.',
    },
    {
      label: 'Reward pool',
      pct: 30,
      color: '#2bff88',
      note: 'Paid back to players via ladder rewards.',
    },
    {
      label: 'Treasury',
      pct: 20,
      color: '#d4a13c',
      note: 'Funds development and live ops.',
    },
  ] as TokenSplit[],
}


