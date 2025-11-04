"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, School, AlertCircle, Clock, Calendar, BookOpen, Plus } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { getCurrentUser, isAdmin } from "@/lib/client-auth";
import { Footer } from "@/components/layout/footer";
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
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

const getWeekStartDate = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

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
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

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
  const [user, setUser] = useState<unknown>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
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
    const checkAuthentication = async () => {
      setIsCheckingAuth(true);

      try {
        // Check Supabase session first
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          // Don't redirect manually - let middleware handle it
          setAccessDenied(true);
          setIsCheckingAuth(false);
          return;
        }

        // Check if user is admin
        const adminCheck = await isAdmin();
        if (!adminCheck) {
          setAccessDenied(true);
          setIsCheckingAuth(false);
          return;
        }

        setUser(currentUser);
        setAccessDenied(false);

        // Fetch dashboard data
        fetchDashboardData();

      } catch (error) {
        console.error('Authentication check failed:', error);
        // Don't redirect manually - let middleware handle it
        setAccessDenied(true);
        setIsCheckingAuth(false);
        return;
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, []);

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
            <p className="text-muted-foreground mb-4">
              {user ? "Hanya administrator yang dapat mengakses halaman ini." : "Silakan login terlebih dahulu."}
            </p>
            <Button onClick={() => window.location.href = "/sign-in"}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state if no data
  if (classStatus.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-outfit font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              📊 Dashboard Status Kelas
            </h1>
            <p className="text-muted-foreground">
              Monitoring beban kelas dan penugasan tugas
            </p>
          </div>

          <Card className="p-8 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Data Kelas</h3>
            <p className="text-muted-foreground mb-4">
              Database kosong. Hubungi administrator untuk menambahkan data kelas.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.href = '/setup-sample-data'}>
                <Plus className="mr-2 h-4 w-4" />
                Setup Sample Data
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/api/debug/check-data'}>
                <BookOpen className="mr-2 h-4 w-4" />
                Debug Data
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading while checking authentication or loading dashboard data
  if (isCheckingAuth || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div>{isCheckingAuth ? 'Memeriksa autentikasi...' : 'Memuat data admin...'}</div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

              <div className="mt-3 sm:mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                <p className="text-xs sm:text-sm font-inter font-medium text-blue-800 dark:text-blue-200 leading-relaxed">
                  <span className="font-semibold">💡 Cara baca:</span> Setiap kelas maksimal 2 tugas + 5 ujian = 7 slot total.
                  <br/><span className="font-semibold">Contoh:</span> 3 tugas = ~43% (kuning), 7 tugas = 100% (merah)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Information */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-outfit font-semibold text-amber-900 dark:text-amber-100">Informasi Mingguan</h3>
                  <p className="text-xs sm:text-sm font-inter text-amber-700 dark:text-amber-300">
                    Sistem monitoring berdasarkan minggu akademik
                  </p>
                </div>
              </div>
              <div className="text-right sm:text-left">
                <div className="text-2xl sm:text-3xl font-outfit font-bold text-amber-900 dark:text-amber-100">
                  Minggu {getCurrentWeekNumber()}
                </div>
                <div className="text-xs sm:text-sm font-inter text-amber-700 dark:text-amber-300">
                  Tahun {new Date().getFullYear()}
                </div>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

        {/* All Classes Overview */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <School className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white">Semua Kelas</h2>
              <p className="text-sm font-inter text-gray-600 dark:text-gray-400">
                Monitoring beban tugas dan ujian untuk setiap kelas
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {classStatus.map((gradeStatus) => {
              // Calculate statistics for this grade
              const classes = gradeStatus.classes || [];
              const totalTasks = classes.reduce((sum, cls) => sum + cls.tasks, 0);
              const totalExams = classes.reduce((sum, cls) => sum + cls.exams, 0);
              const averageLoad = classes.length > 0 ? ((totalTasks + totalExams) / (classes.length * 7)) * 100 : 0;
                const overloadedClasses = classes.filter(cls => ((cls.tasks + cls.exams) / 7) * 100 >= 100).length;

              // Find highest load class
              const classLoads = classes.map(cls => ({
                ...cls,
                loadPercentage: ((cls.tasks + cls.exams) / 7) * 100
              }));
              const highestLoadClass = classLoads.reduce((max, cls) =>
                cls.loadPercentage > max.loadPercentage ? cls : max,
                classLoads[0] || { loadPercentage: 0, id: '-', name: '-', tasks: 0, exams: 0 }
              );

              // Determine overall status
              const getOverallStatus = () => {
                if (overloadedClasses > 0) return { text: 'Perlu perhatian', color: 'red', icon: '!' };
                if (averageLoad >= 75) return { text: 'Beban tinggi', color: 'orange', icon: '!' };
                if (averageLoad >= 50) return { text: 'Beban sedang', color: 'yellow', icon: '!' };
                return { text: 'Semua kelas aman', color: 'green', icon: '✓' };
              };

              const overallStatus = getOverallStatus();
              const maxLoad = Math.round(highestLoadClass.loadPercentage);

              return (
                <Card key={gradeStatus.grade} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Header Section */}
                  <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-md ${
                          overallStatus.color === 'green' ? 'bg-green-500' :
                          overallStatus.color === 'yellow' ? 'bg-yellow-500' :
                          overallStatus.color === 'orange' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {overallStatus.icon}
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                            Kelas {gradeStatus.grade}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {classes.length} kelas • Rata-rata beban: {Math.round(averageLoad)}%
                          </p>
                        </div>
                      </div>
                      {/* Badge */}
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full self-start sm:self-auto">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {overloadedClasses} Penuh
                        </span>
                      </div>
                    </div>

                    {/* Overall Status Bar */}
                    <div className={`w-full rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 flex items-center gap-2 ${
                      overallStatus.color === 'green' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                      overallStatus.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                      overallStatus.color === 'orange' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      <span className="text-base sm:text-lg font-bold">{overallStatus.icon}</span>
                      <span className="text-xs sm:text-sm font-medium">{overallStatus.text}</span>
                    </div>
                  </div>

                  {/* Key Metrics Section */}
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                      {/* Average Load Metric */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                              Rata-rata Beban
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {Math.round(averageLoad)}
                              </span>
                              <span className="text-sm sm:text-lg text-gray-500 dark:text-gray-400">%</span>
                            </div>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ml-2 sm:ml-3">
                            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Highest Load Metric */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-3 sm:p-4 border border-orange-200 dark:border-orange-700 shadow-sm">
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">
                              Beban Tertinggi
                            </p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                                {maxLoad}
                              </span>
                              <span className="text-sm sm:text-lg text-orange-500 dark:text-orange-500">%</span>
                            </div>
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                              {highestLoadClass.id}
                            </p>
                          </div>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg ml-2 sm:ml-3">
                            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Per Kelas Section */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                          Status Per Kelas
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (Maks 2 Tugas + 5 Ujian)
                        </span>
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        {classes.map((cls) => {
                          const totalSlots = cls.tasks + cls.exams;
                          const loadPercentage = ((cls.tasks + cls.exams) / 7) * 100;

                          const getStatusConfig = () => {
                            if (totalSlots === 0) return { color: 'green', icon: '✓', textColor: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-200 dark:border-green-800' };
                            if (totalSlots <= 2) return { color: 'blue', icon: '✓', textColor: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800' };
                            if (totalSlots <= 4) return { color: 'yellow', icon: '!', textColor: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-200 dark:border-yellow-800' };
                            if (totalSlots <= 6) return { color: 'orange', icon: '!', textColor: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800' };
                            return { color: 'red', icon: '!', textColor: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' };
                          };

                          const statusConfig = getStatusConfig();

                          return (
                            <div
                              key={cls.id}
                              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.textColor} transition-all duration-200 hover:shadow-sm cursor-pointer`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                                  statusConfig.color === 'green' ? 'bg-green-500' :
                                  statusConfig.color === 'blue' ? 'bg-blue-500' :
                                  statusConfig.color === 'yellow' ? 'bg-yellow-500' :
                                  statusConfig.color === 'orange' ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}>
                                  {statusConfig.icon}
                                </div>
                                <div>
                                  <div className="font-bold text-xs sm:text-sm">{cls.id}</div>
                                  <div className="text-xs opacity-75 hidden sm:block">{cls.name}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-sm sm:text-lg">{Math.round(loadPercentage)}%</div>
                                <div className="text-xs opacity-75">
                                  {cls.tasks}T • {cls.exams}U
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}