import { Link, Navigate } from 'react-router-dom'
import { useUser } from '../context/UserProvider'

function renderProfileValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function UserProfilePage() {
  const { session, signOut } = useUser()

  if (!session) {
    return <Navigate to="/" replace />
  }
  if (session.isAdmin) {
    return <Navigate to="/admin/profile" replace />
  }

  const { email, profile } = session
  const rows: { label: string; value: string }[] = [{ label: 'Email', value: email }]

  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    const obj = profile as Record<string, unknown>
    for (const [key, val] of Object.entries(obj)) {
      if (key.toLowerCase() === 'email') continue
      if (key.toLowerCase() === 'isadmin') continue
      rows.push({
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
        value: renderProfileValue(val),
      })
    }
  } else if (profile !== null && profile !== undefined) {
    rows.push({ label: 'Details', value: renderProfileValue(profile) })
  }

  return (
    <main className="profile-page">
      <div className="profile-page__card card">
        <div className="profile-page__head">
          <h1 className="profile-page__title">Your profile</h1>
          <p className="profile-page__sub">Signed in for NAACH &apos;26 seat booking</p>
        </div>
        <dl className="profile-dl">
          {rows.map(({ label, value }) => (
            <div key={label} className="profile-dl__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="profile-page__actions">
          <Link to="/" className="btn btn--ghost">
            Home
          </Link>
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}
