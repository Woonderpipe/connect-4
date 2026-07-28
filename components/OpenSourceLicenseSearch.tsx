'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface OpenSourceLicenseSearchProps {
  children: ReactNode;
  emptyLabel: string;
  label: string;
  placeholder: string;
}

export function OpenSourceLicenseSearch({
  children,
  emptyLabel,
  label,
  placeholder,
}: OpenSourceLicenseSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  const applyFilter = useCallback((value: string) => {
    const normalizedQuery = value.trim().toLocaleLowerCase();
    const entries = containerRef.current?.querySelectorAll<HTMLElement>('[data-license-entry]') ?? [];
    let visibleEntries = 0;

    entries.forEach((entry) => {
      const matches = !normalizedQuery || (entry.dataset.search ?? '').includes(normalizedQuery);
      entry.hidden = !matches;
      entry.style.display = matches ? '' : 'none';
      if (matches) visibleEntries += 1;
    });

    const emptyState = containerRef.current?.querySelector<HTMLElement>('[data-license-empty]');
    if (emptyState) {
      emptyState.classList.toggle('hidden', visibleEntries !== 0);
      emptyState.style.display = visibleEntries === 0 ? '' : 'none';
    }
  }, []);

  useEffect(() => {
    const input = containerRef.current?.querySelector<HTMLInputElement>('input');
    if (!input) return;
    const handleInput = () => applyFilter(input.value);
    input.addEventListener('input', handleInput);
    input.dataset.searchReady = 'true';
    return () => {
      delete input.dataset.searchReady;
      input.removeEventListener('input', handleInput);
    };
  }, [applyFilter]);



  return (
    <div ref={containerRef}>
      <label className="sr-only" htmlFor="open-source-license-search">{label}</label>
      <input
        data-search-input
        id="open-source-license-search"
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-300 placeholder:text-zinc-500 focus:ring-2"
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          applyFilter(event.currentTarget.value);
        }}
        onInput={(event) => applyFilter(event.currentTarget.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
      <div className="mt-6 space-y-4">{children}</div>
      <p className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-400" data-license-empty>
        {emptyLabel}
      </p>
    </div>
  );
}
