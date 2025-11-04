"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "@/lib/auth-client"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { getCurrentUser, isAdmin, signOut as supabaseSignOut } from "@/lib/client-auth"
import {
  Home,
  FileText,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  Menu,
  X
} from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Try to logout from Better Auth first
      try {
        await signOut()
      } catch (betterAuthError) {
        console.warn("Better Auth logout failed:", betterAuthError)
      }

      // Always try to logout from Supabase as fallback
      try {
        await supabaseSignOut()
      } catch (supabaseError) {
        console.warn("Supabase logout failed:", supabaseError)
      }

      // Clear any remaining session data
      try {
        // Clear Better Auth session storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('better-auth.session_token')
          sessionStorage.removeItem('better-auth.session_token')
        }
      } catch (clearError) {
        console.warn("Failed to clear session storage:", clearError)
      }

      toast.success("Berhasil keluar", {
        description: "Anda telah keluar dari sistem",
      })

      // Redirect to home page
      window.location.href = "/"

    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Gagal keluar", {
        description: "Terjadi kesalahan saat keluar",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Get page info based on current path
  const getPageInfo = () => {
    if (pathname.includes('/admin')) return {
      title: "Admin Panel",
      description: "Kelola sistem akademik",
      gradient: "from-blue-600 to-purple-600"
    }
    if (pathname.includes('/dashboard')) return {
      title: "Dashboard Guru",
      description: "Monitor tugas dan ujian",
      gradient: "from-blue-500 to-cyan-500"
    }
    if (pathname.includes('/admin/assignments')) return {
      title: "Daftar Tugas",
      description: "Kelola semua tugas dan ujian",
      gradient: "from-green-500 to-emerald-500"
    }
    if (pathname.includes('/assignments')) return {
      title: "Tugas & Ujian",
      description: "Kelola tugas pembelajaran",
      gradient: "from-green-500 to-emerald-500"
    }
    if (pathname.includes('/exams')) return {
      title: "Ujian",
      description: "Jadwal dan hasil ujian",
      gradient: "from-orange-500 to-red-500"
    }
    if (pathname.includes('/settings')) return {
      title: "Pengaturan",
      description: "Konfigurasi akun dan sistem",
      gradient: "from-purple-500 to-indigo-500"
    }
    return {
      title: "Dashboard",
      description: "SMP YPS Singkole",
      gradient: "from-slate-500 to-gray-500"
    }
  }

  const getNavigationItems = () => {
    // Always show admin navigation for admin pages
    if (pathname.includes('/admin')) {
      return [
        { href: "/admin", label: "Dashboard", icon: Home },
        { href: "/admin/assignments", label: "Tugas", icon: FileText },
        { href: "/admin/analytics", label: "Statistik", icon: BarChart3 },
        // { href: "/admin/classes", label: "Kelas", icon: BookOpen },
        // { href: "/admin/settings", label: "Pengaturan", icon: Settings },
      ];
    }

    // Check if user is logged in (either Better Auth or Supabase)
    if (!session?.user?.id) {
      return [];
    }

    // Check if user is admin (either from Better Auth or Supabase)
    const isSupabaseAdmin = session?.user?.email === "admin@ypssingkole.sch.id"
    const isAdminUser = (session?.user as { role?: string })?.role === "admin" || isSupabaseAdmin

    if (isAdminUser) {
      return [
        { href: "/admin", label: "Dashboard", icon: Home },
        { href: "/admin/assignments", label: "Tugas", icon: FileText },
        { href: "/admin/analytics", label: "Statistik", icon: BarChart3 },
        // { href: "/admin/classes", label: "Kelas", icon: BookOpen },
        // { href: "/admin/settings", label: "Pengaturan", icon: Settings },
      ];
    }

    // Teacher navigation
    if (pathname.includes('/dashboard')) return [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/dashboard/assignments", label: "Tugas", icon: FileText },
      { href: "/dashboard/exams", label: "Ujian", icon: BarChart3 },
      { href: "/dashboard/classes", label: "Kelas", icon: BookOpen },
      { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
    ]

    // Student navigation
    return [
      { href: "/", label: "Beranda", icon: Home },
      { href: "/assignments", label: "Tugas", icon: FileText },
      { href: "/exams", label: "Ujian", icon: BarChart3 },
      { href: "/classes", label: "Kelas", icon: BookOpen },
    ]
  }

  const pageInfo = getPageInfo() as { title: string; description: string; gradient: string }
  const navigationItems = getNavigationItems()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Left Side - Logo & Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${pageInfo.gradient} text-white shadow-lg`}>
            <span className="text-sm font-bold">YPS</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight">{pageInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{pageInfo.description}</p>
          </div>
        </div>

        {/* Center - Desktop Navigation */}
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              // Check if this is a disabled feature
              const isDisabled = item.href === "/admin/classes" || item.href === "/admin/settings"

              return (
                <div key={item.href} className="relative group">
                  {isDisabled ? (
                    <div
                      className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-not-allowed opacity-50 ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground ${
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )}

                  {/* Tooltip for disabled items */}
                  {isDisabled && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Fitur dinonaktifkan
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {session?.user?.name && (
                    <p className="font-medium">{session.user.name}</p>
                  )}
                  {session?.user?.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Keluar...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="px-2 py-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const isDisabled = item.href === "/admin/classes" || item.href === "/admin/settings"

              return isDisabled ? (
                <div
                  key={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all opacity-50 cursor-not-allowed ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    {item.label}
                  </div>
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    Dinonaktifkan
                  </span>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}