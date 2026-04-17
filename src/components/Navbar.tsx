"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-extrabold text-orange-400 tracking-tight">
        SplitPoint
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {session ? (
          <>
            <Link href="/create" className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md font-medium transition-colors">
              + New Debate
            </Link>
            <span className="text-gray-400">{(session.user as { name?: string }).name}</span>
            <button onClick={() => signOut()} className="text-gray-400 hover:text-white transition-colors">
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-md font-medium transition-colors">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
