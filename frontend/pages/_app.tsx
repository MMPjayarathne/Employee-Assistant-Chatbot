import type { AppProps } from 'next/app'
import '../styles/globals.css'
import Navbar from '../components/Navbar'
import { ThemeProvider } from '../components/ThemeProvider'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Navbar />
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  )
}
