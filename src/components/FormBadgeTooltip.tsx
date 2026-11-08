// src/components/FormBadgeTooltip.tsx
// Exact Portal implementation as requested:
// Uses e.currentTarget.getBoundingClientRect() on onMouseEnter.
// If rect.top < 160 -> opens below (top: rect.bottom + 10, transform: 'translate(-50%, 0)')
// Else -> opens above (top: rect.top - 10, transform: 'translate(-50%, -100%)')
// Rendered via createPortal(..., document.body) with position: fixed, zIndex: 999999, pointerEvents: 'none'.
// Ensures 100% reliable onMouseEnter/onMouseLeave on all 5 badges (indices 0, 1, 2, 3, 4).

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FormMatchDetail } from '../types';

interface FormBadgeTooltipProps {
  detail?: FormMatchDetail | null;
  teamName?: string;
  isLast?: boolean;
  size?: 'sm' | 'md';
}

export const FormBadgeTooltip: React.FC<FormBadgeTooltipProps> = ({
  detail,
  teamName = 'Takım',
  isLast = false,
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    isBelow: boolean;
  }>({
    top: 0,
    left: 0,
    isBelow: false
  });

  const buttonRef = useRef<HTMLButtonElement>(null);

  const updatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 260;

    // Center horizontally on button
    let left = rect.left + rect.width / 2;
    const halfWidth = tooltipWidth / 2;
    // Clamp inside window boundaries
    if (left - halfWidth < 12) {
      left = halfWidth + 12;
    } else if (left + halfWidth > window.innerWidth - 12) {
      left = window.innerWidth - 12 - halfWidth;
    }

    // Exact rule: If rect.top < 160 -> open downwards, else upwards
    const isBelow = rect.top < 160;
    const top = isBelow ? rect.bottom + 10 : rect.top - 10;

    setCoords({ top, left, isBelow });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    updatePosition(e.currentTarget);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    updatePosition(e.currentTarget);
    setIsOpen(prev => !prev);
  };

  // Close when window scrolls or resizes
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (buttonRef.current) {
        updatePosition(buttonRef.current);
      }
    };

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  if (!detail) {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold bg-slate-700 text-slate-300">
        -
      </span>
    );
  }

  const result = detail.result || 'D';
  let badgeBg = 'bg-slate-600 text-slate-100';
  let badgeLetter = 'B';
  let statusBadgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  let pointsLabel = '1 Puan (Beraberlik)';

  if (result === 'W') {
    badgeBg = 'bg-emerald-500 text-emerald-950 font-black';
    badgeLetter = 'G';
    statusBadgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    pointsLabel = '3 Puan (Galibiyet)';
  } else if (result === 'L') {
    badgeBg = 'bg-rose-500 text-rose-950 font-black';
    badgeLetter = 'M';
    statusBadgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    pointsLabel = '0 Puan (Mağlubiyet)';
  } else {
    badgeBg = 'bg-amber-400 text-amber-950 font-black';
    badgeLetter = 'B';
    statusBadgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    pointsLabel = '1 Puan (Beraberlik)';
  }

  const boxSizeClass = size === 'md'
    ? 'w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs rounded-md'
    : 'w-4 h-4 sm:w-4.5 sm:h-4.5 text-[9px] rounded-[4px]';

  const homeDisplayTeam = detail.isHome ? teamName : (detail.opponent || 'Rakip');
  const awayDisplayTeam = detail.isHome ? (detail.opponent || 'Rakip') : teamName;

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`inline-flex items-center justify-center font-black shadow-xs transition-transform hover:scale-125 focus:scale-125 focus:outline-hidden cursor-pointer select-none ${boxSizeClass} ${badgeBg} ${
          isLast ? 'ring-1.5 ring-amber-400/90 shadow-amber-400/40' : ''
        }`}
        aria-label={`${teamName} - ${detail.weekOrDate || 'Maç'}: ${badgeLetter}`}
      >
        {badgeLetter}
      </button>

      {/* Indicator under the 5th (last) match box */}
      {isLast && (
        <span
          className="absolute -bottom-1 w-1 h-1 bg-amber-400 rounded-full animate-pulse pointer-events-none"
          title="Son Maç"
        />
      )}

      {/* RENDERED DIRECTLY TO document.body VIA createPortal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: coords.isBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 999999,
            pointerEvents: 'none'
          }}
          className="w-64 p-3 rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 shadow-2xl text-left"
        >
          {/* Arrow */}
          {coords.isBelow ? (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-l border-t border-slate-700/90 -mb-1.5 pointer-events-none" />
          ) : (
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-slate-700/90 -mt-1.5 pointer-events-none" />
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 text-[10px]">
            <span className="font-extrabold text-slate-200 flex items-center space-x-1.5 truncate">
              <span>{detail.weekOrDate || 'Geçmiş Karşılaşma'}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide border shrink-0 ${
                detail.isHome
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
              }`}
            >
              {detail.isHome ? 'İç Saha [İ]' : 'Deplasman [D]'}
            </span>
          </div>

          {/* Match Score Display Card (ALWAYS Complete with opponent & score) */}
          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 mb-2">
            <div className="grid grid-cols-7 items-center text-center gap-1">
              {/* Home Team */}
              <div className="col-span-3 text-left">
                <span
                  className={`text-xs font-bold truncate block ${
                    detail.isHome ? 'text-emerald-400 font-extrabold' : 'text-slate-300'
                  }`}
                  title={homeDisplayTeam}
                >
                  {homeDisplayTeam}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                  {detail.isHome ? 'Ev Sahibi' : 'Rakip'}
                </span>
              </div>

              {/* Match Score */}
              <div className="col-span-1 text-center">
                <span className="font-mono text-amber-400 font-black text-sm whitespace-nowrap">
                  {detail.score}
                </span>
              </div>

              {/* Away Team */}
              <div className="col-span-3 text-right">
                <span
                  className={`text-xs font-bold truncate block ${
                    !detail.isHome ? 'text-emerald-400 font-extrabold' : 'text-slate-300'
                  }`}
                  title={awayDisplayTeam}
                >
                  {awayDisplayTeam}
                </span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                  {!detail.isHome ? 'Deplasman' : 'Rakip'}
                </span>
              </div>
            </div>

            {/* Half Time Score */}
            {detail.halfTimeScore && (
              <div className="mt-1.5 pt-1 border-t border-slate-800/60 text-center">
                <span className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  {detail.halfTimeScore}
                </span>
              </div>
            )}
          </div>

          {/* Footer: Result Label */}
          <div className="flex items-center justify-between text-[10px] pt-0.5">
            <span className="text-slate-400 font-medium">Form Neticesi:</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${statusBadgeStyle}`}>
              {pointsLabel}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
