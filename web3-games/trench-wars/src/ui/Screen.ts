export type Screen =
  | { name: 'landing' }
  | { name: 'onboarding' }
  | { name: 'menu' }
  | { name: 'deck' }
  | { name: 'battle'; mode: 'practice' | 'ladder'; defenderId?: string; defenderDeck?: string[] }
