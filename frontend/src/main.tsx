import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store.ts'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import './index.css'
import t1Favicon from './assets/images/T1_favicon.svg'

function applyFavicon(href: string): void {
    const relValues = ['icon', 'shortcut icon']
    relValues.forEach((rel) => {
        let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
        if (!link) {
            link = document.createElement('link')
            link.rel = rel
            document.head.appendChild(link)
        }
        link.type = 'image/svg+xml'
        link.href = href
    })
}

applyFavicon(t1Favicon)

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <Provider store={store}>
                <App />
            </Provider>
        </QueryClientProvider>
    </StrictMode>,
)