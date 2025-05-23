import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import NavigationBar from "@/components/NavigationBar";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DogFit - 강아지 맞춤형 운동 추천",
  description: "강아지 맞춤형 운동 추천 웹앱",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen bg-[#FFF6EE] pb-16 md:pb-0">{children}</main>
          <NavigationBar />
        </ThemeProvider>
      </body>
    </html>
  )
}
