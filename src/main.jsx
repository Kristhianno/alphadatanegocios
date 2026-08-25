import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { OrdensProvider } from './hooks/useOrdensServico'
import { ClientesProvider } from './hooks/useClientes'
import { PrestadoresProvider } from './hooks/usePrestadores'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ClientesProvider>
            <PrestadoresProvider>
              <OrdensProvider>
                <App />
              </OrdensProvider>
            </PrestadoresProvider>
          </ClientesProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
