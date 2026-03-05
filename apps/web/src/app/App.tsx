import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider.js'
import { I18nProvider } from './providers/I18nProvider.js'
import { ApiProvider } from './providers/ApiProvider.js'
import { router } from './router.js'
import '@/shared/i18n/i18n.js'

export function App() {
  return (
    <I18nProvider>
      <QueryProvider>
        <ApiProvider>
          <RouterProvider router={router} />
        </ApiProvider>
      </QueryProvider>
    </I18nProvider>
  )
}
