"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface UserProfile {
  name: string
  email: string
  role: string
}

const navItems = [

  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Pomodoro", href: "/pomodoro", icon: "⏱️" }


]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        })

        if (!mounted) return

        if (res.ok) {
          const responseData = await res.json()
          setUser(responseData.data?.user ?? null)
        } else {
          setUser(null)
        }
      } catch {
        if (!mounted) return
        setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadUser()
    return () => {
      mounted = false
    }
  }, [pathname])

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error("Logout failed:", errorData)
        alert("Logout failed. Please try again.")
        return
      }

      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      alert("An error occurred during logout. Please try again.")
    }
  }

  return (
    <aside className={`flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">📚</span>
          {!collapsed && <span className="text-lg font-bold text-zinc-900">Workload</span>}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? "➡" : "⬅"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-1 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                active ? "bg-purple-50 text-purple-700" : "text-zinc-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-200 px-4 py-4">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>⏳</span>
            {!collapsed && <span>Checking sign-in…</span>}
          </div>
        ) : user ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-purple-50 p-3 text-sm text-purple-700">
              <div className="font-semibold">Signed in</div>
              {!collapsed && (
                <>
                  <div className="truncate">{user.name || user.email}</div>
                  <div className="text-xs text-purple-600/80">{user.email}</div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200"
            >
              {!collapsed ? "Logout" : "↩"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-sm text-zinc-700">
            <div className="rounded-2xl bg-zinc-50 p-3">
              <div className="font-semibold">Not signed in</div>
              {!collapsed && <div className="text-xs text-zinc-500">Use login to access dashboard</div>}
            </div>
            <Link
              href="/login"
              className="rounded-2xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white text-center hover:bg-purple-700"
            >
              {!collapsed ? "Sign in" : "🔐"}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
