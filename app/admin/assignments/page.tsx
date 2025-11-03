"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Footer } from "@/components/layout/footer";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  type: "TUGAS" | "UJIAN";
  status: "published" | "not_evaluated" | "evaluated";
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [assignmentStatusOverrides, setAssignmentStatusOverrides] = useState<Record<string, string>>({});

  // Get current week info
  const getCurrentWeekInfo = () => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { weekNumber: weekNo, year: d.getUTCFullYear() };
  };

  const currentWeek = getCurrentWeekInfo();

  const itemsPerPage = 10;

  // Fetch assignments from API
  const fetchAssignments = useCallback(async () => {
    // Function to auto-update status based on week change
    const updateStatusBasedOnWeek = (assignments: Assignment[]): Assignment[] => {
      return assignments.map(assignment => {
        const assignmentWeek = assignment.week_number;
        const currentWeekInfo = getCurrentWeekInfo();

        // Only auto-update if assignment is from previous week and still published
        // Don't override admin's manual changes (evaluated status)
        if (assignmentWeek < currentWeekInfo.weekNumber && assignment.status === 'published') {
          console.log(`Auto-updating assignment ${assignment.id} from published to not_evaluated (week ${assignmentWeek} < ${currentWeekInfo.weekNumber})`);
          return { ...assignment, status: 'not_evaluated' };
        }

        return assignment;
      });
    };
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      const response = await fetch(`/api/admin/assignments?${params}`);
      const data = await response.json();

      if (data.success) {
        // Apply auto-update status logic
        let updatedAssignments = updateStatusBasedOnWeek(data.assignments || []);

        // Apply manual status overrides
        updatedAssignments = updatedAssignments.map(assignment => ({
          ...assignment,
          status: (assignmentStatusOverrides[assignment.id] || assignment.status) as "published" | "not_evaluated" | "evaluated"
        }));

        setAssignments(updatedAssignments);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        // Handle case where there's no data but API worked
        if (data.assignments && Array.isArray(data.assignments)) {
          // Apply auto-update status logic for fallback data too
          let updatedAssignments = updateStatusBasedOnWeek(data.assignments);

          // Apply manual status overrides for fallback data
          updatedAssignments = updatedAssignments.map(assignment => ({
            ...assignment,
            status: (assignmentStatusOverrides[assignment.id] || assignment.status) as "published" | "not_evaluated" | "evaluated"
          }));

          setAssignments(updatedAssignments);
          setTotalPages(1);
        } else {
          toast.error(data.error || "Gagal memuat data tugas");
        }
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, assignmentStatusOverrides]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "not_evaluated":
        return <Badge className="bg-orange-100 text-orange-800">Not Evaluated</Badge>;
      case "evaluated":
        return <Badge className="bg-blue-100 text-blue-800">Evaluated</Badge>;
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

  const handleDeleteSelected = () => {
    if (selectedAssignments.length === 0) {
      toast.error("Pilih tugas yang akan dihapus");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);

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

  const updateAssignmentStatus = async () => {
    if (!selectedAssignment) return;

    console.log(`Updating assignment ${selectedAssignment.id} from ${selectedAssignment.status} to ${newStatus}`);

    try {
      const response = await fetch(`/api/admin/assignments/${selectedAssignment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        toast.success("Status tugas berhasil diubah");

        // Store the status override for mock data persistence
        setAssignmentStatusOverrides(prev => ({
          ...prev,
          [selectedAssignment.id]: newStatus
        }));

        setShowEditModal(false);
        setSelectedAssignment(null);
        setNewStatus('');

        // Delay slightly to ensure server update is processed
        setTimeout(() => {
          fetchAssignments();
        }, 100);
      } else {
        toast.error(data.error || "Gagal mengubah status tugas");
      }
    } catch (error) {
      console.error("Error updating assignment status:", error);
      toast.error("Terjadi kesalahan saat mengubah status");
    }
  };

  const handleEditStatus = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setNewStatus(assignment.status);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAssignment(null);
    setNewStatus('');
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

  // Show empty state if no assignments
  if (!loading && assignments.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-6">
          <div>
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold">Belum Ada Tugas</h3>
            <p className="text-muted-foreground">
              Belum ada data tugas dalam database. Hubungi administrator untuk menambahkan data.
            </p>
          </div>
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
            <CardTitle className="text-sm font-medium">Total Tugas & Ujian</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.week_number === currentWeek.weekNumber).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Minggu {currentWeek.weekNumber}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'published' && a.week_number === currentWeek.weekNumber).length}
            </div>
            <p className="text-xs text-muted-foreground">Tugas & ujian aktif minggu ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Evaluated</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {assignments.filter(a => a.status === 'not_evaluated').length}
            </div>
            <p className="text-xs text-muted-foreground">Total tugas & ujian belum dinilai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Evaluated</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.status === 'evaluated').length}
            </div>
            <p className="text-xs text-muted-foreground">Total tugas & ujian sudah dinilai</p>
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
                      <td colSpan={8} className="h-24 text-center">
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
                          {assignment.class_assignments && assignment.class_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignment.class_assignments.map((ca, index) => (
                                <Badge key={index} variant="secondary">
                                  {ca.class_name ? (
                                    <>
                                      {ca.class_name}
                                    </>
                                  ) : (
                                    ca.class_id
                                  )}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Tidak ada kelas</span>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStatus(assignment)}
                              title="Edit Status"
                            >
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

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin Menghapus Tugas?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAssignments.length === 1 ? (
                <>Apakah Anda yakin ingin menghapus 1 tugas? Tindakan ini tidak dapat dibatalkan.</>
              ) : (
                <>Apakah Anda yakin ingin menghapus {selectedAssignments.length} tugas? Tindakan ini tidak dapat dibatalkan.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Status Modal */}
      <AlertDialog open={showEditModal} onOpenChange={handleCloseEditModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Status Tugas</AlertDialogTitle>
          </AlertDialogHeader>
          {selectedAssignment && (
            <div className="space-y-2 mb-4">
              <div><strong>Judul:</strong> {selectedAssignment.title}</div>
              <div><strong>Mata Pelajaran:</strong> {selectedAssignment.subject}</div>
              <div><strong>Kelas:</strong>
                {selectedAssignment.class_assignments && selectedAssignment.class_assignments.length > 0 ? (
                  selectedAssignment.class_assignments.map((ca, index) => (
                    <span key={index} className="ml-1">
                      {ca.class_name ? (
                        <>Kelas {ca.class_name}</>
                      ) : (
                        ca.class_id
                      )}
                      {index < (selectedAssignment.class_assignments?.length || 0) - 1 && ', '}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground italic ml-1">Tidak ada kelas</span>
                )}
              </div>
            </div>
          )}
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Status Baru:</label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-full"></div>
                    Published - Tugas aktif minggu ini
                  </div>
                </SelectItem>
                <SelectItem value="not_evaluated">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-full"></div>
                    Not Evaluated - Belum dinilai
                  </div>
                </SelectItem>
                <SelectItem value="evaluated">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></div>
                    Evaluated - Sudah dinilai
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={updateAssignmentStatus}>
              Simpan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <Footer />
    </div>
  );
}