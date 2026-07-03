import { useMemo, useRef, useState } from 'react'
import { Upload, X, Loader2, Check, ArrowLeft, FileText, AlertTriangle, Wand2 } from 'lucide-react'
import {
  buildTimetable,
  detectLayout,
  extractGrid,
  summarise,
  type Layout,
  type SourceKind,
} from '../lib/importTimetable'
import { DAYS_SHORT, type Timetable } from '../lib/timetable'

const KIND_LABEL: Record<SourceKind, string> = { excel: 'Excel', word: 'Word', pdf: 'PDF' }

export default function TimetableImport({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: (tt: Timetable) => void
}) {
  const [step, setStep] = useState<'upload' | 'map'>('upload')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const [grid, setGrid] = useState<string[][]>([])
  const [kind, setKind] = useState<SourceKind>('excel')
  const [note, setNote] = useState<string | undefined>()
  const [fileName, setFileName] = useState('')
  const [layout, setLayout] = useState<Layout | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const maxCols = useMemo(() => grid.reduce((m, r) => Math.max(m, r.length), 0), [grid])
  const built = useMemo(() => (layout ? buildTimetable(grid, layout) : null), [grid, layout])
  const stats = built ? summarise(built) : { periods: 0, classes: 0 }

  const handleFile = async (file: File) => {
    setError('')
    setBusy(true)
    try {
      const res = await extractGrid(file)
      if (!res.grid.length) throw new Error('Could not read any content from that file.')
      setGrid(res.grid)
      setKind(res.kind)
      setNote(res.note)
      setFileName(file.name)
      setLayout(detectLayout(res.grid))
      setStep('map')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file. Please try another.')
    } finally {
      setBusy(false)
    }
  }

  const colLabel = (ci: number) => {
    const head = layout ? grid[layout.headerRow]?.[ci] : ''
    return `Col ${ci + 1}${head ? ` · ${head.slice(0, 14)}` : ''}`
  }

  const setDayCol = (di: number, col: number | null) =>
    setLayout((l) => {
      if (!l) return l
      const dayCols = [...l.dayCols]
      dayCols[di] = col
      return { ...l, dayCols }
    })

  const ColSelect = ({
    value,
    onChange,
    allowNone,
  }: {
    value: number | null
    onChange: (v: number | null) => void
    allowNone?: boolean
  }) => (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-800 outline-none focus:border-teal-400"
    >
      {allowNone && <option value="">— none —</option>}
      {Array.from({ length: maxCols }, (_, ci) => (
        <option key={ci} value={ci}>
          {colLabel(ci)}
        </option>
      ))}
    </select>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/50" onClick={() => !busy && onClose()} />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-card">
        {/* header */}
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Wand2 size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-navy-900">Import timetable</h3>
              <p className="text-xs text-navy-400">
                {step === 'upload' ? 'PDF, Word or Excel' : `${KIND_LABEL[kind]} · ${fileName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-navy-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' ? (
            <>
              <label
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleFile(f)
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                  dragging ? 'border-teal-400 bg-teal-50/60' : 'border-navy-200 hover:border-teal-300 hover:bg-cloud'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
                {busy ? (
                  <>
                    <Loader2 size={30} className="animate-spin text-teal-500" />
                    <p className="mt-3 text-sm font-semibold text-navy-700">Reading your file…</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                      <Upload size={24} />
                    </span>
                    <p className="mt-4 text-base font-bold text-navy-900">Drop your timetable here</p>
                    <p className="mt-1 text-sm text-navy-500">or click to browse — PDF, Word (.docx) or Excel (.xlsx)</p>
                  </>
                )}
              </label>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
              <p className="mt-4 text-center text-xs text-navy-400">
                Your file is read privately in your browser — it is never uploaded to a server.
              </p>
            </>
          ) : (
            <>
              {note && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {note}
                </div>
              )}

              {/* mapping controls */}
              {layout && (
                <div className="rounded-2xl border border-navy-100 bg-cloud/60 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy-400">Map the columns</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-navy-700">Header row (days)</span>
                      <select
                        value={layout.headerRow}
                        onChange={(e) => setLayout({ ...layout, headerRow: Number(e.target.value) })}
                        className="w-full rounded-lg border border-navy-200 bg-white px-2.5 py-1.5 text-sm text-navy-800 outline-none focus:border-teal-400"
                      >
                        {grid.slice(0, 15).map((_, r) => (
                          <option key={r} value={r}>
                            Row {r + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-navy-700">Period label column</span>
                      <ColSelect value={layout.periodCol} onChange={(v) => setLayout({ ...layout, periodCol: v })} allowNone />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-navy-700">Start-time column</span>
                      <ColSelect value={layout.startCol} onChange={(v) => setLayout({ ...layout, startCol: v })} allowNone />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-navy-700">End-time column (optional)</span>
                      <ColSelect value={layout.endCol} onChange={(v) => setLayout({ ...layout, endCol: v })} allowNone />
                    </label>
                  </div>

                  <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-navy-400">Day columns</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {DAYS_SHORT.map((d, di) => (
                      <label key={d} className="block">
                        <span className="mb-1 block text-xs font-semibold text-navy-700">{d}</span>
                        <ColSelect value={layout.dayCols[di]} onChange={(v) => setDayCol(di, v)} allowNone />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* result summary */}
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
                <Check size={16} />
                Detected <b>{stats.periods}</b> periods and <b>{stats.classes}</b> classes.
                {stats.classes === 0 && ' Try adjusting the column mapping above.'}
              </div>

              {/* raw grid preview */}
              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-navy-400">File preview</p>
              <div className="max-h-56 overflow-auto rounded-xl border border-navy-100">
                <table className="min-w-full border-collapse text-xs">
                  <tbody>
                    {grid.slice(0, 12).map((row, r) => (
                      <tr key={r} className={layout && r === layout.headerRow ? 'bg-teal-50' : r % 2 ? 'bg-cloud/50' : ''}>
                        <td className="border border-navy-100 px-2 py-1 font-bold text-navy-300">{r + 1}</td>
                        {Array.from({ length: maxCols }, (_, c) => (
                          <td key={c} className="max-w-[140px] truncate border border-navy-100 px-2 py-1 text-navy-700">
                            {row[c] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {grid.length > 12 && (
                <p className="mt-1 text-xs text-navy-400">Showing first 12 of {grid.length} rows.</p>
              )}
            </>
          )}
        </div>

        {/* footer */}
        {step === 'map' && (
          <div className="flex items-center justify-between border-t border-navy-100 px-6 py-4">
            <button onClick={() => setStep('upload')} className="btn-ghost text-sm">
              <ArrowLeft size={16} /> Choose another file
            </button>
            <button
              onClick={() => built && onImport(built)}
              disabled={!built || stats.classes === 0}
              className="btn-primary text-sm"
            >
              <FileText size={16} /> Import {stats.classes} classes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
