import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

type Message = { role: 'user' | 'assistant'; content: string }

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const question = input.trim()
    if (!question || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/chat`, { question })
      const answer = res.data?.answer || 'No answer'
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (e: any) {
      const err = e?.response?.data?.detail || 'Error contacting backend'
      setMessages((prev) => [...prev, { role: 'assistant', content: err }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Chat</h1>
        <div className="border rounded h-[70vh] overflow-y-auto p-3 bg-white dark:bg-gray-900 dark:border-gray-800">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">Ask about HR, EPF/ETF, tax, policies...</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-100'} rounded px-3 py-2 max-w-[80%] whitespace-pre-wrap`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="mb-3 flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 text-gray-600 dark:text-gray-300 text-sm">Assistant is typing…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 mt-3">
          <input
            className="flex-1 border rounded px-3 py-2 bg-white dark:bg-gray-900 dark:border-gray-800"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={send} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
