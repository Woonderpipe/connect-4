'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { GravityDirection, Player } from '@/lib/connect4-logic';

interface PieceProps {
  player: Player;
  isWinning?: boolean;
  isGhost?: boolean;
  isPreview?: boolean;
  theme?: { red: string; yellow: string };
  isTabletopMode?: boolean;
  entryDirection?: GravityDirection;
}

const PieceComponent = ({ player, isWinning, isGhost, isPreview, theme, isTabletopMode, entryDirection = 'down' }: PieceProps) => {
  if (!player && !isGhost) return null;

  const redColor = theme?.red || "#ef4444";
  const yellowColor = theme?.yellow || "#fbbf24";

  const baseColor = player === 1 ? redColor : yellowColor;

  const getInitialPosition = () => {
    if (entryDirection === 'left') return { x: 500, y: 0 };
    if (entryDirection === 'right') return { x: -500, y: 0 };
    if (entryDirection === 'up') return { x: 0, y: 500 };
    return { x: 0, y: isTabletopMode && player === 2 ? 500 : -500 };
  };

  const initialPosition = getInitialPosition();

  return (
    <motion.div
      initial={isGhost || isPreview ? { opacity: 0, scale: isPreview ? 0.88 : 1 } : { ...initialPosition, opacity: 0 }}
      animate={isGhost || isPreview ? { opacity: 1, scale: 1 } : { x: 0, y: 0, opacity: 1 }}
      transition={isGhost || isPreview ? { duration: 0.15 } : {
        type: "spring",
        bounce: 0.2,
        duration: 0.6,
      }}
      style={{
        backgroundColor: isGhost ? 'transparent' : baseColor,
        borderColor: isGhost ? baseColor : 'transparent',
        willChange: "transform, opacity"
      }}
      className={cn(
        "w-full h-full rounded-full",
        !isGhost && "shadow-sm",
        isGhost && "border-[3px] border-dashed opacity-40",
        isWinning && "ring-4 ring-white ring-offset-4 ring-offset-black/5 animate-pulse z-10"
      )}
    />
  );
};

export const Piece = memo(PieceComponent);
