import React, { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn, toArabicNumerals } from '@/lib/utils';

interface NumberPickerProps {
  value: number;
  onChange: (val: number) => void;
  max: number;
  isDarkMode?: boolean;
  isRtl?: boolean;
}

export const NumberPicker = ({ value, onChange, max, isDarkMode, isRtl }: NumberPickerProps) => {
  const [direction, setDirection] = useState(1);

  const handleIncrement = () => {
    setDirection(-1);
    onChange(value === max ? 0 : value + 1);
  };

  const handleDecrement = () => {
    setDirection(1);
    onChange(value === 0 ? max : value - 1);
  };

  const [panY, setPanY] = useState(0);

  const handlePan = (_event: PointerEvent, info: PanInfo) => {
    const newPanY = panY + info.delta.y;
    // Swiping UP (negative delta) should DECREASE the number
    // Swiping DOWN (positive delta) should INCREASE the number
    if (newPanY < -30) {
      handleDecrement();
      setPanY(0);
    } else if (newPanY > 30) {
      handleIncrement();
      setPanY(0);
    } else {
      setPanY(newPanY);
    }
  };

  const handlePanEnd = (_event: PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    if (Math.abs(velocity) > 600) {
      const steps = Math.min(Math.floor(Math.abs(velocity) / 300), 12);
      let count = 0;
      const isIncreasing = velocity > 0;
      
      const spin = () => {
        if (isIncreasing) handleIncrement();
        else handleDecrement();
        count++;
        if (count < steps) {
          setTimeout(spin, 40 + (count * 15)); // Gradual slowdown
        }
      };
      spin();
    }
    setPanY(0);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button 
        type="button"
        onClick={handleIncrement} 
        aria-label="Increase value"
        className={cn(
          "p-2 rounded-full transition-colors hidden sm:block",
          isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
        )}
      >
        <ChevronUp size={20} />
      </button>
      
      <div 
        className="relative h-16 w-20 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <motion.div
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          className="absolute inset-0 flex items-center justify-center"
        >
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={value}
              custom={direction}
              variants={{
                initial: (d) => ({ y: d * 40, opacity: 0, filter: 'blur(4px)', scale: 0.9 }),
                animate: { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 },
                exit: (d) => ({ y: d * -40, opacity: 0, filter: 'blur(4px)', scale: 0.9 })
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
              className={cn("text-4xl font-black absolute", isDarkMode ? "text-white" : "text-zinc-900")}
            >
              {toArabicNumerals(value, !!isRtl).toString().padStart(2, isRtl ? '٠' : '0')}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <button 
        type="button"
        onClick={handleDecrement} 
        aria-label="Decrease value"
        className={cn(
          "p-2 rounded-full transition-colors hidden sm:block",
          isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
        )}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
};
