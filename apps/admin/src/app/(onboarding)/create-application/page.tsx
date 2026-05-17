import Image from 'next/image'
import Link from 'next/link'
import CreateApplicationForm from './components/CreateApplicationForm'

export const metadata = {
  title: 'Створити організацію | Адміністративна панель',
  description: 'Створення нової організації',
}

export default function CreateApplicationPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-4 font-sans">
      <main className="flex w-full max-w-md flex-col items-center">
        <div className="w-full rounded-xl p-4 bg-black/80 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={119}
                height={56}
                className="shadow-lg"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </div>
            <h1 className="text-white text-[36px] font-bold leading-tight tracking-tight mb-2">
              Нова організація
            </h1>
            <p className="text-white/70 text-base font-normal leading-normal">
              Заповніть форму, щоб створити організацію та почати керувати подіями
            </p>
          </div>
          
          <CreateApplicationForm />

          <div className="mt-2 text-center">
            <p className="text-white/70 text-sm">
              <Link href="/auth/sign-out" className="text-orange-500 hover:text-orange-400 font-medium">
                Вийти
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
