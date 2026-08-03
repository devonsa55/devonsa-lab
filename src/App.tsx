import { useState, useEffect, type FormEvent } from 'react'
import { supabase, type Message } from './lib/supabase'
import './App.css'

export default function App() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // Honeypot field (hidden from humans)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [fetching, setFetching] = useState(true)

  // Fetch messages using server-side RPC function
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.rpc('get_safe_messages', { limit_count: 50 })

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
      }
    } catch (err) {
      console.error('Unexpected error fetching messages:', err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    // Subscribe to realtime inserts
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [payload.new as Message, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Honeypot check: if filled, silently reject bot submission
    if (website) {
      setStatus({ type: 'success', text: 'Message posted successfully!' })
      setWebsite('')
      return
    }

    if (!name.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please fill in both name and message.' })
      return
    }

    if (name.length > 100) {
      setStatus({ type: 'error', text: 'Name must be 100 characters or fewer.' })
      return
    }

    if (message.length > 500) {
      setStatus({ type: 'error', text: 'Message must be 500 characters or fewer.' })
      return
    }

    setLoading(true)
    setStatus(null)

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ name: name.trim(), message: message.trim() }])

      if (error) {
        throw error
      }

      setStatus({ type: 'success', text: 'Message posted successfully!' })
      setName('')
      setMessage('')
      fetchMessages()
    } catch (err: any) {
      console.error('Submit error:', err)
      setStatus({ type: 'error', text: err.message || 'Failed to submit message.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <div className="badge">Supabase Connected</div>
        <h1>Lab Messages</h1>
        <p className="subtitle">Submit a message to your Supabase <code>messages</code> table.</p>
      </header>

      <main className="main-content">
        <section className="card form-card">
          <h2>Send a Message</h2>
          <form onSubmit={handleSubmit} className="message-form">
            {/* Honeypot field - invisible to human users */}
            <div className="hp-field" aria-hidden="true" style={{ display: 'none' }}>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Name ({name.length}/100)</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={100}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message ({message.length}/500)</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                maxLength={500}
                disabled={loading}
                required
              />
            </div>

            {status && (
              <div className={`alert ${status.type}`}>
                {status.text}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </section>

        <section className="card list-card">
          <div className="list-header">
            <h2>Recent Messages</h2>
            <button onClick={fetchMessages} className="refresh-btn" title="Refresh messages">
              ↻ Refresh
            </button>
          </div>

          {fetching ? (
            <div className="loading-state">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">No messages yet. Be the first to leave one!</div>
          ) : (
            <div className="message-list">
              {messages.map((msg) => (
                <div key={msg.id} className="message-item">
                  <div className="message-header">
                    <span className="author">{msg.name || 'Anonymous'}</span>
                    <span className="timestamp">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="body">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
