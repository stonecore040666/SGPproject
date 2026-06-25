import React from 'react';
import { Navbar } from '@/components/Navbar';
import { POWER_BALLS } from '@/lib/gacha';

export function RatesPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-28 sm:pt-24 px-4 pb-12 overflow-x-hidden">
      <Navbar />
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-3xl sm:text-5xl font-black mb-8 sm:mb-12 tracking-widest text-center neon-text">
          DROP RATES
        </h2>

        {/* Desktop table */}
        <div className="hidden sm:block bg-black/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 font-bold tracking-widest text-gray-400">RARITY</th>
                <th className="p-4 font-bold tracking-widest text-gray-400">NAME</th>
                <th className="p-4 font-bold tracking-widest text-gray-400 text-right">PROB</th>
              </tr>
            </thead>
            <tbody>
              {POWER_BALLS.map(ball => (
                <tr key={ball.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td
                    className="p-4 font-bold tracking-wider text-sm"
                    style={{ color: ball.color, textShadow: `0 0 10px ${ball.neonColor}` }}
                  >
                    {ball.rarity}
                  </td>
                  <td className="p-4 font-bold flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: ball.rarity === 'ULTRA' ? '#fff' : ball.color,
                        boxShadow:
                          ball.rarity === 'ULTRA'
                            ? '0 0 8px #fff'
                            : `0 0 8px ${ball.neonColor}`,
                      }}
                    />
                    {ball.name}
                  </td>
                  <td className="p-4 text-right font-mono font-bold tracking-wider text-lg">
                    {ball.probability.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="flex flex-col gap-3 sm:hidden">
          {POWER_BALLS.map(ball => (
            <div
              key={ball.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
              style={{ boxShadow: `0 0 8px ${ball.neonColor}20` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: ball.rarity === 'ULTRA' ? '#fff' : ball.color,
                    boxShadow:
                      ball.rarity === 'ULTRA'
                        ? '0 0 10px #fff'
                        : `0 0 10px ${ball.neonColor}`,
                  }}
                />
                <div>
                  <div
                    className="text-sm font-black tracking-wider"
                    style={{ color: ball.color, textShadow: `0 0 8px ${ball.neonColor}` }}
                  >
                    {ball.name}
                  </div>
                  <div className="text-xs font-bold text-gray-500 tracking-widest">
                    {ball.rarity}
                  </div>
                </div>
              </div>
              <div className="font-mono font-black text-xl text-white">
                {ball.probability.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
