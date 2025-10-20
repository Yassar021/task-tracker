"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  BarChart3,
  Settings,
  ListChecks,
  TrendingUp,
  Activity,
  Eye,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  formatDate,
  getAssignmentStatusLabel,
  getAssignmentStatusColor,
  getCurrentWeekInfo,
} from "@/lib/school-utils";

// Define types locally to avoid importing schema with database connections
interface Class {
  id: string;
  grade: number;
  name: string;
  isActive: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  subject: string;
  learningGoal: string;
  type: "TUGAS" | "UJIAN";
  weekNumber: number;
  year: number;
  status: "draft" | "published" | "graded" | "closed";
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  teacherId: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  classAssignments?: Array<{
    id: string;
    classId: string;
    assignmentId: string;
    dueDate?: Date;
    class?: Class;
  }>;
}

interface ClassStatus {
  class: Class;
  taskSlots: {
    used: number;
    max: number;
  };
  examSlots: {
    used: number;
    max: number;
  };
}

interface SystemSettings {
  maxWeeklyTasks: number;
  maxWeeklyExams: number;
}

export default function Page() {
  const { data: session } = useSession();
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maxWeeklyTasks: 2,
    maxWeeklyExams: 2,
  });
  const [currentWeekInfo, setCurrentWeekInfo] = useState<{ weekNumber: number; year: number } | null>(null);
  const [classStatuses, setClassStatuses] = useState<ClassStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      window.location.href = "/admin";
      return;
    }

    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      const [classesResponse, assignmentsResponse, settingsResponse, weekInfoResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/dashboard/assignments'),
        fetch('/api/settings'),
        fetch('/api/utils/week-info'),
      ]);

      if (!classesResponse.ok || !assignmentsResponse.ok || !settingsResponse.ok || !weekInfoResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [classesData, assignmentsData, settingsData, weekInfoData] = await Promise.all([
        classesResponse.json(),
        assignmentsResponse.json(),
        settingsResponse.json(),
        weekInfoResponse.json(),
      ]);

      setClasses(classesData.classes);
      setAssignments(assignmentsData.assignments);
      setSystemSettings(settingsData.settings);
      setCurrentWeekInfo(weekInfoData.weekInfo);

      // Calculate class statuses
      const statuses = calculateClassStatuses(classesData.classes, assignmentsData.assignments, settingsData.settings, weekInfoData.weekInfo);
      setClassStatuses(statuses);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  
  const calculateClassStatuses = (classes: Class[], assignments: Assignment[], settings: SystemSettings, weekInfo: { weekNumber: number; year: number }): ClassStatus[] => {
    return classes.map(classItem => {
      const weekAssignments = assignments.filter(assignment =>
        assignment.weekNumber === weekInfo.weekNumber &&
        assignment.year === weekInfo.year &&
        assignment.classAssignments?.some(ca => ca.classId === classItem.id)
      );

      const tasks = weekAssignments.filter(a => a.type === 'TUGAS');
      const exams = weekAssignments.filter(a => a.type === 'UJIAN');

      return {
        class: classItem,
        taskSlots: {
          used: tasks.length,
          max: settings.maxWeeklyTasks
        },
        examSlots: {
          used: exams.length,
          max: settings.maxWeeklyExams
        }
      };
    });
  };

  const getSlotColor = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage >= 100) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage >= 75) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getSlotIcon = (used: number, max: number) => {
    if (used >= max) return <AlertTriangle className="h-4 w-4" />;
    if (used >= max * 0.75) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Memuat dashboard...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 -mt-4 mr-4 h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm"></div>
          <div className="absolute bottom-0 left-0 -mb-4 ml-8 h-24 w-24 rounded-full bg-white/10 backdrop-blur-sm"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, {session?.user?.name || 'Guru'}!</h1>
                <p className="text-blue-100 text-lg">Mari pantau tugas dan ujian kelas Anda</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-100 text-sm">Minggu Ini</p>
                <p className="text-2xl font-bold">{currentWeekInfo?.weekNumber || '-'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-100 text-sm">Total Tugas</p>
                <p className="text-2xl font-bold">{assignments.filter(a => a.teacherId === session?.user?.id).length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-100 text-sm">Aktif</p>
                <p className="text-2xl font-bold">{assignments.filter(a => a.teacherId === session?.user?.id && a.status === 'published').length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-blue-100 text-sm">Compliance</p>
                <p className="text-2xl font-bold">0%</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Rules Banner */}
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Aturan Sistem Minggu Ini</CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-300">
                  Minggu {currentWeekInfo?.weekNumber} Tahun {currentWeekInfo?.year}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Maksimal Tugas per Kelas</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{systemSettings.maxWeeklyTasks}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">tugas per minggu</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-300">Maksimal Ujian per Kelas</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-300">{systemSettings.maxWeeklyExams}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">ujian per minggu</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Status Overview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Status Beban Kelas Minggu Ini</h3>
            </div>
            <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700">
              <Eye className="h-4 w-4 mr-2" />
              Lihat Semua
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classStatuses.map((status) => {
              const totalUsed = status.taskSlots.used + status.examSlots.used;
              const totalMax = status.taskSlots.max + status.examSlots.max;
              const percentage = (totalUsed / totalMax) * 100;

              return (
                <Card
                  key={status.class.id}
                  className={`shadow-sm border-0 bg-white dark:bg-gray-800 transition-all hover:shadow-md ${
                    percentage >= 100 ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10' :
                    percentage >= 75 ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-900/10' :
                    'border-green-200 bg-green-50/50 dark:bg-green-900/10'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{status.class.id}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">{status.class.name}</CardDescription>
                      </div>
                      <div className={`p-2 rounded-lg ${
                        percentage >= 100 ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                        percentage >= 75 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                        'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      }`}>
                        {getSlotIcon(totalUsed, totalMax)}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage >= 100 ? 'bg-red-500' :
                          percentage >= 75 ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tugas</span>
                      <Badge variant="outline" className={`${
                        status.taskSlots.used >= status.taskSlots.max ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                        status.taskSlots.used >= status.taskSlots.max * 0.75 ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                        'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                      }`}>
                        {status.taskSlots.used}/{status.taskSlots.max}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ujian</span>
                      <Badge variant="outline" className={`${
                        status.examSlots.used >= status.examSlots.max ? 'border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                        status.examSlots.used >= status.examSlots.max * 0.75 ? 'border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                        'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                      }`}>
                        {status.examSlots.used}/{status.examSlots.max}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Recent Assignments */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Tugas & Ujian Terbaru
                  </CardTitle>
                  <CardDescription className="mt-1 text-gray-600 dark:text-gray-400">
                    Monitor tugas dan ujian yang telah dibuat
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {assignments.filter(a => a.teacherId === session?.user?.id).length === 0 ? (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                      <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
                        <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Belum ada tugas</h3>
                      <p className="text-sm max-w-md mx-auto text-gray-600 dark:text-gray-400">
                        Tugas dan ujian akan muncul di sini setelah dibuat oleh admin
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments
                        .filter(a => a.teacherId === session?.user?.id)
                        .slice(0, 8)
                        .map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{assignment.title}</h4>
                                <Badge variant="outline" className={getAssignmentStatusColor(assignment.status)}>
                                  {getAssignmentStatusLabel(assignment.status)}
                                </Badge>
                                <Badge variant={assignment.type === 'UJIAN' ? 'destructive' : 'default'}>
                                  {assignment.type}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <p>📚 {assignment.subject}</p>
                                <p>👥 {assignment.classAssignments?.map(ca => ca.class?.id).join(', ') || 'Belum ada kelas'}</p>
                                <p>📅 {assignment.dueDate ? formatDate(assignment.dueDate) : 'Belum ada deadline'}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700">
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Quick Actions */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800 border-l-4 border-blue-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Statistik Minggu Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {assignments.filter(a => a.type === 'TUGAS' && a.teacherId === session?.user?.id).length}
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">Tugas</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {assignments.filter(a => a.type === 'UJIAN' && a.teacherId === session?.user?.id).length}
                    </div>
                    <div className="text-sm text-orange-800 dark:text-orange-300">Ujian</div>
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {assignments.filter(a => a.status === 'graded' && a.teacherId === session?.user?.id).length}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-300">Sudah Dinilai</div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Overview */}
            <Card className="shadow-sm border-0 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">Tugas Selesai</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {assignments.filter(a => a.status === 'graded' && a.teacherId === session?.user?.id).length} / {assignments.filter(a => a.type === 'TUGAS' && a.teacherId === session?.user?.id).length || 1}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(assignments.filter(a => a.status === 'graded' && a.teacherId === session?.user?.id).length / Math.max(1, assignments.filter(a => a.type === 'TUGAS' && a.teacherId === session?.user?.id).length) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}