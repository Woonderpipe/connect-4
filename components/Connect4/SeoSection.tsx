import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn, toArabicNumerals } from '@/lib/utils';
import { ShieldCheck, Globe, Sparkles, ChevronDown } from 'lucide-react';
import type { TranslationStrings } from '@/lib/translations';

interface SeoSectionProps {
  isDarkMode?: boolean;
  isRtl?: boolean;
  t: TranslationStrings;
}

const QA_KEYS = [
  ['seoQa1Question', 'seoQa1Answer'],
  ['seoQa2Question', 'seoQa2Answer'],
  ['seoQa3Question', 'seoQa3Answer'],
  ['seoQa4Question', 'seoQa4Answer'],
] as const;

export const SeoSection = ({ isDarkMode, isRtl, t }: SeoSectionProps) => {
  const useArabicNumerals = Boolean(isRtl);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      aria-label={t.seoSectionTitle || 'Play Connect 4 Online'}
      className={cn(
        'w-full rounded-3xl border p-4 sm:p-5 md:p-6 mt-2 transition-colors duration-500',
        isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/80 border-zinc-200'
      )}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2
              className={cn(
                'text-sm sm:text-base md:text-lg font-black tracking-tight leading-tight text-balance',
                isDarkMode ? 'text-white' : 'text-zinc-900'
              )}
            >
              {toArabicNumerals(t.seoSectionTitle || 'Play Connect 4 Online', useArabicNumerals)}
            </h2>
            <p
              className={cn(
                'text-xs sm:text-sm leading-relaxed max-w-[56ch] break-words text-balance',
                isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
              )}
            >
              {toArabicNumerals(
                t.seoSectionIntro ||
                  'A completely free online Connect 4 game with smooth gameplay and instant matches.',
                useArabicNumerals
              )}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0.7, scale: 0.98, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className={cn(
              'w-fit self-start shrink-0 rounded-2xl px-3 py-2 border flex items-center gap-2 max-w-full',
              isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            )}
          >
            <ShieldCheck size={14} />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase leading-snug break-words text-balance">
              {toArabicNumerals(t.seoSectionFreeBadge || '100% Free • No account • No ads', useArabicNumerals)}
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-2.5 md:grid-cols-2">
          {QA_KEYS.map(([qKey, aKey], idx) => {
            const isOpen = openIndex === idx;
            const answerId = `seo-answer-${idx}`;

            return (
              <div
                key={qKey}
                className={cn(
                  'h-full rounded-2xl border px-3 py-2.5 transition-colors',
                  isDarkMode
                    ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-start cursor-pointer flex items-start justify-between gap-2"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  <span
                    className={cn(
                      'text-[11px] sm:text-xs md:text-[13px] leading-snug font-bold break-words pe-1',
                      isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                    )}
                  >
                    {toArabicNumerals(t[qKey] || '', useArabicNumerals)}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'text-zinc-500',
                        isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                      )}
                    >
                      {idx % 2 === 0 ? <Globe size={12} /> : <Sparkles size={12} />}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.22 }}
                      className={cn(isDarkMode ? 'text-zinc-500' : 'text-zinc-500')}
                    >
                      <ChevronDown size={14} />
                    </motion.span>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={answerId}
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <motion.p
                        initial={{ y: -4, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -4, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          'pt-2 text-[11px] sm:text-xs leading-relaxed break-words',
                          isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
                        )}
                      >
                        {toArabicNumerals(t[aKey] || '', useArabicNumerals)}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
