"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          Eco<span className="text-blue-600 dark:text-pink-500">mmerce</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="#features"
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-pink-500 transition"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-pink-500 transition"
          >
            Pricing
          </Link>
          <Link
            href="#contact"
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-pink-500 transition"
          >
            Contact
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-sm transition-all"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-700 dark:text-gray-200 focus:outline-none"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 space-y-2 text-sm font-medium text-center">
          <Link
            href="#features"
            className="block text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-pink-500"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="block text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-pink-500"
          >
            Pricing
          </Link>
          <Link
            href="#contact"
            className="block text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-pink-500"
          >
            Contact
          </Link>
          <Link
            href="/login"
            className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-sm"
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
}
