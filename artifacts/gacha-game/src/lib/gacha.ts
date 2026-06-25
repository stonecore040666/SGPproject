export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' | 'ULTRA';

export interface PowerBall {
  id: string;
  name: string;
  rarity: Rarity;
  probability: number;
  color: string;
  neonColor: string;
}

export const POWER_BALLS: PowerBall[] = [
  { id: 'normal', name: 'Normal Ball', rarity: 'COMMON', probability: 50, color: '#f3f4f6', neonColor: 'rgba(255,255,255,0.2)' },
  { id: 'steel', name: 'Steel Ball', rarity: 'UNCOMMON', probability: 25, color: '#9ca3af', neonColor: 'rgba(255,255,255,0.6)' },
  { id: 'aqua', name: 'Aqua Ball', rarity: 'RARE', probability: 12, color: '#06b6d4', neonColor: 'rgba(6,182,212,0.8)' },
  { id: 'blaze', name: 'Blaze Ball', rarity: 'EPIC', probability: 7, color: '#f97316', neonColor: 'rgba(249,115,22,0.9)' },
  { id: 'storm', name: 'Storm Ball', rarity: 'LEGENDARY', probability: 4, color: '#a855f7', neonColor: 'rgba(168,85,247,1)' },
  { id: 'nova', name: 'Nova Ball', rarity: 'MYTHIC', probability: 1.5, color: '#eab308', neonColor: 'rgba(234,179,8,1)' },
  { id: 'god', name: 'God Ball', rarity: 'ULTRA', probability: 0.5, color: '#ffffff', neonColor: 'rainbow' },
];

export function rollGacha(): PowerBall {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const ball of POWER_BALLS) {
    cumulative += ball.probability;
    if (rand <= cumulative) {
      return ball;
    }
  }
  return POWER_BALLS[0]; // fallback
}

export function rollGachaTen(): PowerBall[] {
  return Array.from({ length: 10 }, rollGacha);
}
