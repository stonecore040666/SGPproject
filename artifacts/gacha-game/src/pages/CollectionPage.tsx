import React from 'react';
import { Navbar } from '@/components/Navbar';
import { useCollection } from '@/lib/store';
import { POWER_BALLS } from '@/lib/gacha';
import { PowerBallComponent } from '@/components/PowerBall';

export function CollectionPage() {
  const { inventory, totalRolls } = useCollection();

  return (
    <div className="min-h-screen bg-black text-white pt-28 sm:pt-24 px-3 sm:px-4 pb-12 relative overflow-x-hidden">
      <Navbar />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 border-b border-white/10 pb-4 sm:pb-6 gap-2 sm:gap-4">
          <h2 className="text-3xl sm:text-5xl font-black tracking-widest neon-text">
            COLLECTION
          </h2>
          <div className="text-left sm:text-right">
            <div className="text-xs font-bold text-gray-400 tracking-widest mb-0.5">TOTAL ROLLS</div>
            <div className="text-xl sm:text-2xl font-mono font-black">{totalRolls.toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {POWER_BALLS.map(ball => {
            const count = inventory[ball.id] || 0;
            const isUnlocked = count > 0;

            return (
              <div
                key={ball.id}
                className={`relative flex flex-col items-center p-3 sm:p-6 border rounded-xl backdrop-blur-sm transition-all duration-300
                  ${isUnlocked
                    ? 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 shadow-lg'
                    : 'bg-black/40 border-white/5 opacity-50 grayscale'
                  }`}
                style={isUnlocked ? { boxShadow: `0 0 14px ${ball.neonColor}` } : undefined}
              >
                <div className="absolute top-2 right-2 sm:top-2 sm:right-3 font-mono font-bold text-sm sm:text-xl text-gray-500">
                  x{count}
                </div>
                <div className="mb-3 sm:mb-6 mt-2 sm:mt-4">
                  <PowerBallComponent
                    ball={ball}
                    size="sm"
                    animated={isUnlocked && ball.rarity !== 'COMMON' && ball.rarity !== 'UNCOMMON'}
                  />
                </div>
                <div className="text-center w-full">
                  <div className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest mb-0.5">
                    {ball.rarity}
                  </div>
                  <div
                    className="text-xs sm:text-sm font-bold tracking-wider truncate"
                    style={
                      isUnlocked
                        ? { color: ball.color, textShadow: `0 0 8px ${ball.neonColor}` }
                        : undefined
                    }
                  >
                    {isUnlocked ? ball.name : '???'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
