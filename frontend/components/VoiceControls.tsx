import { useEffect, useRef, useState } from 'react'

export default function VoiceControls({ onTranscript, onSpeak }: { onTranscript: (text: string) => void; onSpeak: (text: string) => void }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (SR) {
      const recog = new SR()
      recog.lang = 'en-US'
      recog.continuous = false
      recog.interimResults = false
      recog.onresult = (e: any) => {
        const txt = e.results?.[0]?.[0]?.transcript
        if (txt) onTranscript(txt)
      }
      recog.onend = () => setListening(false)
      recognitionRef.current = recog
    }
  }, [onTranscript])

  function toggleListen() {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }

  function tts(text: string) {
    const utter = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="flex items-center gap-2">
      <button className="border rounded px-3 py-2" onClick={toggleListen}>{listening ? 'Stop' : 'Speak'}</button>
      <button className="border rounded px-3 py-2" onClick={() => onSpeak && onSpeak('')}>Mute</button>
      <button className="border rounded px-3 py-2" onClick={() => tts('Hello, how can I help?')}>Test TTS</button>
    </div>
  )
}
