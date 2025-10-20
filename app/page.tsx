"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Calendar,
  Plus,
  CheckCircle,
  AlertTriangle,
  Settings,
  Users,
  Lock,
  Eye,
  RefreshCw,
} from "lucide-react";
import { AssignmentForm } from "@/components/forms/assignment-form";
import { toast } from "sonner";

// Helper function for safe JSON parsing
const safeJsonParse = async (response: Response) => {
  try {
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response body');
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parsing failed:', error);
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
};

// Define types locally
interface Class {
  id: string;
  grade: number;
  name: string;
  isActive: boolean;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  type: "TUGAS" | "UJIAN";
  weekNumber: number;
  year: number;
  status: string;
  classAssignments?: Array<{
    classId: string;
  }>;
}

interface ClassStatus {
  class: Class;
  tasks: number;
  exams: number;
  maxTasks: number;
  maxExams: number;
}

export default function HomePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classStatuses, setClassStatuses] = useState<ClassStatus[]>([]);
  const [showInputForm, setShowInputForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [inputCode, setInputCode] = useState('');
  const [newAssignments, setNewAssignments] = useState<Assignment[]>([]);
  const [currentWeek, setCurrentWeek] = useState<{ weekNumber: number; year: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sample codes - in real app these would come from database
  const GRADE_CODES = {
    '7': 'KODE-KELAS-7',
    '8': 'KODE-KELAS-8',
    '9': 'KODE-KELAS-9'
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [classesResponse, assignmentsResponse, weekResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/home/assignments'),
        fetch('/api/utils/week-info'),
      ]);

      // Check if responses are OK before parsing JSON
      if (!classesResponse.ok || !assignmentsResponse.ok || !weekResponse.ok) {
        throw new Error('One or more API requests failed');
      }

      // Safely parse JSON with error handling
      const [classesData, assignmentsData, weekData] = await Promise.all([
        safeJsonParse(classesResponse),
        safeJsonParse(assignmentsResponse),
        safeJsonParse(weekResponse),
      ]);

      setClasses(classesData.classes || []);
      setAssignments(assignmentsData.assignments || []);
      setCurrentWeek(weekData.weekInfo);

      // Combine existing assignments with new ones
      const allAssignments = [...(assignmentsData.assignments || []), ...newAssignments];

      // Calculate status
      const statuses = calculateClassStatuses(classesData.classes || [], allAssignments, weekData.weekInfo);
      setClassStatuses(statuses);
    } catch (error) {
      console.error("Error:", error);
      // If API fails, show sample data
      setSampleData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHomeData();
      toast.success("Data berhasil diperbarui!", {
        description: "Informasi kelas dan tugas telah dimuat ulang",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Gagal memperbarui data", {
        description: "Terjadi kesalahan saat mengambil data terbaru",
        duration: 5000,
      });
    }
  };

  const setSampleData = () => {
    // Create sample classes if API fails
    const sampleClasses = [
      { id: '7-DIS', grade: 7, name: 'DISCIPLINE', isActive: true },
      { id: '7-RES', grade: 7, name: 'RESPECT', isActive: true },
      { id: '7-CRE', grade: 7, name: 'CREATIVE', isActive: true },
      { id: '7-IND', grade: 7, name: 'INDEPENDENT', isActive: true },
      { id: '7-COL', grade: 7, name: 'COLLABORATIVE', isActive: true },
      { id: '7-RESI', grade: 7, name: 'RESILIENT', isActive: true },
      // Grade 8
      { id: '8-DIS', grade: 8, name: 'DISCIPLINE', isActive: true },
      { id: '8-RES', grade: 8, name: 'RESPECT', isActive: true },
      { id: '8-CRE', grade: 8, name: 'CREATIVE', isActive: true },
      { id: '8-IND', grade: 8, name: 'INDEPENDENT', isActive: true },
      { id: '8-COL', grade: 8, name: 'COLLABORATIVE', isActive: true },
      { id: '8-RESI', grade: 8, name: 'RESILIENT', isActive: true },
      // Grade 9
      { id: '9-DIS', grade: 9, name: 'DISCIPLINE', isActive: true },
      { id: '9-RES', grade: 9, name: 'RESPECT', isActive: true },
      { id: '9-CRE', grade: 9, name: 'CREATIVE', isActive: true },
      { id: '9-IND', grade: 9, name: 'INDEPENDENT', isActive: true },
      { id: '9-COL', grade: 9, name: 'COLLABORATIVE', isActive: true },
      { id: '9-RESI', grade: 9, name: 'RESILIENT', isActive: true },
    ];
    setClasses(sampleClasses);

    // Set current week info
    const now = new Date();
    const weekNumber = Math.ceil(now.getDate() / 7);
    setCurrentWeek({ weekNumber, year: now.getFullYear() });
  };

  const calculateClassStatuses = (classes: Class[], assignments: Assignment[], weekInfo: { weekNumber: number; year: number }): ClassStatus[] => {
    if (!classes || !Array.isArray(classes)) {
      console.log('calculateClassStatuses: No classes provided');
      return [];
    }
    if (!assignments || !Array.isArray(assignments)) {
      console.log('calculateClassStatuses: No assignments provided, using empty array');
      assignments = [];
    }
    if (!weekInfo) {
      console.log('calculateClassStatuses: No weekInfo provided');
      return [];
    }

    console.log('calculateClassStatuses called with:', {
      classCount: classes.length,
      assignmentCount: assignments.length,
      weekInfo: weekInfo
    });

    return classes.map(classItem => {
      const weekAssignments = assignments.filter(assignment =>
        assignment.weekNumber === weekInfo.weekNumber &&
        assignment.year === weekInfo.year &&
        assignment.classAssignments?.some(ca => ca.classId === classItem.id)
      );

      const tasks = weekAssignments.filter(a => a.type === 'TUGAS').length;
      const exams = weekAssignments.filter(a => a.type === 'UJIAN').length;

      const status = {
        class: classItem,
        tasks,
        exams,
        maxTasks: 2,
        maxExams: 2
      };

      // Log only classes with assignments
      if (tasks > 0 || exams > 0) {
        console.log(`Class ${classItem.id}: ${tasks} tasks, ${exams} exams`);
      }

      return status;
    });
  };

  const getProgressColor = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage >= 100) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (percentage >= 75) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (percentage >= 25) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    return 'bg-gradient-to-r from-green-400 to-emerald-500';
  };

  const getOverallProgress = () => {
    const totalSlots = classStatuses.reduce((acc, status) =>
      acc + status.maxTasks + status.maxExams, 0
    );
    const usedSlots = classStatuses.reduce((acc, status) =>
      acc + status.tasks + status.exams, 0
    );
    return totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0;
  };

  const getOverallProgressColor = () => {
    const percentage = getOverallProgress();
    if (percentage >= 100) return 'bg-gradient-to-r from-red-500 to-pink-500';
    if (percentage >= 75) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (percentage >= 25) return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    return 'bg-gradient-to-r from-green-400 to-emerald-500';
  };

  const handleInputSubmit = () => {
    if (!selectedGrade || !inputCode) {
      alert('Pilih tingkatan dan masukkan kode!');
      return;
    }

    if (inputCode !== GRADE_CODES[selectedGrade as keyof typeof GRADE_CODES]) {
      alert('Kode salah! Silakan coba lagi.');
      return;
    }

    // Show assignment form
    setShowInputForm(false);
    setShowAssignmentForm(true);
    setSelectedGrade('');
    setInputCode('');
  };

  // Group classes by grade
  const classesByGrade = {
    7: classStatuses.filter(status => status.class.grade === 7),
    8: classStatuses.filter(status => status.class.grade === 8),
    9: classStatuses.filter(status => status.class.grade === 9),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md mx-auto">
          {/* Animated Logo */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-spin"></div>
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600 animate-bounce" />
              </div>
            </div>

            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2"></div>
              <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 w-2 h-2 bg-cyan-500 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2"></div>
            </div>
          </div>

          {/* Loading text with animation */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
              Memuat Data...
            </h2>
            <p className="text-gray-600 animate-pulse">
              Mengambil informasi kelas dan tugas
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"
                 style={{ width: '70%' }}></div>
          </div>

          {/* Loading dots animation */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>

          {/* Floating elements */}
          <div className="relative h-20">
            <div className="absolute top-0 left-1/4 text-2xl animate-bounce" style={{ animationDelay: '0ms' }}>📚</div>
            <div className="absolute top-0 right-1/4 text-2xl animate-bounce" style={{ animationDelay: '200ms' }}>📝</div>
            <div className="absolute bottom-0 left-1/3 text-2xl animate-bounce" style={{ animationDelay: '400ms' }}>✏️</div>
            <div className="absolute bottom-0 right-1/3 text-2xl animate-bounce" style={{ animationDelay: '600ms' }}>🎯</div>
          </div>

          {/* Subtle hint */}
          <p className="text-xs text-gray-500 animate-pulse">
            Mohon tunggu sebentar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          📚 Monitoring Tugas & Ujian
        </h1>
        <p className="text-xl text-muted-foreground">
          SMP YPS SINGKOLE - Minggu {currentWeek?.weekNumber} Tahun {currentWeek?.year}
        </p>

        {/* Overall Progress */}
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress Keseluruhan</span>
                <span>{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className={`h-3 ${getOverallProgressColor()} shadow-sm`} />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => setShowInputForm(true)}
            className="gap-2"
          >
            <Lock className="h-4 w-4" />
            Input Tugas/Ujian
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 relative"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memuat...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin'}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Admin Panel
          </Button>
        </div>
      </div>

      {/* Classes by Grade */}
      {Object.entries(classesByGrade).map(([grade, statusList]) => (
        <div key={grade} className="space-y-4">
          <h2 className="text-2xl font-bold text-center">
            📚 Kelas {grade}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statusList.map((status) => {
              const totalUsed = status.tasks + status.exams;
              const totalMax = status.maxTasks + status.maxExams;
              const percentage = (totalUsed / totalMax) * 100;

              return (
                <Card
                  key={`${status.class.id}-${status.updateCounter || 0}`}
                  className={`relative transition-all duration-500 ease-out ${
                    refreshing ? 'scale-95 opacity-70' : 'scale-100 opacity-100'
                  } hover:shadow-lg`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-center">
                      {status.class.id}
                    </CardTitle>
                    <CardDescription className="text-center text-xs">
                      {status.class.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress
                      value={percentage}
                      className={`h-3 ${getProgressColor(totalUsed, totalMax)} shadow-sm`}
                    />

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Tugas:</span>
                        <Badge variant={status.tasks >= status.maxTasks ? "destructive" : "secondary"}>
                          {status.tasks}/{status.maxTasks}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Ujian:</span>
                        <Badge variant={status.exams >= status.maxExams ? "destructive" : "secondary"}>
                          {status.exams}/{status.maxExams}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Input Form Modal */}
      {showInputForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Input Tugas/Ujian</CardTitle>
              <CardDescription>
                Masukkan kode untuk melanjutkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Tingkatan:</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(GRADE_CODES).map(grade => (
                    <Button
                      key={grade}
                      variant={selectedGrade === grade ? "default" : "outline"}
                      onClick={() => setSelectedGrade(grade)}
                    >
                      Kelas {grade}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kode Rahasia:</label>
                <input
                  type="password"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Masukkan kode"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInputForm(false);
                    setSelectedGrade('');
                    setInputCode('');
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button onClick={handleInputSubmit} className="flex-1">
                  Lanjut
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assignment Form Dialog */}
      {showAssignmentForm && (
        <AssignmentForm
          isOpen={showAssignmentForm}
          onClose={() => setShowAssignmentForm(false)}
          currentClassStatuses={classStatuses}
          onSuccess={(newAssignment) => {
            setShowAssignmentForm(false);
            if (newAssignment && currentWeek) {
              console.log('Assignment created, updating UI...');

              // Extract assigned class IDs from different possible structures
              const assignedClassIds = newAssignment.classIds ||
                (Array.isArray(newAssignment.assignedClasses)
                  ? newAssignment.assignedClasses.map(ac => typeof ac === 'string' ? ac : ac.classId)
                  : []);

              console.log('Assignment created for classes:', assignedClassIds);
              console.log('Assignment type:', newAssignment.type);

              // Update progress bars without resetting
              setClassStatuses(currentStatuses => {
                const newStatuses = currentStatuses.map(status => {
                  if (assignedClassIds.includes(status.class.id)) {
                    const increment = newAssignment.type === 'TUGAS' ? 1 : 0;
                    const examIncrement = newAssignment.type === 'UJIAN' ? 1 : 0;

                    const newTasks = Math.min(status.tasks + increment, status.maxTasks);
                    const newExams = Math.min(status.exams + examIncrement, status.maxExams);

                    console.log(`Updating ${status.class.id}: tasks ${status.tasks}→${newTasks}, exams ${status.exams}→${newExams}`);

                    // Preserve existing data, just update the counters
                    return {
                      ...status,
                      tasks: newTasks,
                      exams: newExams,
                      updateCounter: (status.updateCounter || 0) + 1, // Increment instead of timestamp
                    };
                  }
                  return status;
                });

                console.log('New statuses:', newStatuses.map(s => ({id: s.class.id, tasks: s.tasks, exams: s.exams})));
                return newStatuses;
              });
            }
            // For database mode, refresh data from server to get accurate state
            // Use longer delay to ensure database write is complete
            if (!newAssignment.isOfflineMode) {
              console.log('Refreshing data from server after database save...');
              setTimeout(() => {
                console.log('Executing fetchHomeData refresh...');
                fetchHomeData();
              }, 1000); // Increased delay for database consistency
            }
          }}
          teacherId="temp-teacher-id" // TODO: Get actual teacher ID from session
        />
      )}
    </div>
  );
}
