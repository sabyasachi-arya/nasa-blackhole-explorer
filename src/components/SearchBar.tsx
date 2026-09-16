import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

const MAX_QUERY_LENGTH = 60;

interface SearchBarProps {
  value: string;
  resultCount: number;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, resultCount, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" focuses search, Escape clears it — standard for catalogue UIs.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="w-full">
      <div className="input-glass group relative flex items-center">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 text-ink-500 transition-colors duration-fast group-focus-within:text-cosmic-cyan"
        />

        <input
          ref={inputRef}
          type="search"
          value={value}
          maxLength={MAX_QUERY_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by name, discoverer, year or classification…"
          aria-label="Search the black hole catalogue"
          aria-describedby="search-hint"
          className="w-full bg-transparent py-3.5 pl-12 pr-28 text-sm text-ink-100 outline-none placeholder:text-ink-500 md:text-[15px]"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {/* Character counter appears once the field is meaningfully in use */}
          {value.length > 0 && (
            <span
              className={`stat-number animate-fade-in text-[11px] tabular-nums ${
                value.length >= MAX_QUERY_LENGTH ? 'text-cosmic-magenta' : 'text-ink-500'
              }`}
              aria-hidden="true"
            >
              {value.length}/{MAX_QUERY_LENGTH}
            </span>
          )}

          {value.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="animate-fade-in grid h-7 w-7 place-items-center rounded-full border border-ink-500/25 text-ink-300 transition-all duration-fast hover:border-cosmic-magenta/50 hover:bg-cosmic-magenta/15 hover:text-ink-100"
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : (
            <kbd className="hidden rounded border border-ink-500/30 px-1.5 py-0.5 text-[10px] text-ink-500 sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      <p id="search-hint" className="mt-2 px-1 text-xs text-ink-500" aria-live="polite">
        {value.trim()
          ? `${resultCount} ${resultCount === 1 ? 'object' : 'objects'} match “${value.trim()}”`
          : 'Searches names, alternate designations, discoverers, discovery years and descriptions.'}
      </p>
    </div>
  );
}
