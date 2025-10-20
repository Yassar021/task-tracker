import { SiteHeader } from "@/components/site-header"

import "@/app/dashboard/theme.css"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}