"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  type: "TUGAS" | "UJIAN";
  status: "draft" | "published" | "graded" | "closed";
  week_number: number;
  year: number;
  created_at: string;
  due_date?: string;
  description?: string;
  learning_goal?: string;
  class_assignments?: Array<{
    class_id: string;
    class_name?: string;
  }>;
  teacher?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function AssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);

  // Get current week info
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { weekNumber: weekNo, year: d.getUTCFullYear() };
  };

  const currentWeek = getCurrentWeekInfo();

  const itemsPerPage = 10;

  // Fetch assignments from API
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      const response = await fetch(`/api/admin/assignments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAssignments(data.assignments || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.error || "Gagal memuat data tugas");
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case "graded":
        return <Badge className="bg-blue-100 text-blue-800">Graded</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "TUGAS":
        return <Badge variant="outline">Tugas</Badge>;
      case "UJIAN":
        return <Badge variant="default">Ujian</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAssignments.length === 0) {
      toast.error("Pilih tugas yang akan dihapus");
      return;
    }

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedAssignments }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${selectedAssignments.length} tugas berhasil dihapus`);
        setSelectedAssignments([]);
        fetchAssignments();
      } else {
        toast.error(data.error || "Gagal menghapus tugas");
      }
    } catch (error) {
      console.error("Error deleting assignments:", error);
      toast.error("Terjadi kesalahan saat menghapus tugas");
    }
  };

  const toggleSelection = (assignmentId: string) => {
    setSelectedAssignments(prev =>
      prev.includes(assignmentId)
        ? prev.filter(id => id !== assignmentId)
        : [...prev, assignmentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssignments.length === assignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments.map(a => a.id));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data tugas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Tugas</h1>
          <p className="text-muted-foreground">
            Kelola semua tugas dan ujian yang telah dibuat
          </p>
        </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tugas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              Minggu {currentWeek.weekNumber}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tugas Aktif</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'published').length}
            </div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {assignments.filter(a => a.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">Belum dipublish</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ujian</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.type === 'UJIAN').length}
            </div>
            <p className="text-xs text-muted-foreground">Total ujian</p>
          </CardContent>
        </Card>
      </div>

      
      {/* Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg">Semua Tugas & Ujian</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total {assignments.length} tugas dari semua minggu
                </p>
              </div>
            </div>
            {selectedAssignments.length > 0 && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top duration-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedAssignments.length === assignments.length ? "Batal Pilih" : "Pilih Semua"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="shadow-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus ({selectedAssignments.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gradient-to-r from-muted/50 to-muted/30">
                  <tr>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.length === assignments.length && assignments.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-muted-foreground/30"
                      />
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Judul Tugas
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Mata Pelajaran
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Tipe
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Kelas
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Dibuat
                    </th>
                    <th className="h-14 px-4 text-left align-middle font-semibold text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-12 w-12 mb-4 opacity-50" />
                          <p>Belum ada tugas untuk filter yang dipilih</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedAssignments.includes(assignment.id)}
                            onChange={() => toggleSelection(assignment.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4 font-medium">
                          {assignment.title}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{assignment.subject}</Badge>
                        </td>
                        <td className="p-4">
                          {getTypeBadge(assignment.type)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(assignment.status)}
                        </td>
                        <td className="p-4">
                          {assignment.class_assignments?.map((ca, index) => (
                            <Badge key={index} variant="secondary" className="mr-1">
                              {ca.class_id}
                            </Badge>
                          )) || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(assignment.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSelection(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}