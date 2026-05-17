import { Sofia_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ApplicationProvider } from "@/contexts/ApplicationContext";

const sofiaSans = Sofia_Sans({ subsets: ['latin', 'cyrillic'], weight: ['400','500','600','700'], variable: '--font-sofia' })

export const metadata = {
  title: 'Адміністративна панель | Страйкбол',
  description: 'Керування сайтом страйкбольної спільноти',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={sofiaSans.variable}>
        <Providers>
          <ApplicationProvider>{children}</ApplicationProvider>
        </Providers>
      </body>
    </html>
  );
}
