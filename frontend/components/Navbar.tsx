import Link from 'next/link'
import { useTheme } from './ThemeProvider'

export default function Navbar() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <nav className="w-full border-b bg-white/70 backdrop-blur dark:bg-gray-900/70 dark:border-gray-800">
      <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-semibold">Employee Assistant</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/">Chat</Link>
          <Link href="/upload">Upload</Link>
          <Link href="/dashboard">Dashboard</Link>
          <button
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggle}
            title={isDark ? 'Switch to light' : 'Switch to dark'}
          >
            {isDark ? (
              // Sun icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1Zm0-20a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm10 9a1 1 0 0 1 0 2h-1a1 1 0 1 1 0-2h1ZM3 12a1 1 0 1 1 0 2H2a1 1 0 1 1 0-2h1Zm15.657-7.071a1 1 0 0 1 1.414 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707ZM5.636 18.364a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707Zm13.435 1.414a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 0 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414ZM6.343 5.636A1 1 0 0 1 4.93 4.222l.707-.707A1 1 0 0 1 7.05 4.93l-.707.707Z" />
              </svg>
            ) : (
              // Moon icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M21.752 15.002A9.718 9.718 0 0 1 12 21.75c-5.385 0-9.75-4.365-9.75-9.75 0-4.122 2.574-7.64 6.195-9.03a.75.75 0 0 1 .926.994A7.5 7.5 0 0 0 19.5 15.63a.75.75 0 0 1 1.004.923 9.7 9.7 0 0 1-.752 1.949Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}
