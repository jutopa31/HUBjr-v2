import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import NeurologyResidencyHub from './neurology_residency_hub.tsx'
import { AuthProvider } from './components/auth/AuthProvider'
import { SessionGuard } from './components/auth/SessionGuard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionGuard>
      <AuthProvider>
        <NeurologyResidencyHub />
      </AuthProvider>
    </SessionGuard>
  </StrictMode>
)