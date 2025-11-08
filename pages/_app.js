import '../src/index.css'
import { AuthProvider } from '../src/components/auth'
import { SessionGuard } from '../src/components/auth/SessionGuard'
import { ThemeProvider } from '../src/contexts/ThemeContext'

export default function App({ Component, pageProps }) {
  return (
    <SessionGuard>
      <ThemeProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </ThemeProvider>
    </SessionGuard>
  )
}