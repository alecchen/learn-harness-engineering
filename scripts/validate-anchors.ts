// Checks that docs/.vitepress/anchor-map.json is in sync with the English source.
//
// Heading ids are canonical English slugs applied to every locale, so the map
// must be regenerated whenever English headings change. Drift between a locale's
// heading count and English is expected for some pages (their structure differs)
// and is reported as informational: those pages keep their localized ids rather
// than getting ids that point at the wrong section.
//
// Run from the repo root: node --import tsx scripts/validate-anchors.ts

import { promises as fs } from 'node:fs'
import { readFileSync } from 'node:fs'
import { createMarkdownRenderer } from 'vitepress'
import { collectHeadingIds, localeStrippedPath } from './anchor-map-utils.ts'
import { docsRoot } from './export-site-utils.ts'

const anchorMapPath = `${docsRoot}/.vitepress/anchor-map.json`
const SOURCE_LOCALE = 'en'

type Finding = {
  docPath: string
  message: string
}

async function walkMarkdown(targetDir: string): Promise<string[]> {
  const entries = await fs.readdir(targetDir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = `${targetDir}/${entry.name}`
      if (entry.isDirectory()) return walkMarkdown(full)
      return entry.isFile() && entry.name.endsWith('.md') ? [full] : []
    }),
  )
  return nested.flat()
}

async function main() {
  const md = await createMarkdownRenderer(docsRoot, {}, '/')
  const anchorMap = JSON.parse(readFileSync(anchorMapPath, 'utf8')) as Record<
    string,
    { ids: string[]; locales: Record<string, number> }
  >

  const findings: Finding[] = []
  const drifted: Finding[] = []

  const sourceFiles = (await walkMarkdown(`${docsRoot}/${SOURCE_LOCALE}`)).sort()

  for (const file of sourceFiles) {
    const key = localeStrippedPath(file.slice(docsRoot.length + 1).split('\\').join('/'))
    const ids = collectHeadingIds(md, await fs.readFile(file, 'utf8'))
    if (ids.length === 0) continue

    const entry = anchorMap[key]
    if (!entry) {
      findings.push({ docPath: key, message: `missing from anchor-map.json (${ids.length} headings)` })
      continue
    }

    if (JSON.stringify(entry.ids) !== JSON.stringify(ids)) {
      findings.push({ docPath: key, message: 'canonical ids are stale; run scripts/build-anchor-map.ts' })
    }
  }

  for (const [key, entry] of Object.entries(anchorMap)) {
    for (const [locale, count] of Object.entries(entry.locales)) {
      if (count !== entry.ids.length) {
        drifted.push({
          docPath: key,
          message: `${locale} has ${count} headings, English has ${entry.ids.length}; keeps localized ids`,
        })
      }
    }
  }

  if (findings.length > 0) {
    console.error(`Anchor map is out of date (${findings.length}):`)
    for (const finding of findings) console.error(`- ${finding.docPath}: ${finding.message}`)
    process.exitCode = 1
    return
  }

  console.log(`OK: anchor map matches the English source (${Object.keys(anchorMap).length} pages).`)
  if (drifted.length > 0) {
    const pages = new Set(drifted.map((d) => d.docPath)).size
    console.log(`Note: ${pages} page(s) have locale structure drift; those locales keep localized ids.`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
