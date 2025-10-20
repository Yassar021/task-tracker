"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";

// Dummy data - disesain berdasarkan struktur kelas yang ada
const dummyClasses = [
  // Kelas 7
  { id: "7-DIS", grade: 7, name: "DISCIPLINE", tasks: 2, exams: 1, load: 75 },
  { id: "7-RES", grade: 7, name: "RESPECT", tasks: 1, exams: 1, load: 50 },
  { id: "7-CRE", grade: 7, name: "CREATIVE", tasks: 3, exams: 2, load: 100 },
  { id: "7-IND", grade: 7, name: "INDEPENDENT", tasks: 0, exams: 0, load: 0 },
  { id: "7-COL", grade: 7, name: "COLLABORATIVE", tasks: 1, exams: 2, load: 75 },
  { id: "7-RESI", grade: 7, name: "RESILIENT", tasks: 2, exams: 0, load: 50 },
  // Kelas 8
  { id: "8-DIS", grade: 8, name: "DISCIPLINE", tasks: 1, exams: 2, load: 75 },
  { id: "8-RES", grade: 8, name: "RESPECT", tasks: 2, exams: 2, load: 100 },
  { id: "8-CRE", grade: 8, name: "CREATIVE", tasks: 0, exams: 1, load: 25 },
  { id: "8-IND", grade: 8, name: "INDEPENDENT", tasks: 1, exams: 0, load: 25 },
  { id: "8-COL", grade: 8, name: "COLLABORATIVE", tasks: 3, exams: 1, load: 100 },
  { id: "8-RESI", grade: 8, name: "RESILIENT", tasks: 1, exams: 1, load: 50 },
  // Kelas 9
  { id: "9-DIS", grade: 9, name: "DISCIPLINE", tasks: 2, exams: 1, load: 75 },
  { id: "9-RES", grade: 9, name: "RESPECT", tasks: 0, exams: 1, load: 25 },
  { id: "9-CRE", grade: 9, name: "CREATIVE", tasks: 2, exams: 2, load: 100 },
  { id: "9-IND", grade: 9, name: "INDEPENDENT", tasks: 1, exams: 0, load: 25 },
  { id: "9-COL", grade: 9, name: "COLLABORATIVE", tasks: 2, exams: 1, load: 75 },
  { id: "9-RESI", grade: 9, name: "RESILIENT", tasks: 0, exams: 0, load: 0 },
];

// Historical data untuk trend analysis
const historicalData = [
  { week: "Minggu 37", grade7: 65, grade8: 70, grade9: 60, overall: 65 },
  { week: "Minggu 38", grade7: 70, grade8: 72, grade9: 65, overall: 69 },
  { week: "Minggu 39", grade7: 68, grade8: 78, grade9: 70, overall: 72 },
  { week: "Minggu 40", grade7: 72, grade8: 82, grade9: 68, overall: 74 },
  { week: "Minggu 41", grade7: 75, grade8: 80, grade9: 73, overall: 76 },
  { week: "Minggu 42", grade7: 71, grade8: 85, grade9: 75, overall: 77 },
];

const COLORS = {
  grade7: "#10b981", // emerald
  grade8: "#3b82f6", // blue
  grade9: "#8b5cf6", // violet
  tasks: "#06b6d4", // cyan
  exams: "#8b5cf6", // violet
  overload: "#ef4444", // red
  normal: "#10b981", // green
  warning: "#f59e0b", // yellow
};

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Calculate statistics
  const calculateStats = () => {
    const filteredClasses = selectedGrade === "all"
      ? dummyClasses
      : dummyClasses.filter(c => c.grade === parseInt(selectedGrade));

    const totalTasks = filteredClasses.reduce((sum, c) => sum + c.tasks, 0);
    const totalExams = filteredClasses.reduce((sum, c) => sum + c.exams, 0);
    const avgLoad = filteredClasses.reduce((sum, c) => sum + c.load, 0) / filteredClasses.length;
    const overloadClasses = filteredClasses.filter(c => c.load >= 100).length;
    const normalClasses = filteredClasses.filter(c => c.load < 50).length;

    return {
      totalTasks,
      totalExams,
      avgLoad: Math.round(avgLoad),
      overloadClasses,
      normalClasses,
      totalClasses: filteredClasses.length
    };
  };

  // Prepare chart data
  const prepareGradeDistribution = () => {
    const gradeStats = {
      7: dummyClasses.filter(c => c.grade === 7),
      8: dummyClasses.filter(c => c.grade === 8),
      9: dummyClasses.filter(c => c.grade === 9)
    };

    return Object.entries(gradeStats).map(([grade, classes]) => ({
      grade: `Kelas ${grade}`,
      totalClasses: classes.length,
      avgLoad: Math.round(classes.reduce((sum, c) => sum + c.load, 0) / classes.length),
      totalTasks: classes.reduce((sum, c) => sum + c.tasks, 0),
      totalExams: classes.reduce((sum, c) => sum + c.exams, 0),
      overloadCount: classes.filter(c => c.load >= 100).length
    }));
  };

  const prepareTopClasses = () => {
    return dummyClasses
      .sort((a, b) => b.load - a.load)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        load: c.load,
        tasks: c.tasks,
        exams: c.exams
      }));
  };

  const prepareLoadDistribution = () => {
    const distribution = [
      { name: "Aman (0-25%)", value: dummyClasses.filter(c => c.load < 25).length, color: COLORS.normal },
      { name: "Ringan (25-50%)", value: dummyClasses.filter(c => c.load >= 25 && c.load < 50).length, color: COLORS.warning },
      { name: "Sedang (50-75%)", value: dummyClasses.filter(c => c.load >= 50 && c.load < 75).length, color: COLORS.grade7 },
      { name: "Tinggi (75-99%)", value: dummyClasses.filter(c => c.load >= 75 && c.load < 100).length, color: COLORS.grade8 },
      { name: "Penuh (100%)", value: dummyClasses.filter(c => c.load >= 100).length, color: COLORS.overload }
    ];
    return distribution.filter(d => d.value > 0);
  };

  const prepareTaskVsExamData = () => {
    const gradeStats = {
      7: dummyClasses.filter(c => c.grade === 7),
      8: dummyClasses.filter(c => c.grade === 8),
      9: dummyClasses.filter(c => c.grade === 9)
    };

    return Object.entries(gradeStats).map(([grade, classes]) => ({
      grade: `Kelas ${grade}`,
      tasks: classes.reduce((sum, c) => sum + c.tasks, 0),
      exams: classes.reduce((sum, c) => sum + c.exams, 0)
    }));
  };

  const stats = calculateStats();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Implement export functionality
    console.log("Exporting analytics data...");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitoring dan Analisis Beban Tugas & Ujian
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tugas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Aktif minggu ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ujian</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalExams}
            </div>
            <p className="text-xs text-muted-foreground">
              Terjad minggu ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Beban</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLoad}%</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Overload</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.overloadClasses}
            </div>
            <p className="text-xs text-muted-foreground">
              Dari {stats.totalClasses} kelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kelas Aman</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.normalClasses}
            </div>
            <p className="text-xs text-muted-foreground">
              Beban {"<"} 50%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter Tingkatan:</span>
          <div className="flex gap-2">
            <Button
              variant={selectedGrade === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGrade("all")}
            >
              Semua
            </Button>
            <Button
              variant={selectedGrade === "7" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGrade("7")}
            >
              Kelas 7
            </Button>
            <Button
              variant={selectedGrade === "8" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGrade("8")}
            >
              Kelas 8
            </Button>
            <Button
              variant={selectedGrade === "9" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGrade("9")}
            >
              Kelas 9
            </Button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="distribution" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Distribusi Beban
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Perbandingan Kelas
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trend Analysis
          </TabsTrigger>
          <TabsTrigger value="tasks-exams" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Tugas vs Ujian
          </TabsTrigger>
        </TabsList>

        {/* Distribution Chart */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Load Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Beban Keseluruhan</CardTitle>
                <CardDescription>
                  Persentase kelas berdasarkan tingkat beban
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={prepareLoadDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareLoadDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Per Tingkatan</CardTitle>
                <CardDescription>
                  Rata-rata beban dan aktivitas per kelas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareGradeDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgLoad" fill={COLORS.grade7} name="Avg Beban (%)" />
                    <Bar dataKey="totalTasks" fill={COLORS.tasks} name="Total Tugas" />
                    <Bar dataKey="totalExams" fill={COLORS.exams} name="Total Ujian" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Classes Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>10 Kelas dengan Beban Tertinggi</CardTitle>
              <CardDescription>
                Detail kelas dengan beban tertinggi minggu ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareTopClasses()} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="id" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="load" fill={COLORS.overload} name="Beban (%)" />
                  <Bar dataKey="tasks" fill={COLORS.tasks} name="Tugas" />
                  <Bar dataKey="exams" fill={COLORS.exams} name="Ujian" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Analysis */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Beban 6 Minggu Terakhir</CardTitle>
              <CardDescription>
                Perkembangan rata-rata beban per tingkatan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Rata-rata"
                  />
                  <Line
                    type="monotone"
                    dataKey="grade7"
                    stroke={COLORS.grade7}
                    strokeWidth={2}
                    name="Kelas 7"
                  />
                  <Line
                    type="monotone"
                    dataKey="grade8"
                    stroke={COLORS.grade8}
                    strokeWidth={2}
                    name="Kelas 8"
                  />
                  <Line
                    type="monotone"
                    dataKey="grade9"
                    stroke={COLORS.grade9}
                    strokeWidth={2}
                    name="Kelas 9"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tingkat Pertumbuhan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kelas 7:</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+9.2%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kelas 8:</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+21.4%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kelas 9:</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">+25.0%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Prediksi Minggu Depan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kelas 7:</span>
                    <span className="text-sm font-medium">78% ±5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kelas 8:</span>
                    <span className="text-sm font-medium">82% ±3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Kelas 9:</span>
                    <span className="text-sm font-medium">76% ±4%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Efisiensi Sistem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Kapasitas Terpakai</span>
                      <span className="font-medium">77%</span>
                    </div>
                    <Progress value={77} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sistem berjalan optimal dengan 77% kapasitas terpakai
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks vs Exams */}
        <TabsContent value="tasks-exams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Komparasi Tugas vs Ujian</CardTitle>
              <CardDescription>
                Perbandingan jumlah tugas dan ujian per tingkatan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareTaskVsExamData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill={COLORS.tasks} name="Total Tugas" />
                  <Bar dataKey="exams" fill={COLORS.exams} name="Total Ujian" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task/Exam Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prepareTaskVsExamData().map((grade) => (
              <Card key={grade.grade}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{grade.grade}</CardTitle>
                </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tugas</span>
                        <span className="text-lg font-bold text-blue-600">{grade.tasks}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Ujian</span>
                        <span className="text-lg font-bold text-purple-600">{grade.exams}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Total</span>
                          <span className="text-sm font-bold">{grade.tasks + grade.exams}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Tugas:</span>
                            <span>{Math.round((grade.tasks / (grade.tasks + grade.exams)) * 100)}%</span>
                          </div>
                          <Progress
                            value={(grade.tasks / (grade.tasks + grade.exams)) * 100}
                            className="h-1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}