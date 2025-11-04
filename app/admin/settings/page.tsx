import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Lock, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <Badge variant="secondary" className="gap-2">
          <Lock className="h-4 w-4" />
          Dinonaktifkan
        </Badge>
      </div>

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-2xl text-gray-600 dark:text-gray-400">
            Fitur Dinonaktifkan
          </CardTitle>
          <CardDescription className="text-lg">
            Pengaturan sistem sedang dalam tahap pengembangan
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Fitur pengaturan sistem akan segera tersedia di versi mendatang.
              Saat ini, konfigurasi sistem menggunakan nilai default.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Perkiraan tersedia: Q2 2025</span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-2">Fitur yang akan datang:</p>
              <ul className="text-left space-y-1 max-w-md mx-auto">
                <li>• Konfigurasi batas tugas per minggu</li>
                <li>• Template pesan WhatsApp</li>
                <li>• Pengaturan tahun ajaran</li>
                <li>• Backup & restore data</li>
                <li>• Integrasi dengan sistem lain</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}