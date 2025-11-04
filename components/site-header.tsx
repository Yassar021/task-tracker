"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { getCurrentUser, isAdmin, signOut as supabaseSignOut } from "@/lib/client-auth"
import { useState } from "react"
import { toast } from "sonner"
import {
  Bell,
  Search,
  User,
  LogOut,
  Sun,
  Moon,
  Home,
  BookOpen,
  Calendar,
  BarChart3,
  FileText
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSupabaseAdmin, setIsSupabaseAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<unknown>(null)

  // Check Supabase session and admin status
  React.useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const user = await getCurrentUser()
        const adminStatus = await isAdmin()
        setCurrentUser(user)
        setIsSupabaseAdmin(adminStatus)
      } catch (error) {
        console.error('Error checking Supabase auth:', error)
      }
    }

    checkSupabaseAuth()
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return // Prevent multiple clicks

    setIsLoggingOut(true)

    try {
      console.log('Attempting logout...')

      // Try Supabase logout first
      await supabaseSignOut()

      console.log('Logout successful, redirecting to homepage...')
      toast.success('Berhasil keluar dari sistem')

      // Redirect to homepage after successful logout
      window.location.href = "/"

    } catch (error) {
      console.error("Logout error:", error)
      toast.error('Terjadi kesalahan saat logout, mengalihkan ke homepage...')

      // Fallback: force redirect to homepage even if logout fails
      setTimeout(() => {
        window.location.href = "/"
      }, 1000)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getPageInfo = () => {
    if (pathname.includes('/admin')) return {
      title: "Dashboard Admin",
      description: "Kelola sistem sekolah",
      gradient: "from-red-500 to-pink-500"
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
    // Check if user is logged in (either Better Auth or Supabase)
    if (!session?.user?.id && !currentUser) {
      return [];
    }

    // Check if user is admin (either from Better Auth or Supabase)
    const isAdminUser = (session?.user as { role?: string })?.role === "admin" || isSupabaseAdmin;

    if (isAdminUser) {
      return [
        { href: "/admin", label: "Dashboard", icon: Home },
        { href: "/admin/assignments", label: "Tugas", icon: FileText },
        { href: "/admin/analytics", label: "Statistik", icon: BarChart3 },
      ];
    }

    return [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/assignments", label: "Tugas", icon: BookOpen },
      { href: "/exams", label: "Ujian", icon: Calendar },
      { href: "/classes", label: "Kelas", icon: BookOpen },
    ];
  }

  const pageInfo = getPageInfo() as { title: string; description: string; gradient: string }
  const navigationItems = getNavigationItems()

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Top Bar */}
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Modern Logo & Title */}
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${pageInfo.gradient} text-white shadow-lg`}>
            <span className="text-sm font-bold">YPS</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold tracking-tight">{pageInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{pageInfo.description}</p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <User className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">
                    {session?.user?.name || currentUser?.user_metadata?.name || session?.user?.email?.split('@')[0] || currentUser?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {session?.user?.email || currentUser?.email || 'admin@ypssingkole.sch.id'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {((session?.user?.role === "admin" || isSupabaseAdmin) ? 'Admin' : (session?.user?.role || 'User'))}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 cursor-pointer"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                    <span>Sedang keluar...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Navigation Bar */}
      {(session?.user || currentUser) && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-center gap-1 px-4 lg:px-6 h-14">
            <div className="flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                    className={`h-8 gap-2 px-4 ${isActive ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                  >
                    <a href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline font-medium">{item.label}</span>
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  )
}
