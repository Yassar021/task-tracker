"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeacherForm } from "@/components/forms/teacher-form";
import { MoreHorizontal, Edit, Eye, Trash2, UserPlus, Search, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber, formatDate } from "@/lib/school-utils";
import type { Teacher } from "@/db/schema/school";

export function TeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch teachers from API
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/teachers");

      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }

      const result = await response.json();
      setTeachers(result.data || []);
      setFilteredTeachers(result.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Gagal memuat data guru");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filter teachers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTeachers(teachers);
    } else {
      const filtered = teachers.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher.subjects.some((subject) =>
            subject.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setFilteredTeachers(filtered);
    }
  }, [teachers, searchTerm]);

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan guru ${teacher.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete teacher");
      }

      toast.success("Guru berhasil dinonaktifkan");
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Gagal menonaktifkan guru");
    }
  };

  const handleFormSuccess = () => {
    fetchTeachers();
    setSelectedTeacher(undefined);
  };

  const handleWhatsAppClick = (phone: string, teacherName: string) => {
    const message = `Halo Bapak/Ibu ${teacherName},\n\nAdmin SMP YPS SINGKOLE`;
    const whatsappUrl = `https://wa.me/${formatPhoneNumber(phone).replace(/^0/, '62')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Guru</CardTitle>
          <CardDescription>Mengelola data guru dan mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Memuat data guru...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manajemen Guru</CardTitle>
              <CardDescription>
                Kelola data guru, mata pelajaran, dan tujuan pembelajaran
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah Guru
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{teachers.length}</div>
                <p className="text-xs text-muted-foreground">Total Guru</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {teachers.filter((t) => t.subjects.length >= 2).length}
                </div>
                <p className="text-xs text-muted-foreground">Guru Multi Mapel</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {new Set(teachers.flatMap((t) => t.subjects)).size}
                </div>
                <p className="text-xs text-muted-foreground">Mapel Tercover</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {teachers.filter((t) => t.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">Guru Aktif</p>
              </CardContent>
            </Card>
          </div>

          {/* Teachers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchTerm ? "Tidak ada guru yang ditemukan" : "Belum ada data guru"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{teacher.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsAppClick(teacher.phone, teacher.name)}
                            className="h-auto p-1"
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                          </Button>
                          <span className="text-sm">{formatPhoneNumber(teacher.phone)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.slice(0, 2).map((subject) => (
                            <Badge key={subject} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {teacher.subjects.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{teacher.subjects.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={teacher.isActive ? "default" : "secondary"}
                          className={
                            teacher.isActive ? "bg-green-100 text-green-800" : ""
                          }
                        >
                          {teacher.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(teacher.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEdit(teacher)}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleWhatsAppClick(teacher.phone, teacher.name)}
                              className="gap-2"
                            >
                              <Phone className="h-4 w-4" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(teacher)}
                              className="gap-2 text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                              Nonaktifkan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Form Dialog */}
      <TeacherForm
        teacher={selectedTeacher}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTeacher(undefined);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}