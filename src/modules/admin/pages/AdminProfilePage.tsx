import { Link } from 'react-router-dom'
import { Redirect } from '@/components/Redirect'
import { useUser } from '../../user'

export function AdminProfilePage() {
  const { session, signOut } = useUser()

  if (!session) {
    return <Redirect to="/" />
  }
  if (!session.isAdmin) {
    return <Redirect to="/profile" />
  }

  const { email } = session

  return (
    <main className="profile-page">
      <div className="profile-page__card card">
        <div className="profile-page__head">
          <h1 className="profile-page__title">Admin</h1>
        </div>
        <dl className="profile-dl">
          <div className="profile-dl__row">
            <dt>Admin email</dt>
            <dd>{email}</dd>
          </div>
          <div className="profile-dl__row">
            <dt>Role</dt>
            <dd>Administrator</dd>
          </div>
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
