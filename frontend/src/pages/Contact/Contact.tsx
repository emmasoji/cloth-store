export default function Contact() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-display text-4xl mb-6">Contact</h1>
      <p className="opacity-70 mb-8">We respond within 24 hours.</p>
      <form className="space-y-4 max-w-md" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Name"
          className="w-full px-3 py-2.5 text-sm border bg-transparent outline-none"
          style={{ borderColor: 'var(--border)' }}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2.5 text-sm border bg-transparent outline-none"
          style={{ borderColor: 'var(--border)' }}
        />
        <textarea
          placeholder="Message"
          rows={5}
          className="w-full px-3 py-2.5 text-sm border bg-transparent outline-none resize-none"
          style={{ borderColor: 'var(--border)' }}
        />
        <button type="submit" className="btn-primary">
          Send Message
        </button>
      </form>
    </div>
  )
}