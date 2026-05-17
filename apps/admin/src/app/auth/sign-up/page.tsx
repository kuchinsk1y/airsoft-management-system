import Image from 'next/image'
import Link from 'next/link'
import SignUpForm from './components/SignUpForm'

export default function SignUpPage() {
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
            <h1 className="text-white text-[36px] font-bold leading-tight tracking-tight mb-2">
              Реєстрація
            </h1>
            <p className="text-white/70 text-base font-normal leading-normal">
              Створіть обліковий запис для доступу до панелі адміністратора
            </p>
          </div>
          
          <SignUpForm />

          <div className="mt-2 text-center">
            <p className="text-white/70 text-sm">
              Вже маєте обліковий запис?{' '}
              <Link href="/auth/sign-in" className="text-orange-500 hover:text-orange-400 font-medium">
                Увійти
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
