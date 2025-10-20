import '../src/index.css'
import { AuthProvider } from '../src/components/auth'
import { SessionGuard } from '../src/components/auth/SessionGuard'

export default function App({ Component, pageProps }) {
  return (
    <SessionGuard>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SessionGuard>
  )
}