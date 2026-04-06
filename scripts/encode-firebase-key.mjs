#!/usr/bin/env node
/**
 * Usage: npm run firebase:encode-key -- path/to/serviceAccount.json
 * Prints a single line to add to .env.local as FIREBASE_SERVICE_ACCOUNT_BASE64=...
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const p = process.argv[2]
if (!p) {
  console.error('Usage: npm run firebase:encode-key -- path/to/serviceAccount.json')
  process.exit(1)
}
const abs = resolve(process.cwd(), p)
const buf = readFileSync(abs)
const b64 = buf.toString('base64')
console.log('FIREBASE_SERVICE_ACCOUNT_BASE64=' + b64)
