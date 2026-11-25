// src/components/DraggableAIFab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, GripVertical } from 'lucide-react';

export interface DraggableAIFabProps {
  id: 'football' | 'stocks' | 'horse' | 'admin-copilot';
  onClick: () => void;
  title: string;
  label: string;
  defaultBottomOffset?: number; // e.g. 84 on mobile (above bottom nav)
  defaultRightOffset?: number; // e.g. 16
  gradientClass?: string;
  borderColorClass?: string;
  shadowColorClass?: string;
}

interface Position {
  x: number;
  y: number;
}

const THEME_CONFIGS = {
  football: {
    bg: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #059669 100%)',
    border: '2px solid rgba(167, 243, 208, 0.9)',
    shadow: '0 10px 25px -4px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0, 0, 0, 0.35)',
    textColor: '#020617',
  },
  stocks: {
    bg: 'linear-gradient(135deg, #22d3ee 0%, #14b8a6 50%, #10b981 100%)',
    border: '2px solid rgba(165, 243, 252, 0.9)',
    shadow: '0 10px 25px -4px rgba(34, 211, 238, 0.5), 0 4px 12px rgba(0, 0, 0, 0.35)',
    textColor: '#020617',
  },
  horse: {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #facc15 50%, #eab308 100%)',
    border: '2px solid rgba(254, 240, 138, 0.9)',
    shadow: '0 10px 25px -4px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0, 0, 0, 0.35)',
    textColor: '#020617',
  },
  'admin-copilot': {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
    border: '2px solid rgba(254, 240, 138, 0.95)',
    shadow: '0 10px 25px -4px rgba(245, 158, 11, 0.6), 0 4px 12px rgba(0, 0, 0, 0.35)',
    textColor: '#020617',
  },
};

export const DraggableAIFab: React.FC<DraggableAIFabProps> = ({
  id,
  onClick,
  title,
  label,
  defaultBottomOffset = 84,
  defaultRightOffset = 16,
}) => {
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef<Position>({ x: 0, y: 0 });

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  const storageKey = `proanaliz_fab_pos_${id}_v2`;
  const theme = THEME_CONFIGS[id] || THEME_CONFIGS.football;

  const clampPosition = (x: number, y: number, width: number, height: number): Position => {
    const padding = 8;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const maxY = Math.max(padding, window.innerHeight - height - padding);
    return {
      x: Math.min(Math.max(padding, x), maxX),
      y: Math.min(Math.max(padding, y), maxY),
    };
  };

  // Initial mount: load saved position or calculate default
  useEffect(() => {
    const w = buttonRef.current?.offsetWidth || 150;
    const h = buttonRef.current?.offsetHeight || 44;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const clamped = clampPosition(parsed.x, parsed.y, w, h);
          posRef.current = clamped;
          setPosition(clamped);
          return;
        }
      }
    } catch { }

    const isMobile = window.innerWidth < 640;
    const defaultY = window.innerHeight - h - (isMobile ? defaultBottomOffset : 24);
    const defaultX = window.innerWidth - w - defaultRightOffset;
    const initPos = clampPosition(defaultX, defaultY, w, h);
    posRef.current = initPos;
    setPosition(initPos);
  }, [defaultBottomOffset, defaultRightOffset, storageKey]);

  // Touch handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    hasMovedRef.current = false;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.startX;
    const deltaY = touch.clientY - dragStartRef.current.startY;

    if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 5) {
      hasMovedRef.current = true;
      isDraggingRef.current = true;
    }

    if (hasMovedRef.current && buttonRef.current) {
      const w = buttonRef.current.offsetWidth || 150;
      const h = buttonRef.current.offsetHeight || 44;
      const nextPos = clampPosition(
        dragStartRef.current.initialX + deltaX,
        dragStartRef.current.initialY + deltaY,
        w,
        h
      );
      posRef.current = nextPos;
      // Direct DOM update for 60fps zero-lag performance!
      buttonRef.current.style.left = `${nextPos.x}px`;
      buttonRef.current.style.top = `${nextPos.y}px`;
      buttonRef.current.style.right = 'auto';
      buttonRef.current.style.bottom = 'auto';
    }
  };

  const handleTouchEnd = () => {
    if (hasMovedRef.current) {
      isDraggingRef.current = false;
      setPosition(posRef.current);
      try {
        localStorage.setItem(storageKey, JSON.stringify(posRef.current));
      } catch { }
    } else {
      onClick();
    }
  };

  // Mouse handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    hasMovedRef.current = false;
    isDraggingRef.current = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 5) {
        hasMovedRef.current = true;
        isDraggingRef.current = true;
      }

      if (hasMovedRef.current && buttonRef.current) {
        const w = buttonRef.current.offsetWidth || 150;
        const h = buttonRef.current.offsetHeight || 44;
        const nextPos = clampPosition(
          dragStartRef.current.initialX + deltaX,
          dragStartRef.current.initialY + deltaY,
          w,
          h
        );
        posRef.current = nextPos;
        // Direct DOM update for zero-lag smooth dragging!
        buttonRef.current.style.left = `${nextPos.x}px`;
        buttonRef.current.style.top = `${nextPos.y}px`;
        buttonRef.current.style.right = 'auto';
        buttonRef.current.style.bottom = 'auto';
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasMovedRef.current) {
        isDraggingRef.current = false;
        setPosition(posRef.current);
        try {
          localStorage.setItem(storageKey, JSON.stringify(posRef.current));
        } catch { }
      } else {
        onClick();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        right: !position ? `${defaultRightOffset}px` : undefined,
        bottom: !position ? `${defaultBottomOffset}px` : undefined,
        zIndex: 50,
        touchAction: 'none',
        background: theme.bg,
        border: theme.border,
        boxShadow: theme.shadow,
        color: theme.textColor,
        willChange: 'left, top',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className="theme-keep-color flex items-center space-x-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl font-black text-xs sm:text-sm select-none cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform"
      title={`${title} (İstediğiniz yere sürükleyip bırakabilirsiniz)`}
    >
      {/* Drag Grip Handle */}
      <span className="opacity-40 hover:opacity-80 transition-opacity -ml-1">
        <GripVertical className="w-3.5 h-3.5 text-slate-950" />
      </span>

      {/* Bot Icon with Pulse */}
      <div className="relative">
        <Bot className="w-5 h-5 text-slate-950" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
        </span>
      </div>

      {/* Text Label - Guaranteed Solid High-Contrast Black */}
      <span className="font-black tracking-tight text-slate-950">{label}</span>

      {/* Sparkles */}
      <Sparkles className="w-4 h-4 text-slate-950 fill-current opacity-85 hidden sm:inline" />
    </button>
  );
};
