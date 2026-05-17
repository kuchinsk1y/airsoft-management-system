import Image from 'next/image'
import { Suspense } from 'react'
import ResetPasswordForm from './components/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-4 font-sans">
      <main className="flex w-full max-w-md flex-col items-center">
        <div className="w-full rounded-xl p-4 bg-black/80 backdrop-blur-md">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/Strikeshop_Action_logo.png"
                alt="Logo"
                width={119}
                height={56}
                className="h-auto w-29.75 shadow-lg"
                priority
              />
            </div>
            <h1 className="mb-2 text-[36px] font-bold leading-tight tracking-tight text-white">
              Новий пароль
            </h1>
            <p className="mb-8 text-base font-normal leading-normal text-white/70">
              Введіть і підтвердіть новий пароль для вашого акаунта
            </p>
          </div>
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
