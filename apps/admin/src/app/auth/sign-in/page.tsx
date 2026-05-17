import Image from 'next/image'
import SignInForm from './components/SignInForm'

interface PageProps {
  searchParams: Promise<{ error?: string; registered?: string }>
}

const errorMessages: Record<string, string> = {
  verification_failed: 'Помилка підтвердження email. Спробуйте ще раз або зверніться до адміністратора.',
}

const successMessages: Record<string, string> = {
  registered: 'Реєстрація успішна! Перевірте вашу електронну пошту для підтвердження акаунта.',
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams
  const error = params.error ? errorMessages[params.error] : null
  const success = params.registered ? successMessages[params.registered] : null

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-4 font-sans">
      <main className="flex w-full max-w-md flex-col items-center">
        <div className="w-full rounded-xl p-4 bg-black/80 backdrop-blur-md">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative flex flex-col items-center">
                <span className="h-10 w-px bg-linear-to-b from-white/70 to-white/10" />
                <div className="admin-signin-logo-drop rounded-md bg-black/70 px-3 py-2 shadow-lg">
                  <Image
                    src="/Strikeshop_Action_logo.png"
                    alt="Logo"
                    width={119}
                    height={56}
                    className="h-auto w-29.75"
                    priority
                  />
                </div>
              </div>
            </div>
            <h1 className="text-white text-[36px] font-bold leading-tight tracking-tight mb-2">Панель адміністратора</h1>
            <p className="text-white/70 text-base font-normal leading-normal mb-8">Увійдіть, щоб керувати своїм сайтом з airsoft</p>
          </div>
          {error && (
            <div className="mb-6 p-3 text-sm text-red-500 bg-red-100/10 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="mb-6 p-3 text-sm text-green-500 bg-green-100/10 rounded-lg">{success}</div>
          )}
          <SignInForm />
        </div>
      </main>
    </div>
  )
}
