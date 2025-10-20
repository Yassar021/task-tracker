"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, School, AlertCircle, CheckCircle, Clock, Calendar } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface ClassStatus {
  grade: number;
  total: number;
  avgLoad: number;
  maxLoad: number;
  overloaded: number;
  classes?: Array<{
    id: string;
    name: string;
    load: number;
    tasks: number;
    exams: number;
    isOverloaded: boolean;
  }>;
}

// Week calculation functions
const getCurrentWeekNumber = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

const getWeekStartDate = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  const startDate = new Date(yearStart);
  startDate.setUTCDate(startDate.getUTCDate() + (weekNo - 1) * 7);
  startDate.setUTCHours(0, 0, 0, 0);

  return startDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getWeekEndDate = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  const endDate = new Date(yearStart);
  endDate.setUTCDate(endDate.getUTCDate() + (weekNo - 1) * 7 + 6);
  endDate.setUTCHours(23, 59, 59, 999);

  return endDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getTimeUntilNextReset = () => {
  const now = new Date();
  const nextMonday = new Date(now);

  // Get to next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const diff = nextMonday.getTime() - now.getTime();

  if (diff <= 0) {
    return "Reset akan segera terjadi";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} hari ${hours} jam ${minutes} menit lagi`;
  } else if (hours > 0) {
    return `${hours} jam ${minutes} menit lagi`;
  } else {
    return `${minutes} menit lagi`;
  }
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [classStatus, setClassStatus] = useState<ClassStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [accessDenied, setAccessDenied] = useState<boolean>(false);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      setTimeUntilReset(getTimeUntilNextReset());
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // If session is still loading, wait
    if (session === undefined) {
      return;
    }

    // If no session, redirect to sign-in
    if (!session) {
      window.location.href = "/sign-in";
      return;
    }

    // Check if user is admin by looking up database directly
    const checkAdminRole = async () => {
      try {
        const response = await fetch('/api/auth/check-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const result = await response.json();

        if (result.isAdmin) {
          setAccessDenied(false);
          // Fetch data only if admin
          fetchDashboardData();
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setAccessDenied(true);
      }
    };

    checkAdminRole();
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      // Only fetch class-status API which works
      const classStatusResponse = await fetch('/api/admin/class-status');
      const classStatusData = await classStatusResponse.json();

      // Set class status data
      setClassStatus(classStatusData.classStatus || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Gagal memuat data admin");
    } finally {
      setLoading(false);
    }
  };

  
  // Show access denied if user is not admin
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
            <p className="text-muted-foreground">Hanya administrator yang dapat mengakses halaman ini.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while session is being fetched or dashboard data is loading
  if (session === undefined || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div>Memuat data admin...</div>
        </div>
      </div>
    );
  }

  // Debug: Log current state before rendering
  console.log('🔍 RENDER: About to render simplified dashboard with state:');
  console.log('- classStatus length:', classStatus.length);
  console.log('- classStatus data:', classStatus);

  // Debug: Check if 7-COL is in the state that will be rendered
  if (classStatus.length > 0) {
    const grade7State = classStatus.find(g => g.grade === 7);
    if (grade7State && grade7State.classes) {
      const collabInState = grade7State.classes.find(cls => cls.id === '7-COL');
      console.log('🎯 RENDER: 7-COL found in state to be rendered:', collabInState);
    } else {
      console.log('❌ RENDER: 7-COL not found in state to be rendered');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-outfit font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              📊 Dashboard Status Kelas
            </h1>
            <p className="text-lg font-inter text-gray-600 dark:text-gray-300 leading-relaxed">
              Pantau beban tugas dan ujian untuk setiap kelas minggu ini
            </p>
          </div>

          {/* Color Legend */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-outfit font-semibold text-blue-900 dark:text-blue-100">Legenda Warna Status Kelas</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 border-2 border-green-300 flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="font-outfit font-semibold text-green-800 dark:text-green-200">Rendah (0-49%)</div>
                    <div className="text-sm font-inter text-green-600 dark:text-green-300 leading-tight">Kelas masih aman, bisa ditambahi tugas</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 border-2 border-yellow-300 flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                  <div>
                    <div className="font-outfit font-semibold text-yellow-800 dark:text-yellow-200">Sedang (50-99%)</div>
                    <div className="text-sm font-inter text-yellow-600 dark:text-yellow-300 leading-tight">Kelas hampir penuh, hati-hati menambah tugas</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 border-2 border-red-300 flex items-center justify-center text-xs font-bold">
                    !
                  </div>
                  <div>
                    <div className="font-outfit font-semibold text-red-800 dark:text-red-200">Penuh (100%)</div>
                    <div className="text-sm font-inter text-red-600 dark:text-red-300 leading-tight">Kelas sudah penuh, jangan tambahi tugas</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="text-sm font-inter font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
                  <span className="font-semibold">💡 Cara baca:</span> Setiap kelas maksimal 2 tugas + 2 ujian = 4 slot total.
                  <br/><span className="font-semibold">Contoh:</span> 2 tugas = 50% (kuning), 4 tugas = 100% (merah)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Information */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-outfit font-semibold text-amber-900 dark:text-amber-100">Informasi Mingguan</h3>
                  <p className="text-sm font-inter text-amber-700 dark:text-amber-300">
                    Sistem monitoring berdasarkan minggu akademik
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-outfit font-bold text-amber-900 dark:text-amber-100">
                  Minggu {getCurrentWeekNumber()}
                </div>
                <div className="text-sm font-inter text-amber-700 dark:text-amber-300">
                  Tahun {new Date().getFullYear()}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <div className="font-outfit font-semibold text-amber-900 dark:text-amber-100">📅 Periode Monitoring</div>
                    <div className="text-sm font-inter text-amber-700 dark:text-amber-300 leading-relaxed">
                      Minggu {getCurrentWeekNumber()} Tahun {new Date().getFullYear()}<br/>
                      <span className="text-xs">Dimulai: {getWeekStartDate()} - Berakhir: {getWeekEndDate()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <Activity className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div>
                    <div className="font-outfit font-semibold text-amber-900 dark:text-amber-100">🔄 Auto-Reset Sistem</div>
                    <div className="text-sm font-inter text-amber-700 dark:text-amber-300 leading-relaxed">
                      Sistem akan otomatis me-reset semua data saat berganti minggu<br/>
                      <span className="text-xs font-semibold">⚠️ Data akan dihapus setiap hari Senin pukul 00:00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-amber-200 dark:bg-amber-800/50 rounded-lg border border-amber-300 dark:border-amber-600">
                <p className="text-sm font-inter font-medium text-amber-800 dark:text-amber-200 text-center">
                  <span className="font-semibold">💡 Catatan:</span> Sistem mengikuti kalender akademik ISO (Senin-Minggu).
                  Data tugas dan ujian akan otomatis di-reset saat minggu baru dimulai.
                </p>
                <div className="mt-2 text-center">
                  <p className="text-xs font-inter font-semibold text-amber-700 dark:text-amber-300">
                    ⏰ {timeUntilReset}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Status Overview */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <School className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">Status Beban Kelas per Tingkatan</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {classStatus.map((gradeStatus) => {
              console.log(`🔍 RENDER: Rendering Grade ${gradeStatus.grade} card:`, {
                total: gradeStatus.total,
                avgLoad: gradeStatus.avgLoad,
                classesCount: gradeStatus.classes?.length || 0,
                hasClasses: !!gradeStatus.classes
              });

              // Get status message based on overloaded classes
              const getStatusMessage = () => {
                if (gradeStatus.overloaded > 0) {
                  return `⚠️ ${gradeStatus.overloaded} kelas penuh`;
                } else if (gradeStatus.avgLoad >= 50) {
                  return "🟡 Beberapa kelas hampir penuh";
                } else {
                  return "✅ Semua kelas aman";
                }
              };

              const getStatusColor = () => {
                if (gradeStatus.overloaded > 0) return "text-red-600 dark:text-red-400";
                if (gradeStatus.avgLoad >= 50) return "text-yellow-600 dark:text-yellow-400";
                return "text-green-600 dark:text-green-400";
              };

              return (
              <Card key={gradeStatus.grade} className={`shadow-lg border-2 ${
                gradeStatus.overloaded > 0
                  ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                  : gradeStatus.avgLoad >= 50
                  ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                  : 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        gradeStatus.overloaded > 0
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : gradeStatus.avgLoad >= 50
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <span className="text-lg font-bold">
                          {gradeStatus.overloaded > 0 ? '!' : gradeStatus.avgLoad >= 50 ? '!' : '✓'}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl font-outfit font-bold text-gray-900 dark:text-white">Kelas {gradeStatus.grade}</CardTitle>
                        <CardDescription className="text-sm font-inter text-gray-600 dark:text-gray-300">
                          {gradeStatus.total} kelas • Rata-rata beban: {gradeStatus.avgLoad}%
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={gradeStatus.overloaded > 0 ? "destructive" : "secondary"} className="text-xs">
                      {gradeStatus.overloaded} Penuh
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status Message */}
                  <div className={`text-sm font-medium ${getStatusColor()}`}>
                    {getStatusMessage()}
                  </div>

                  {/* Load Metrics */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{gradeStatus.avgLoad}%</div>
                      <div className="text-sm font-inter text-gray-600 dark:text-gray-400 font-medium">Rata-rata Beban</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">{gradeStatus.maxLoad}%</div>
                      <div className="text-sm font-inter text-gray-600 dark:text-gray-400 font-medium">Beban Tertinggi</div>
                    </div>
                  </div>

                  {/* Individual Classes */}
                  <div className="space-y-3">
                    <div className="text-sm font-outfit font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📚 Status Per Kelas (Maks 2 Tugas + 2 Ujian)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gradeStatus.classes?.map((cls, idx) => {
                        console.log(`🔍 RENDER: Rendering class ${idx + 1}: ${cls.id} - ${cls.tasks}T/${cls.exams}U = ${cls.load}% (${cls.isOverloaded ? 'RED' : cls.load >= 50 ? 'YELLOW' : 'GREEN'})`);

                        return (
                        <div
                          key={cls.id}
                          className={`group relative px-3 py-2 rounded-full text-sm font-outfit font-medium border-2 transition-all hover:scale-105 shadow-sm hover:shadow-md ${
                            cls.isOverloaded
                              ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                              : cls.load >= 50
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{cls.isOverloaded ? '⚠️' : cls.load >= 50 ? '!' : '✓'}</span>
                            <span className="font-semibold">{cls.name}</span>
                            <span className="font-bold font-mono bg-black/10 px-1 rounded">{cls.load}%</span>
                          </div>

                          {/* Enhanced Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-20 shadow-xl">
                            <div className="font-outfit font-semibold text-base mb-2">{cls.name}</div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between gap-4">
                                <span>📝 Tugas:</span>
                                <span className="font-mono font-semibold">{cls.tasks}/2</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>📝 Ujian:</span>
                                <span className="font-mono font-semibold">{cls.exams}/2</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
                                <span>📊 Total:</span>
                                <span className="font-mono font-semibold">{cls.tasks + cls.exams}/4 slot</span>
                              </div>
                              {cls.isOverloaded && (
                                <div className="text-red-300 font-semibold mt-2 text-center">⚠️ Kelas penuh!</div>
                              )}
                            </div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}