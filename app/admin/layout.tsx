import { SiteHeader } from "@/components/site-header"

import "@/app/dashboard/theme.css"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="space-y-6 p-6 pt-24">
          {children}
        </div>
      </main>
    </div>
  )
}