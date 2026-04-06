import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let app: App | null = null

const DEFAULT_KEY_FILE = join(process.cwd(), 'config', 'firebase-service-account.json')

function readServiceAccountFile(resolvedPath: string) {
  try {
    const json = readFileSync(resolvedPath, 'utf8')
    return JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string }
  } catch (e) {
    throw new Error(
      `Could not read or parse JSON at ${resolvedPath}. ${e instanceof Error ? e.message : String(e)}`
    )
  }
}

function parseServiceAccount(): {
  project_id?: string
  client_email?: string
  private_key?: string
} {
  /** Best for local dev: path to the JSON file (avoids multiline / quoting issues in .env). */
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  const resolvedPath =
    filePath && !filePath.startsWith('/') ? join(process.cwd(), filePath) : filePath

  if (resolvedPath && existsSync(resolvedPath)) {
    return readServiceAccountFile(resolvedPath)
  }
  if (filePath && resolvedPath && !existsSync(resolvedPath)) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_FILE path not found: ${resolvedPath}`)
  }

  /** If env is missing or wrong but the repo-default key file exists (gitignored), use it before inline JSON — avoids 500 when FIREBASE_SERVICE_ACCOUNT_JSON is truncated in the shell. */
  if (existsSync(DEFAULT_KEY_FILE)) {
    return readServiceAccountFile(DEFAULT_KEY_FILE)
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8')
      return JSON.parse(json) as { project_id?: string; client_email?: string; private_key?: string }
    } catch (e) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64 or does not decode to JSON. ${e instanceof Error ? e.message : ''}`
      )
    }
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) {
    throw new Error(
      'Set FIREBASE_SERVICE_ACCOUNT_FILE (path to JSON file), FIREBASE_SERVICE_ACCOUNT_BASE64, or FIREBASE_SERVICE_ACCOUNT_JSON. See Firebase Console → Project settings → Service accounts.'
    )
  }

  if (raw === '{' || (raw.startsWith('{') && raw.length < 30)) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON looks truncated. In .env files you cannot put multi-line JSON after FIREBASE_SERVICE_ACCOUNT_JSON={ — only the first line is read. ' +
        'Fix: use FIREBASE_SERVICE_ACCOUNT_FILE=/absolute/path/to/your-key.json (recommended), or put the entire JSON on one line, or use FIREBASE_SERVICE_ACCOUNT_BASE64 (run: npm run firebase:encode-key -- path/to/key.json).'
    )
  }

  try {
    return JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string }
  } catch (e) {
    const hint =
      'Use valid JSON with double-quoted keys. Do not paste multi-line JSON in .env unless you use FIREBASE_SERVICE_ACCOUNT_FILE=... pointing at the downloaded file. ' +
      'Or: npm run firebase:encode-key -- path/to/key.json → paste FIREBASE_SERVICE_ACCOUNT_BASE64=...'
    throw new Error(
      `Invalid FIREBASE_SERVICE_ACCOUNT_JSON: ${e instanceof Error ? e.message : String(e)}. ${hint}`
    )
  }
}

function initApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!
  }
  const parsed = parseServiceAccount()
  return initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
    }),
  })
}

export function getFirebaseApp(): App {
  if (!app) app = initApp()
  return app
}

export function getDb() {
  return getFirestore(getFirebaseApp())
}
