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
    id: 'mert',
    name: 'Mert',
    faction: 'Trader',
    portrait: '/assets/3d/portraits/mert.png',
    flavor: 'The bull in golden armor. Charges towers and never backs down.',
  },
  {
    id: 'toly',
    name: 'Toly',
    faction: 'Trader',
    portrait: '/assets/3d/portraits/toly.png',
    flavor: 'Architect of the chain. Shielded support who buffs the whole lane.',
  },
  {
    id: 'gake',
    name: 'Gake',
    faction: 'Trader',
    portrait: '/assets/3d/portraits/gake.png',
    flavor: 'Salty sailor cat. Anchors the line and buffs the squad.',
  },
  {
    id: 'ansem',
    name: 'Ansem',
    faction: 'Jeet',
    portrait: '/assets/3d/portraits/ansem.png',
    flavor: 'Hooded assassin. Strikes from the shadows, exits before the dump.',
  },
  {
    id: 'sbf',
    name: 'SBF',
    faction: 'Jeet',
    portrait: '/assets/3d/portraits/sbf.png',
    flavor: 'The final boss of rugs. Slow, inevitable, and absolutely loaded.',
  },
  {
    id: 'pepe',
    name: 'Pepe',
    faction: 'Jeet',
    portrait: '/assets/3d/portraits/pepe.png',
    flavor: 'Meme swarm. Overwhelms cheap and spams the trench.',
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    faction: 'Trader',
    portrait: '/assets/3d/portraits/phoenix.png',
    flavor: 'Reborn on death. A tempo swing wrapped in fire.',
  },
]

export interface Step {
  n: string
  title: string
  body: string
}

export const STEPS: Step[] = [
  { n: '01', title: 'Build', body: 'Draft an 8-card war machine.' },
  { n: '02', title: 'Deploy', body: 'Spend elixir to send units down the lanes.' },
  { n: '03', title: 'Destroy', body: 'Break their line before the timer hits zero.' },
]

export interface Mechanic {
  label: string
  title: string
  body: string
}

export const MECHANICS: Mechanic[] = [
  { label: 'Economy', title: 'Elixir curve', body: 'Spend smart. Punish overextension.' },
  { label: 'Lanes', title: 'Three-front war', body: 'Commit, rotate, flank.' },
  { label: 'Spells', title: 'Impact VFX', body: 'Every hit, heal and burn reads clearly.' },
  { label: 'Progression', title: 'Win to unlock', body: 'Climb five tiers and expand your deck.' },
  { label: 'Units', title: 'Roles matter', body: 'Tanks, assassins, mages, swarms.' },
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


