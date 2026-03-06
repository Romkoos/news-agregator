import { RegisterForm } from '@/features/auth/index.js'

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  )
}
