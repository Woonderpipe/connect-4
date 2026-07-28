'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type AppLocale, locales } from '@/lib/locales';
import { cn } from '@/lib/utils';

type LanguageMenuProps = {
  locale: AppLocale;
  onChange: (locale: AppLocale) => void;
  isDarkMode: boolean;
};

export function LanguageMenu({ locale, onChange, isDarkMode }: LanguageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label="Choose language"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        className={cn(
          'grid h-11 w-11 place-items-center rounded-2xl border shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80',
          isDarkMode
            ? 'border-zinc-800 bg-zinc-900 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800'
            : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50',
        )}
      >
        <Languages size={20} strokeWidth={2.25} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label="Choose language"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className={cn(
              'absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border p-2 shadow-2xl backdrop-blur-xl',
              isDarkMode ? 'border-zinc-700/80 bg-zinc-950/95' : 'border-zinc-200/90 bg-white/95',
            )}
          >
            <div className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Language</div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {locales.map((item) => {
                const selected = item.code === locale;
                return (
                  <button
                    key={item.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      onChange(item.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex min-h-11 items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80',
                      selected
                        ? isDarkMode ? 'bg-cyan-300 text-zinc-950' : 'bg-zinc-950 text-white'
                        : isDarkMode ? 'text-zinc-200 hover:bg-zinc-900' : 'text-zinc-700 hover:bg-zinc-100',
                    )}
                    lang={item.tag}
                    dir={item.direction}
                  >
                    <span>{item.nativeName}</span>
                    {selected && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
