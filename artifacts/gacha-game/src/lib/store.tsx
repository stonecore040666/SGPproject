import React, { createContext, useContext, useState, useEffect } from 'react';
import { PowerBall } from './gacha';

interface CollectionState {
  inventory: Record<string, number>;
  addBalls: (balls: PowerBall[]) => void;
  totalRolls: number;
}

const CollectionContext = createContext<CollectionState | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [totalRolls, setTotalRolls] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedInv = localStorage.getItem('powerball_inventory');
      const savedRolls = localStorage.getItem('powerball_rolls');
      if (savedInv) setInventory(JSON.parse(savedInv));
      if (savedRolls) {
        const parsed = Number(savedRolls);
        setTotalRolls(Number.isFinite(parsed) ? parsed : 0);
      }
    } catch (e) {
      console.error("Failed to parse inventory", e);
    }
    setIsLoaded(true);
  }, []);

  const addBalls = (balls: PowerBall[]) => {
    setInventory(prev => {
      const next = { ...prev };
      balls.forEach(b => {
        next[b.id] = (next[b.id] || 0) + 1;
      });
      localStorage.setItem('powerball_inventory', JSON.stringify(next));
      return next;
    });
    setTotalRolls(prev => {
      const next = prev + balls.length;
      localStorage.setItem('powerball_rolls', next.toString());
      return next;
    });
  };

  if (!isLoaded) return null;

  return (
    <CollectionContext.Provider value={{ inventory, addBalls, totalRolls }}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider');
  return ctx;
}
