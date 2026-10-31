import { Link } from 'react-router-dom'

export default function Account() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl mb-6">Account</h1>
      <p className="opacity-70 mb-8">
        Sign in to manage orders, addresses, and wishlist. Guest checkout is available without an account.
      </p>
      <div className="flex gap-4">
        <button className="btn-primary">Sign In</button>
        <button className="btn-outline">Create Account</button>
      </div>
      <p className="text-sm opacity-50 mt-8">
        Supabase Auth is prepared. Configure <code className="text-xs">VITE_SUPABASE_URL</code> and anon key to enable.
      </p>
      <Link to="/" className="inline-block mt-6 text-xs tracking-widest uppercase opacity-60 hover:opacity-100">
        Back to Home
      </Link>
    </div>
  )
}