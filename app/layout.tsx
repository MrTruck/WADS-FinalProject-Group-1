import './globals.css'
import Sidebar from './components/Sidebar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 bg-zinc-50">{children}</main>
        </div>
      </body>
    </html>
  )
}