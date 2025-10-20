"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "@/lib/auth-client"
import {
  IconHome,
  IconDashboard,
  IconFileText,
  IconCalendar,
  IconUsers,
  IconBookOpen,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconUser,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  // Define navigation based on user role
  const getNavItems = () => {
    if (!session?.user?.role) {
      // Guest user - minimal navigation
      return [
        {
          title: "Beranda",
          url: "/",
          icon: IconHome,
        },
        {
          title: "Masuk",
          url: "/sign-in",
          icon: IconUser,
        }
      ];
    }

    if (session.user.role === "admin") {
      // Admin navigation - management focus
      return [
        {
          title: "Dashboard",
          url: "/admin",
          icon: IconDashboard,
        },
        {
          title: "Guru",
          url: "/admin/teachers",
          icon: IconUsers,
        },
        {
          title: "Kelas",
          url: "/admin/classes",
          icon: IconBookOpen,
        },
        {
          title: "Tugas",
          url: "/admin/assignments",
          icon: IconFileText,
        },
        {
          title: "Statistik",
          url: "/admin/analytics",
          icon: IconChartBar,
        },
      ];
    }

    // Teacher navigation - teaching focus
    return [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
      {
        title: "Tugas",
        url: "/assignments",
        icon: IconFileText,
      },
      {
        title: "Ujian",
        url: "/exams",
        icon: IconCalendar,
      },
      {
        title: "Kelas",
        url: "/classes",
        icon: IconBookOpen,
      },
    ];
  };

  const userData = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email,
    avatar: session.user.image || "/codeguide-logo.png",
  } : {
    name: "Guest",
    email: "guest@example.com",
    avatar: "/codeguide-logo.png",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-lg font-bold">YPS</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">YPS School</span>
                  <span className="text-xs text-muted-foreground">SMP Singkole</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <div className="py-4">
          <div className="px-3 py-2">
            <div className="mb-2">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {!session?.user?.role ? 'Menu' :
                 session.user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
              </p>
            </div>
            <SidebarMenu>
              {getNavItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>

          {session?.user && (
            <div className="px-3 py-2">
              <div className="mb-2">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Akun
                </p>
              </div>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/settings" className="flex items-center gap-3">
                      <IconSettings className="h-4 w-4" />
                      <span>Pengaturan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {session.user.role === 'admin' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <IconLogout className="h-4 w-4" />
                      <span>Keluar</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </div>
          )}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t bg-sidebar-accent">
        <NavUser user={userData} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
