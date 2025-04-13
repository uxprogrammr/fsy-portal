// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            // Redirect after successful login
            window.location.href = '/dashboard';
        } else {
            setError(data.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-white p-8">
            <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <Image src="/logo.png" alt="FSY Logo" width={100} height={100} />
                    <h1 className="text-3xl font-bold text-blue-800 mt-4">fsy portal</h1>
                    <p className="text-blue-800 text-sm">2025</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email or Phone Number"
                            className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter your username</p>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter your password</p>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="flex items-center">
                        <input
                            id="rememberMe"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                            Remember Me
                        </label>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-800 text-white py-2 rounded-lg hover:bg-blue-900 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
