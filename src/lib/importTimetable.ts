import { cellKey, defaultTimetable, newId, type ClassCell, type Period, type Timetable } from './timetable'

export type SourceKind = 'excel' | 'word' | 'pdf'

export interface ExtractResult {
  grid: string[][]
  kind: SourceKind
  note?: string
}

export interface Layout {
  headerRow: number
  /** Column index for each day (0=Mon … 4=Fri), or null if unmapped. */
  dayCols: (number | null)[]
  periodCol: number | null
  startCol: number | null
  endCol: number | null
}

/* ------------------------------- helpers -------------------------------- */

const norm = (v: unknown) => String(v ?? '').replace(/\s+/g, ' ').trim()

const DAY_TOKENS = [
  ['monday', 'mon'],
  ['tuesday', 'tues', 'tue'],
  ['wednesday', 'weds', 'wed'],
  ['thursday', 'thurs', 'thur', 'thu'],
  ['friday', 'fri'],
]

export function dayIndexOf(s: string): number {
  const t = norm(s).toLowerCase()
  if (!t) return -1
  for (let i = 0; i < DAY_TOKENS.length; i++) {
    if (DAY_TOKENS[i].some((tok) => t === tok || t.startsWith(tok + ' ') || t.startsWith(tok))) return i
  }
  return -1
}

function timeTokens(s: string): string[] {
  const out: string[] = []
  const re = /(\d{1,2})[:.h](\d{2})\s*(am|pm)?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    let h = +m[1]
    const min = m[2]
    const ap = (m[3] || '').toLowerCase()
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    if (h >= 0 && h <= 23) out.push(`${String(h).padStart(2, '0')}:${min}`)
  }
  return out
}

const looksLikeTime = (s: string) => timeTokens(s).length > 0
const parseTimes = (s: string) => {
  const t = timeTokens(s)
  return { start: t[0] ?? '', end: t[1] ?? '' }
}

/** Best-effort split of a raw class cell into subject / class / room. */
export function splitClass(text: string): ClassCell {
  const t = norm(text)
  let room: string | undefined
  const rm = t.match(/\b(?:room|rm)\.?\s*([A-Za-z]?\d{1,3}[A-Za-z]?)\b/i)
  if (rm) room = rm[1]
  const cleaned = rm ? t.replace(rm[0], '').trim() : t
  const parts = cleaned.split(/\s*[/|,;–-]\s*|\s{2,}/).map(norm).filter(Boolean)
  const subject = (parts[0] || cleaned).slice(0, 48)
  const className = (parts[1] || '').slice(0, 48)
  return { subject, className, room, color: 'teal' }
}

/* ------------------------------ extraction ------------------------------ */

async function fromExcel(file: File): Promise<string[][]> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false }) as unknown[][]
  return rows.map((r) => (Array.isArray(r) ? r.map(norm) : []))
}

async function fromWord(file: File): Promise<string[][]> {
  const mammoth = await import('mammoth')
  const buf = await file.arrayBuffer()
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf })
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const tables = Array.from(dom.querySelectorAll('table'))
  if (tables.length) {
    let best = tables[0]
    let bestCount = -1
    for (const t of tables) {
      const c = t.querySelectorAll('td,th').length
      if (c > bestCount) {
        bestCount = c
        best = t
      }
    }
    const grid: string[][] = []
    best.querySelectorAll('tr').forEach((tr) => {
      grid.push(Array.from(tr.querySelectorAll('td,th')).map((td) => norm(td.textContent)))
    })
    if (grid.length) return grid
  }
  const { value: text } = await mammoth.extractRawText({ arrayBuffer: buf })
  return text
    .split(/\r?\n/)
    .map((l) => [norm(l)])
    .filter((r) => r[0])
}

async function fromPdf(file: File): Promise<string[][]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  const data = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data }).promise
  const items: { x: number; y: number; str: string }[] = []
  const pages = Math.min(pdf.numPages, 4)
  for (let p = 1; p <= pages; p++) {
    const page = await pdf.getPage(p)
    const vp = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    for (const it of content.items as { str: string; transform: number[] }[]) {
      const str = norm(it.str)
      if (!str) continue
      const x = it.transform[4]
      const y = vp.height - it.transform[5] + p * 100000 // stack pages top to bottom
      items.push({ x, y, str })
    }
  }
  return clusterToGrid(items)
}

/** Reconstructs an approximate table grid from positioned PDF text runs. */
function clusterToGrid(items: { x: number; y: number; str: string }[]): string[][] {
  if (!items.length) return []
  const sorted = [...items].sort((a, b) => a.y - b.y)
  const rows: (typeof items)[] = []
  let cur: typeof items = []
  let lastY: number | null = null
  const yTol = 6
  for (const it of sorted) {
    if (lastY === null || Math.abs(it.y - lastY) <= yTol) {
      cur.push(it)
      lastY = lastY === null ? it.y : (lastY + it.y) / 2
    } else {
      rows.push(cur)
      cur = [it]
      lastY = it.y
    }
  }
  if (cur.length) rows.push(cur)

  // cluster x positions into column centres
  const xs = items.map((i) => i.x).sort((a, b) => a - b)
  const centres: number[] = []
  const xTol = 24
  for (const x of xs) {
    const last = centres[centres.length - 1]
    if (last === undefined || x - last > xTol) centres.push(x)
  }

  return rows.map((r) => {
    const cells = new Array(centres.length).fill('')
    for (const it of [...r].sort((a, b) => a.x - b.x)) {
      let ci = 0
      let best = Infinity
      centres.forEach((c, idx) => {
        const d = Math.abs(c - it.x)
        if (d < best) {
          best = d
          ci = idx
        }
      })
      cells[ci] = cells[ci] ? `${cells[ci]} ${it.str}` : it.str
    }
    return cells
  })
}

export async function extractGrid(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    return { grid: await fromExcel(file), kind: 'excel' }
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    return { grid: await fromWord(file), kind: 'word' }
  }
  if (name.endsWith('.pdf')) {
    return {
      grid: await fromPdf(file),
      kind: 'pdf',
      note: 'PDF layouts vary — please check the mapping and preview carefully.',
    }
  }
  throw new Error('Unsupported file type. Please upload a PDF, Word (.docx) or Excel (.xlsx) file.')
}

/* --------------------------- layout detection --------------------------- */

const maxCols = (grid: string[][]) => grid.reduce((m, r) => Math.max(m, r.length), 0)

export function detectLayout(grid: string[][]): Layout {
  let headerRow = 0
  let bestCount = 0
  let headerDayCols: (number | null)[] = [null, null, null, null, null]

  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const cols: (number | null)[] = [null, null, null, null, null]
    let count = 0
    grid[r].forEach((cell, ci) => {
      const di = dayIndexOf(cell)
      if (di >= 0 && cols[di] === null) {
        cols[di] = ci
        count++
      }
    })
    if (count > bestCount) {
      bestCount = count
      headerRow = r
      headerDayCols = cols
    }
  }

  const dayColIdxs = headerDayCols.filter((c): c is number => c != null)
  const firstDayCol = dayColIdxs.length ? Math.min(...dayColIdxs) : Math.max(1, maxCols(grid) - 5)
  const dataRows = grid.slice(headerRow + 1)

  // time column = the left-of-days column with the most time-like values
  let startCol: number | null = null
  let bestTimes = 0
  for (let c = 0; c < firstDayCol; c++) {
    let tc = 0
    for (const row of dataRows) if (looksLikeTime(row[c] ?? '')) tc++
    if (tc > bestTimes) {
      bestTimes = tc
      startCol = c
    }
  }

  // period label column = first left column that isn't the time column
  let periodCol: number | null = null
  for (let c = 0; c < firstDayCol; c++) {
    if (c !== startCol) {
      periodCol = c
      break
    }
  }

  return { headerRow, dayCols: headerDayCols, periodCol, startCol, endCol: null }
}

/* ---------------------------- build timetable --------------------------- */

export function buildTimetable(grid: string[][], layout: Layout): Timetable {
  const { headerRow, dayCols, periodCol, startCol, endCol } = layout
  const periods: Period[] = []
  const cells: Record<string, ClassCell> = {}
  const dataRows = grid.slice(headerRow + 1)
  let n = 0

  for (const row of dataRows) {
    if (!row.some((c) => norm(c))) continue

    const labelRaw = periodCol != null ? norm(row[periodCol]) : ''
    let start = ''
    let end = ''
    if (startCol != null) {
      const t = parseTimes(norm(row[startCol] ?? ''))
      start = t.start
      end = t.end
    }
    if (endCol != null) {
      const te = parseTimes(norm(row[endCol] ?? ''))
      if (te.start) end = te.start
    }

    const id = newId()
    let anyClass = false
    dayCols.forEach((col, di) => {
      if (col == null) return
      const text = norm(row[col] ?? '')
      if (text) {
        cells[cellKey('A', id, di)] = splitClass(text)
        anyClass = true
      }
    })

    if (labelRaw || start || anyClass) {
      periods.push({ id, label: labelRaw || `Period ${n + 1}`, start, end })
      n++
    }
  }

  if (periods.length === 0) return defaultTimetable()
  return { periods, cells, fortnightly: false }
}

/** Quick summary used in the review UI. */
export function summarise(tt: Timetable) {
  return { periods: tt.periods.length, classes: Object.keys(tt.cells).length }
}
