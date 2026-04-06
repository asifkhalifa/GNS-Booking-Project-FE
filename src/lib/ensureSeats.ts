import { getDb } from '@/lib/firebase-admin'
import { buildInitialSeats } from '@/lib/seatSeed'
import { deleteCollectionDocuments, writeSeatsDocuments } from '@/lib/seatFirestore'

let seedPromise: Promise<void> | null = null

export async function ensureSeatsSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const db = getDb()
      const snap = await db.collection('seats').limit(1).get()
      if (!snap.empty) return
      await writeSeatsDocuments(db, buildInitialSeats())
    })()
  }
  await seedPromise
}

/** Replace all seat docs with the built-in chart (and clear locks). Use only via secured admin API. */
export async function replaceAllSeatsFromSeed(): Promise<{ seatCount: number }> {
  const db = getDb()
  await deleteCollectionDocuments(db, 'locks')
  await deleteCollectionDocuments(db, 'seats')
  const seats = buildInitialSeats()
  await writeSeatsDocuments(db, seats)
  return { seatCount: seats.length }
}
