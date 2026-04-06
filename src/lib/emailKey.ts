/** Safe Firestore document id for an email address. */
export function emailDocKey(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase())
}
