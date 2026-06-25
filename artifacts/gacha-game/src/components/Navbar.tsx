import React from 'react';
import { Link, useLocation } from 'wouter';

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: '/', label: 'GACHA' },
    { href: '/collection', label: 'COLLECTION' },
    { href: '/rates', label: 'RATES' },
  ];

  return (
    <nav className="w-full fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-b border-white/10">
      {/* Mobile: two rows. Desktop: one row */}
      <div className="max-w-7xl mx-auto px-4">

        {/* Row 1: logo + verbal */}
        <div className="flex items-center justify-between h-12 sm:h-16">
          <Link
            href="/"
            className="text-base sm:text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cursor-pointer"
          >
            POWERBALL
          </Link>

          {/* Desktop nav links (hidden on mobile) */}
          <div className="hidden sm:flex gap-2">
            {links.map(link => {
              const active = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-bold tracking-wider transition-all duration-300 ${
                    active
                      ? 'text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Verbal badge */}
          <div className="px-2 sm:px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/50 flex items-center gap-1 sm:gap-2 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <span className="text-cyan-400 font-bold text-xs sm:text-sm">VERBAL</span>
            <span className="text-white font-mono font-bold text-xs sm:text-sm tracking-wider">
              999,999,999
            </span>
          </div>
        </div>

        {/* Row 2: mobile nav links */}
        <div className="flex sm:hidden justify-around border-t border-white/10 h-10">
          {links.map(link => {
            const active = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 flex items-center justify-center text-xs font-bold tracking-wider transition-all duration-200 ${
                  active
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
