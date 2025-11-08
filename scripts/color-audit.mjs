import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = process.cwd()
const SRC_DIR = join(ROOT, 'src')
const ALLOWED = new Set(['gray', 'blue', 'white', 'black'])
const FILE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

/** Recursively walk a directory and yield file paths */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      yield* walk(full)
    } else if (FILE_EXTS.has(extname(full))) {
      yield full
    }
  }
}

const offenders = []
const usage = new Map() // token -> count

const textClassRegex = /(?:^|\s)text-([a-zA-Z]+)(?:-(\d{1,3}))?(?=\s|"|\'|`|\}|\)|\]|$)/g
const IGNORE_TOKENS = new Set([
  // font sizes
  'xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl',
  // text alignment and transform
  'left','center','right','justify','start','end','ellipsis','clip',
  'uppercase','lowercase','capitalize','normal',
  // overflow / wrap
  'wrap','nowrap','balance',
])

for (const file of walk(SRC_DIR)) {
  const content = readFileSync(file, 'utf8')
  let match
  let lineNum = 1
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    while ((match = textClassRegex.exec(line)) !== null) {
      const color = match[1].toLowerCase()
      if (IGNORE_TOKENS.has(color)) continue
      usage.set(color, (usage.get(color) || 0) + 1)
      if (!ALLOWED.has(color)) {
        offenders.push({ file, line: lineNum, sample: line.trim(), color })
      }
    }
    lineNum++
  }
}

console.log('Allowed colors:', Array.from(ALLOWED).join(', '))
console.log('Top color usage:')
for (const [color, count] of Array.from(usage.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${color}: ${count}`)
}

console.log('\nOffenders (non-gray/blue/white/black):')
for (const o of offenders) {
  console.log(`${o.file}:${o.line} => ${o.color} :: ${o.sample}`)
}

if (offenders.length === 0) {
  console.log('\nNo offending text colors found. ✅')
} else {
  console.log(`\nFound ${offenders.length} offending text color occurrences.`)
}
