// src/components/Navbar.tsx
import Link from 'next/link'

export default function Navbar() {
    return (
        <nav className="bg-white shadow-md px-6 py-4">
            <div className="flex justify-between items-center container mx-auto">
                <Link href="/" className="text-xl font-bold text-blue-600">
                    FSY Portal
                </Link>
                <ul className="flex space-x-4 text-sm text-gray-600">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/about">About</Link></li>
                </ul>
            </div>
        </nav>
    )
}
