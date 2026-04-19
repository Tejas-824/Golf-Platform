import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'GolfGives - Play. Win. Give.',
  description: 'Golf performance tracking with monthly prize draws and charity giving.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}