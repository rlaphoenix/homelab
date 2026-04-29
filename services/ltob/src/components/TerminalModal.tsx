'use client'

import { useEffect, useRef, useState } from 'react'

type Line = { type: 'info' | 'warn' | 'success' | 'error' | 'done'; text: string }

type Props = {
  cartridgeId: string
  onClose: () => void
  onDone: () => void
}

export default function TerminalModal({ cartridgeId, onClose, onDone }: Props) {
  const [lines, setLines] = useState<Line[]>([])
  const [finished, setFinished] = useState(false)
  const [hasError, setHasError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const res = await fetch(`/api/cartridges/${cartridgeId}/update-from-drive`)
      if (!res.body) {
        setLines([{ type: 'error', text: 'No response stream from server.' }])
        setFinished(true); setHasError(true); return
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      readerRef.current = reader as unknown as ReadableStreamDefaultReader
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done || cancelled) break
        buf += value
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''
        for (const part of parts) {
          const dataLine = part.split('\n').find(l => l.startsWith('data: '))
          if (!dataLine) continue
          try {
            const evt = JSON.parse(dataLine.slice(6))
            setLines(prev => [...prev, { type: evt.type, text: evt.message }])
            if (evt.type === 'done') { setFinished(true); onDone() }
            if (evt.type === 'error') { setFinished(true); setHasError(true) }
          } catch { /* malformed SSE */ }
        }
      }
    }

    run().catch(e => {
      setLines(prev => [...prev, { type: 'error', text: String(e) }])
      setFinished(true); setHasError(true)
    })

    return () => { cancelled = true; readerRef.current?.cancel() }
  }, [cartridgeId, onDone])

  // Autoscroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  const lineColor = (type: Line['type']) => {
    if (type === 'error') return 'text-red-400'
    if (type === 'done') return 'text-green-400'
    if (type === 'warn') return 'text-yellow-400'
    if (type === 'success') return 'text-green-300'
    return 'text-white/60'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-6 bg-[#0e0e0e] border border-white/10 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <span className="text-[10px] tracking-widest uppercase text-white/40 font-mono">
            Y:\ — indexing drive
          </span>
          {finished && (
            <button
              onClick={onClose}
              className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white/80 transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
            >
              close
            </button>
          )}
        </div>

        {/* Log output */}
        <div
          ref={scrollRef}
          className="h-72 overflow-y-auto px-5 py-4 font-mono text-xs space-y-1 scroll-smooth"
        >
          {lines.map((l, i) => (
            <div key={i} className={`${lineColor(l.type)} leading-relaxed`}>
              <span className="text-white/20 mr-2 select-none">›</span>
              {l.text}
            </div>
          ))}
          {!finished && (
            <div className="text-white/30 animate-pulse">
              <span className="mr-2 select-none">›</span>
              <span className="inline-block w-1.5 h-3 bg-white/30 align-middle" />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-5 py-2.5 border-t border-white/10">
          <span className="text-[10px] font-mono text-white/25">
            {finished
              ? hasError ? 'completed with errors' : 'done'
              : 'running…'}
          </span>
        </div>
      </div>
    </div>
  )
}
