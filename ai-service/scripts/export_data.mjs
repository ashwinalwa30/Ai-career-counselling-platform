/**
 * Copy frontend career and question modules into JSON for the AI service.
 * Read-only on frontend/src/data. correctAnswer is kept; it never goes to the browser.
 *
 * Run from anywhere: node ai-service/scripts/export_data.mjs
 * The frontend package lives two levels up from this file, not one.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import CAREERS from '../../frontend/src/data/careers.js'
import QUESTIONS from '../../frontend/src/data/questions.js'

const serviceRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const dataDir = join(serviceRoot, 'data')
mkdirSync(dataDir, { recursive: true })

writeFileSync(join(dataDir, 'careers.json'), `${JSON.stringify(CAREERS, null, 2)}\n`)
writeFileSync(join(dataDir, 'questions.json'), `${JSON.stringify(QUESTIONS, null, 2)}\n`)

console.log(`Wrote ${CAREERS.length} careers and ${QUESTIONS.length} questions to ${dataDir}`)
