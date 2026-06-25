import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { PowerBall, rollGacha, rollGachaTen } from '@/lib/gacha';
import { useCollection } from '@/lib/store';
import { PowerBallComponent } from '@/components/PowerBall';
import { RollAnimation } from '@/components/RollAnimation';

export function GachaPage() {
  const [isRolling, setIsRolling] = useState(false);
  const [results, setResults] = useState<PowerBall[] | null>(null);
  const { addBalls } = useCollection();
  const rolledRef = useRef<PowerBall[] | null>(null);

  const handleRoll = (amount: number) => {
    const rolled = amount === 10 ? rollGachaTen() : [rollGacha()];
    addBalls(rolled);
    rolledRef.current = rolled;
    setIsRolling(true);
    setResults(null);
  };

  const handleAnimationComplete = () => {
    setIsRolling(false);
    setResults(rolledRef.current);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col relative">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center relative pt-[88px] sm:pt-16 z-10 w-full px-3 sm:px-4">
        <AnimatePresence mode="wait">
          {isRolling ? (
            <RollAnimation key="rolling" onComplete={handleAnimationComplete} />
          ) : results ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full max-w-5xl my-auto"
            >
              <h2 className="text-3xl sm:text-6xl font-black mb-6 sm:mb-12 tracking-widest text-white neon-text mt-4 sm:mt-8">
                RESULT
              </h2>

              <div
                className={`justify-center mb-8 sm:mb-16 w-full
                  ${results.length > 1
                    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-6'
                    : 'flex'
                  }`}
              >
                {results.map((ball, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.4, type: 'spring' }}
                    className="flex flex-col items-center gap-2 sm:gap-4"
                  >
                    <PowerBallComponent
                      ball={ball}
                      size={results.length > 1 ? 'sm' : 'lg'}
                      animated
                    />
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-widest">
                        {ball.rarity}
                      </div>
                      <div
                        className="text-xs sm:text-lg font-bold tracking-wider"
                        style={{ color: ball.color, textShadow: `0 0 10px ${ball.neonColor}` }}
                      >
                        {ball.name}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-8 sm:mb-12 w-full sm:w-auto px-2 sm:px-0">
                <button
                  onClick={() => setResults(null)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white/5 border border-white/20 rounded font-bold tracking-wider transition-all cursor-pointer hover:bg-white/10 text-sm sm:text-base"
                >
                  CLOSE
                </button>
                <button
                  onClick={() => handleRoll(results.length === 10 ? 10 : 1)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-cyan-500/20 border border-cyan-400 text-cyan-400 rounded font-bold tracking-wider transition-all cursor-pointer hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] text-sm sm:text-base"
                >
                  ROLL AGAIN ({results.length === 10 ? '10' : '1'})
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center w-full h-full my-auto"
            >
              <div className="relative w-52 h-52 sm:w-80 sm:h-80 md:w-96 md:h-96 mb-10 sm:mb-16 mt-4 sm:mt-8">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-900/50 shadow-[0_0_50px_rgba(6,182,212,0.1)] flex items-center justify-center">
                  <div className="w-[85%] h-[85%] rounded-full border-2 border-cyan-500/30 animate-[spin_10s_linear_infinite] border-dashed" />
                  <div className="absolute w-[75%] h-[75%] rounded-full border border-purple-500/30 animate-[spin_15s_linear_infinite_reverse] border-dashed" />
                  <div className="absolute w-[65%] h-[65%] rounded-full bg-gradient-to-br from-cyan-950/40 to-purple-950/40 backdrop-blur-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
                    <motion.div
                      className="text-cyan-500/10 text-5xl sm:text-9xl font-black absolute"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      RNG
                    </motion.div>
                    <div className="z-10 text-base sm:text-3xl font-black tracking-widest text-white neon-text text-center leading-loose">
                      POWERBALL<br />CORE
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-10 sm:mb-12 w-full sm:w-auto px-4 sm:px-0">
                <button
                  onClick={() => handleRoll(1)}
                  className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-black border border-cyan-500 overflow-hidden rounded shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-all" />
                  <div className="relative flex flex-col items-center gap-1">
                    <span className="text-xl sm:text-2xl font-black tracking-wider text-cyan-400">1 ROLL</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-400 tracking-widest">100 VERBAL</span>
                  </div>
                </button>

                <button
                  onClick={() => handleRoll(10)}
                  className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-black border border-purple-500 overflow-hidden rounded shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-all" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500" />
                  <div className="relative flex flex-col items-center gap-1">
                    <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">10 ROLLS</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-400 tracking-widest">1000 VERBAL</span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
