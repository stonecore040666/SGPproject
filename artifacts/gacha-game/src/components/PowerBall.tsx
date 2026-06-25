import React from 'react';
import { motion } from 'framer-motion';
import { PowerBall as PowerBallType } from '@/lib/gacha';

interface PowerBallProps {
  ball: PowerBallType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
};

export function PowerBallComponent({ ball, size = 'md', animated = false }: PowerBallProps) {
  const isRainbow = ball.rarity === 'ULTRA';

  const baseStyle: React.CSSProperties = {
    backgroundColor: isRainbow ? '#fff' : ball.color,
    boxShadow: isRainbow 
      ? `0 0 20px #ff0000, 0 0 40px #ff7f00, 0 0 60px #ffff00, 0 0 80px #00ff00, 0 0 100px #0000ff` 
      : `0 0 20px ${ball.neonColor}, inset 0 0 20px ${ball.neonColor}`,
  };

  const ballClass = `rounded-full flex items-center justify-center relative overflow-hidden ${sizeClasses[size]} ${isRainbow ? 'rainbow-bg' : ''}`;

  return (
    <motion.div
      className={ballClass}
      style={baseStyle}
      animate={
        animated 
          ? {
              scale: [1, 1.05, 1],
              rotate: [0, 360],
              boxShadow: isRainbow 
                ? [
                    `0 0 30px #ff0000, 0 0 50px #00ff00, inset 0 0 20px #0000ff`,
                    `0 0 50px #00ff00, 0 0 70px #0000ff, inset 0 0 20px #ff0000`,
                    `0 0 30px #0000ff, 0 0 50px #ff0000, inset 0 0 20px #00ff00`,
                  ]
                : [
                    `0 0 20px ${ball.neonColor}, inset 0 0 20px ${ball.neonColor}`,
                    `0 0 40px ${ball.neonColor}, inset 0 0 40px ${ball.neonColor}`,
                    `0 0 20px ${ball.neonColor}, inset 0 0 20px ${ball.neonColor}`,
                  ]
            }
          : undefined
      }
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-[pulse_2s_ease-in-out_infinite]"></div>
      {animated && ball.rarity !== 'COMMON' && ball.rarity !== 'UNCOMMON' && (
        <motion.div 
          className="absolute inset-0 border-2 border-white/50 rounded-full"
          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.div>
  );
}
