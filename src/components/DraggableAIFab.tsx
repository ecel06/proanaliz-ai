// src/components/DraggableAIFab.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Sparkles, GripVertical } from 'lucide-react';

export interface DraggableAIFabProps {
  id: string; // e.g. 'football', 'stocks', 'horse'
  onClick: () => void;
  title: string;
  label: string;
  gradientClass: string;
  borderColorClass?: string;
  shadowColorClass?: string;
  defaultBottomOffset?: number; // e.g. 80 on mobile (above bottom nav)
  defaultRightOffset?: number; // e.g. 16
}

interface Position {
  x: number;
  y: number;
}

export const DraggableAIFab: React.FC<DraggableAIFabProps> = ({
  id,
  onClick,
  title,
  label,
  gradientClass,
  borderColorClass = 'border-white/40',
  shadowColorClass = 'shadow-black/50',
  defaultBottomOffset = 84,
  defaultRightOffset = 16,
}) => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Drag tracking refs
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef<boolean>(false);

  const storageKey = `proanaliz_fab_pos_${id}_v1`;

  // Clamp helper to keep inside screen boundaries
  const clampPosition = useCallback((x: number, y: number, width: number, height: number): Position => {
    const padding = 10;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const maxY = Math.max(padding, window.innerHeight - height - padding);
    return {
      x: Math.min(Math.max(padding, x), maxX),
      y: Math.min(Math.max(padding, y), maxY),
    };
  }, []);

  // Initialize position from localStorage or default viewport coordinates
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          const w = fabRef.current?.offsetWidth || 150;
          const h = fabRef.current?.offsetHeight || 48;
          setPosition(clampPosition(parsed.x, parsed.y, w, h));
          return;
        }
      }
    } catch { }

    // Default position: bottom-right
    const w = fabRef.current?.offsetWidth || 150;
    const h = fabRef.current?.offsetHeight || 48;
    const isMobile = window.innerWidth < 640;
    const defaultY = window.innerHeight - h - (isMobile ? defaultBottomOffset : 24);
    const defaultX = window.innerWidth - w - defaultRightOffset;
    setPosition(clampPosition(defaultX, defaultY, w, h));
  }, [clampPosition, defaultBottomOffset, defaultRightOffset, storageKey]);

  // Adjust position if window is resized
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const w = fabRef.current?.offsetWidth || 150;
        const h = fabRef.current?.offsetHeight || 48;
        return clampPosition(prev.x, prev.y, w, h);
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Touch Start (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = fabRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    hasMovedRef.current = false;
  };

  // Touch Move (Mobile)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.startX;
    const deltaY = touch.clientY - dragStartRef.current.startY;

    if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 6) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const w = fabRef.current?.offsetWidth || 150;
      const h = fabRef.current?.offsetHeight || 48;
      const nextX = dragStartRef.current.initialX + deltaX;
      const nextY = dragStartRef.current.initialY + deltaY;
      setPosition(clampPosition(nextX, nextY, w, h));
    }
  };

  // Touch End (Mobile)
  const handleTouchEnd = () => {
    if (hasMovedRef.current) {
      setIsDragging(false);
      if (position) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(position));
        } catch { }
      }
    } else {
      // Normal Click
      onClick();
    }
  };

  // Mouse Down (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    const rect = fabRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    hasMovedRef.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;

      if (!hasMovedRef.current && Math.hypot(deltaX, deltaY) > 5) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }

      if (hasMovedRef.current) {
        const w = fabRef.current?.offsetWidth || 150;
        const h = fabRef.current?.offsetHeight || 48;
        const nextX = dragStartRef.current.initialX + deltaX;
        const nextY = dragStartRef.current.initialY + deltaY;
        setPosition(clampPosition(nextX, nextY, w, h));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (hasMovedRef.current) {
        setIsDragging(false);
        setPosition((currentPos) => {
          if (currentPos) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(currentPos));
            } catch { }
          }
          return currentPos;
        });
      } else {
        onClick();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={fabRef}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        right: !position ? `${defaultRightOffset}px` : undefined,
        bottom: !position ? `${defaultBottomOffset}px` : undefined,
        zIndex: 50,
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className={`select-none transition-shadow ${
        isDragging ? 'scale-105 opacity-90 cursor-grabbing' : 'cursor-grab'
      }`}
    >
      <div
        className={`flex items-center space-x-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl ${gradientClass} text-slate-950 font-black text-xs sm:text-sm shadow-2xl ${shadowColorClass} border-2 ${borderColorClass} active:scale-95 transition-transform group hover:scale-105 backdrop-blur-sm`}
        title={`${title} (Sürükleyip istediğiniz yere taşıyabilirsiniz)`}
      >
        {/* Subtle Grip Handle Indicator */}
        <div className="text-slate-950/40 group-hover:text-slate-950/70 -ml-1 transition-colors">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Animated Bot Icon */}
        <div className="relative">
          <Bot className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-50"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
          </span>
        </div>

        {/* Label */}
        <span className="font-black tracking-tight">{label}</span>

        {/* Sparkles */}
        <Sparkles className="w-4 h-4 text-slate-950 fill-current opacity-85 hidden sm:inline" />
      </div>
    </div>
  );
};
