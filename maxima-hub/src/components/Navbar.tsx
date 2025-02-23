'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  onLogout?: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const username = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Session check
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        handleSessionExpired();
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:8000/api/core/api/projects/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok && res.status === 401) {
          handleSessionExpired();
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
    const intervalId = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [router]);

  const handleSessionExpired = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    
    const message = 'Your session has expired. Please log in again.';
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
    
    router.push('/login');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-white'
    }`}>
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Maxima<span className="text-transparent">Hub</span>
            </span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                     text-gray-700 hover:text-gray-900
                     bg-white hover:bg-gray-50
                     border border-gray-200 hover:border-gray-300
                     transition-all duration-200 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2">
              <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
