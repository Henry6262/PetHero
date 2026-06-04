// Placeholder campaigns used to populate the UI before on-chain data is wired in.
// Covers are refined CSS gradients + a lucide icon (no emoji, no image assets).

export type IconKey =
  | 'waves'
  | 'coffee'
  | 'music'
  | 'mountain'
  | 'heart-pulse'
  | 'clapperboard';

export interface MockCampaign {
  id: string;
  title: string;
  blurb: string;
  creator: string;
  category: string;
  icon: IconKey;
  cover: string; // tailwind gradient classes (deep, premium)
  raised: number; // SOL
  goal: number; // SOL
  donors: number;
  daysLeft: number;
  symbol: string;
}

export const CAMPAIGNS: MockCampaign[] = [
  {
    id: 'solar-reef',
    title: 'Solar Reef — rebuild a coral nursery',
    blurb: 'A community-run reef restoration lab off the coast of Cebu, funded by the people who believe in it.',
    creator: 'Mara Ortega',
    category: 'Environment',
    icon: 'waves',
    cover: 'from-[#0b3b53] via-[#0e6b8a] to-[#1d4ed8]',
    raised: 412,
    goal: 600,
    donors: 1284,
    daysLeft: 11,
    symbol: 'REEF',
  },
  {
    id: 'night-owl',
    title: 'Night Owl Coffee — a co-op roastery',
    blurb: 'Twelve growers, one roastery, zero middlemen. Help us buy the first machine.',
    creator: 'Diego Salas',
    category: 'Small business',
    icon: 'coffee',
    cover: 'from-[#3a2417] via-[#7a4a25] to-[#c2783a]',
    raised: 188,
    goal: 250,
    donors: 643,
    daysLeft: 6,
    symbol: 'OWL',
  },
  {
    id: 'open-synth',
    title: 'OpenSynth — a free music studio for kids',
    blurb: 'An after-school program teaching music production. Every backer gets a verse credit.',
    creator: 'The Loop Collective',
    category: 'Community',
    icon: 'music',
    cover: 'from-[#221a4a] via-[#3b2f8f] to-[#5b6cff]',
    raised: 521,
    goal: 500,
    donors: 2010,
    daysLeft: 0,
    symbol: 'SYNTH',
  },
  {
    id: 'trail-mend',
    title: 'TrailMend — repair 40km of mountain trail',
    blurb: 'Volunteers, tools, and signage to reopen the ridge route before winter.',
    creator: 'Highland Trust',
    category: 'Outdoors',
    icon: 'mountain',
    cover: 'from-[#13241c] via-[#1f4a3a] to-[#2f7a8a]',
    raised: 96,
    goal: 320,
    donors: 311,
    daysLeft: 23,
    symbol: 'TRAIL',
  },
  {
    id: 'lumen-lab',
    title: 'Lumen Lab — open-source prosthetics',
    blurb: '3D-printable, low-cost prosthetic hands. Designs released free to the world.',
    creator: 'Aisha Karim',
    category: 'Medical',
    icon: 'heart-pulse',
    cover: 'from-[#0e2a4a] via-[#16538a] to-[#2563eb]',
    raised: 740,
    goal: 800,
    donors: 3402,
    daysLeft: 4,
    symbol: 'LUMEN',
  },
  {
    id: 'paper-moon',
    title: 'Paper Moon — an indie animated short',
    blurb: 'A hand-drawn 7-minute film. Top backers land in the credits and the token.',
    creator: 'Studio Paper Moon',
    category: 'Creative',
    icon: 'clapperboard',
    cover: 'from-[#1a1730] via-[#3a2f6a] to-[#7c5cff]',
    raised: 254,
    goal: 400,
    donors: 889,
    daysLeft: 14,
    symbol: 'MOON',
  },
];

export const RECENT_DONATIONS = [
  { name: 'phantom.sol', amount: 2.5, campaign: 'Solar Reef' },
  { name: 'jules', amount: 0.8, campaign: 'Lumen Lab' },
  { name: '0xMaya', amount: 5.0, campaign: 'Paper Moon' },
  { name: 'devon.sol', amount: 1.2, campaign: 'Night Owl Coffee' },
  { name: 'anon', amount: 12.0, campaign: 'OpenSynth' },
  { name: 'lena_k', amount: 0.5, campaign: 'TrailMend' },
  { name: 'sol_sister', amount: 3.3, campaign: 'Solar Reef' },
  { name: 'mkpatel', amount: 1.0, campaign: 'Lumen Lab' },
];

export const TOP_DONORS = [
  { name: 'lumen.sol', amount: 42 },
  { name: '0xMaya', amount: 31 },
  { name: 'sol_sister', amount: 28 },
  { name: 'devon', amount: 19 },
  { name: 'kai.sol', amount: 15 },
  { name: 'mira', amount: 12 },
  { name: 'anon', amount: 9 },
  { name: 'jpeg_lord', amount: 7 },
  { name: 'nadia', amount: 6 },
  { name: 'rico', amount: 4 },
  { name: 'tessa', amount: 3 },
  { name: 'omar', amount: 2 },
];
