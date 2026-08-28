import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { OrdensProvider } from './hooks/useOrdensServico'
import { ClientesProvider } from './hooks/useClientes'
import { EquipeProvider } from './hooks/useEquipe'
import { PrestadoresProvider } from './hooks/usePrestadores'
import { PedidosConfeitariaProvider } from './hooks/usePedidosConfeitaria'
import { EventosSalaoProvider } from './hooks/useEventosSalao'
import { SessoesFotografiaProvider } from './hooks/useSessoesFotografia'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ClientesProvider>
            <EquipeProvider>
              <PrestadoresProvider>
                <OrdensProvider>
                  <PedidosConfeitariaProvider>
                    <EventosSalaoProvider>
                      <SessoesFotografiaProvider>
                        <App />
                      </SessoesFotografiaProvider>
                    </EventosSalaoProvider>
                  </PedidosConfeitariaProvider>
                </OrdensProvider>
              </PrestadoresProvider>
            </EquipeProvider>
          </ClientesProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
