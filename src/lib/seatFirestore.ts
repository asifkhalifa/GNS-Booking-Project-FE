import type { Firestore } from 'firebase-admin/firestore'
import { FieldPath } from 'firebase-admin/firestore'
import type { Seat } from '@/modules/seat/types'

const BATCH = 400

/** Delete all documents in a collection (paginated). */
export async function deleteCollectionDocuments(db: Firestore, collectionId: string): Promise<void> {
  const ref = db.collection(collectionId)
  while (true) {
    const snap = await ref.orderBy(FieldPath.documentId()).limit(BATCH).get()
    if (snap.empty) return
    const batch = db.batch()
    for (const d of snap.docs) {
      batch.delete(d.ref)
    }
    await batch.commit()
  }
}

export async function writeSeatsDocuments(db: Firestore, seats: Seat[]): Promise<void> {
  for (let i = 0; i < seats.length; i += BATCH) {
    const batch = db.batch()
    for (const s of seats.slice(i, i + BATCH)) {
      batch.set(db.collection('seats').doc(s.seatNumber), { ...s })
    }
    await batch.commit()
  }
}
