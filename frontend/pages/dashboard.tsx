import useSWR from 'swr'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function Dashboard() {
  const { data } = useSWR(`${API_BASE}/analytics?limit=20`, fetcher, { refreshInterval: 5000 })

  return (
    <div className="px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Analytics Dashboard</h1>
        <h2 className="font-medium mb-2">Top Queries</h2>
        <ul className="space-y-2">
          {(data || []).map((row: any, idx: number) => (
            <li key={idx} className="border rounded p-2 flex justify-between text-sm bg-white dark:bg-gray-900 dark:border-gray-800">
              <span>{row.question}</span>
              <span className="font-mono">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
