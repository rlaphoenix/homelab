'use client'

type Props = {
  value: string
  onChange: (v: string) => void
  loading?: boolean
}

export default function SearchBar({ value, onChange, loading }: Props) {
  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search files..."
        className="w-full bg-transparent border-0 border-b border-border pb-2 pt-1 px-0 text-base text-text placeholder:text-dim focus:outline-none focus:border-text transition-colors"
      />
      {loading && (
        <span className="absolute right-0 top-1 text-[10px] text-muted tracking-widest uppercase animate-pulse">
          searching
        </span>
      )}
      {!loading && value && (
        <button
          onMouseDown={e => { e.preventDefault(); onChange('') }}
          className="absolute right-0 top-1 text-[10px] text-muted hover:text-ink transition-colors tracking-widest uppercase"
        >
          clear
        </button>
      )}
    </div>
  )
}
