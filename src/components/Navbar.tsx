// src/components/Navbar.tsx
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const user = localStorage.getItem('user');
            setIsAuthenticated(!!user);
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    return (
        <nav className="bg-white shadow-md px-6 py-4">
            <div className="flex justify-between items-center container mx-auto">
                <Link href="/" className="text-xl font-bold text-blue-600">
                    FSY Portal
                </Link>
                <ul className="flex space-x-4 text-sm text-gray-600">
                    <li><Link href="/">Home</Link></li>
                    {isAuthenticated && (
                        <>
                            <li><Link href="/dashboard">Dashboard</Link></li>
                            <li><Link href="/participant-notes">Participant Notes</Link></li>
                            <li><Link href="/profile">Profile</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    )
}
