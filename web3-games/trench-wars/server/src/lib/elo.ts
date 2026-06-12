const K = 32

export function calculateEloDelta(attackerElo: number, defenderElo: number, winner: 'attacker' | 'defender' | 'draw'): { attackerDelta: number; defenderDelta: number } {
  const expectedAttacker = 1 / (1 + Math.pow(10, (defenderElo - attackerElo) / 400))
  const actualAttacker = winner === 'attacker' ? 1 : winner === 'defender' ? 0 : 0.5
  const attackerDelta = Math.round(K * (actualAttacker - expectedAttacker))
  return { attackerDelta, defenderDelta: -attackerDelta }
}
