import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import dynamic from 'next/dynamic'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

const VoiceControls = dynamic(() => import('../components/VoiceControls'), { ssr: false })

type Message = { role: 'user' | 'assistant'; content: string; citations?: { index: number; source_name?: string; raw_url?: string }[] }

type ChatResponse = { answer: string; sources: { index: number; snippet: string; source_name?: string; raw_url?: string }[] }

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
      const { data } = await axios.post<ChatResponse>(`${API_BASE}/chat`, { question })
      const citations = (data.sources || []).map(s => ({ index: s.index, source_name: s.source_name, raw_url: s.raw_url }))
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, citations }])
    } catch (e: any) {
      const err = e?.response?.data?.detail || 'Error contacting backend'
      setMessages((prev) => [...prev, { role: 'assistant', content: err }])
    } finally {
      setLoading(false)
    }
  }

  function onTranscript(text: string) { setInput(text) }
  function onSpeak(_text: string) {}

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
                {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                  <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="font-medium mb-1">Sources</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {m.citations.map((c, idx) => (
                        <li key={idx}>
                          <span className="mr-2">[{c.index}]</span>
                          {c.source_name ? (
                            <a className="text-blue-600 hover:underline" href={`${API_BASE}${c.raw_url}`} target="_blank" rel="noreferrer">{c.source_name}.pdf</a>
                          ) : (
                            <span className="text-gray-500">Unknown source</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
        <div className="flex gap-2 mt-3 items-center">
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
          <VoiceControls onTranscript={onTranscript} onSpeak={onSpeak} />
        </div>
      </div>
    </div>
  )
}
