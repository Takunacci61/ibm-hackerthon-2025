'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ProjectDetails() {
  const router = useRouter();

  // Redirect unauthenticated users to the login page.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Logout functionality to clear tokens and redirect to login.
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reusable Navbar with logout functionality */}
      <Navbar onLogout={handleLogout} />

      {/* Main content area for project details */}
      <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Project Details</h1>
        <p className="text-lg text-gray-700 mb-4">
          Welcome to the Maxima Hub project details page. This application is built using Next.js 13 with the new App Router, TypeScript, and Tailwind CSS, delivering a modern and secure user experience.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          The project integrates robust client-side authentication with a backend API, ensuring that only authenticated users can access sensitive pages such as the dashboard and this details page.
        </p>
        <p className="text-lg text-gray-700 mb-4">
          Key technologies and features include:
        </p>
        <ul className="list-disc list-inside text-lg text-gray-700 mb-4">
          <li>Next.js 13 with App Router for improved routing and performance</li>
          <li>Tailwind CSS for utility-first, responsive styling</li>
          <li>TypeScript for enhanced type safety and maintainability</li>
          <li>Client-side authentication with secure token handling</li>
          <li>Reusable components, such as a custom Navbar with logout functionality</li>
        </ul>
        <p className="text-lg text-gray-700 mb-4">
          This project is designed to be scalable, maintainable, and user-friendly, providing a seamless experience across devices.
        </p>
        <p className="text-lg text-gray-700">
          Thank you for exploring the details of the Maxima Hub project.
        </p>
      </div>
    </div>
  );
}
