"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  SMP_SUBJECTS,
  getCurrentWeekInfo,
  generateLearningGoal,
  getAssignmentStatusColor,
  getAssignmentStatusLabel,
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

// Form validation schema
const assignmentFormSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  subject: z.string().min(1, "Mata pelajaran harus dipilih"),
  learningGoal: z.string().min(10, "Tujuan pembelajaran minimal 10 karakter"),
  type: z.enum(["TUGAS", "UJIAN"]),
  selectedClasses: z.array(z.string()).min(1, "Pilih minimal 1 kelas"),
  dueDate: z.date().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface ClassStatus {
  class: any;
  tasks: number;
  exams: number;
  maxTasks: number;
  maxExams: number;
}

interface AssignmentFormProps {
  assignment?: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assignment?: any) => void;
  teacherId: string;
  currentClassStatuses?: ClassStatus[];
}

export function AssignmentForm({
  assignment,
  isOpen,
  onClose,
  onSuccess,
  teacherId,
  currentClassStatuses = [],
}: AssignmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(assignment ? [] : []);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classQuotas, setClassQuotas] = useState<Record<string, { used: number; max: number }>>({});
  const [maxQuota] = useState(2); // Default max 2 assignments per week per class
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [currentWeekInfo] = useState(getCurrentWeekInfo());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: assignment?.title || "",
      description: assignment?.description || "",
      subject: assignment?.subject || "",
      learningGoal: assignment?.learningGoal || "",
      type: assignment?.type || "TUGAS",
      selectedClasses: [],
      dueDate: assignment?.dueDate ? new Date(assignment.dueDate) : undefined,
    },
  });

  const selectedSubject = watch("subject");
  const selectedType = watch("type");
  const dueDate = watch("dueDate");

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/classes');
        if (response.ok) {
          const data = await response.json();
          setClasses(data.classes);
        } else {
          throw new Error('Failed to fetch classes');
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Gagal memuat data kelas");
      }
    };

    if (isOpen) {
      fetchClasses();
    }
  }, [isOpen]);

  // Check quota for selected classes
  useEffect(() => {
    if (selectedClasses.length > 0) {
      checkClassQuotas();
    }
  }, [selectedClasses, currentWeekInfo.weekNumber, currentWeekInfo.year, teacherId]);

  // Force re-render when assignment type changes (affects class availability)
  const assignmentType = watch('type');
  useEffect(() => {
    // Re-render to update class availability based on assignment type
  }, [assignmentType]);

  const checkClassQuotas = async () => {
    if (!currentWeekInfo) {
      console.error('No currentWeekInfo available');
      return;
    }

    try {
      const requestBody = {
        classIds: selectedClasses,
        weekNumber: currentWeekInfo.weekNumber,
        year: currentWeekInfo.year,
        assignmentType: selectedType, // Use the selected assignment type
      };
      console.log('Sending quota check request:', requestBody);

      const response = await fetch('/api/assignments/check-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Quota API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', response.status, errorText);
        throw new Error(`Failed to check quota: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Quota API Response:', data);

      // Set all quotas from the API response
      setClassQuotas(data.quotas || {});
    } catch (error) {
      console.error("Error checking quotas:", error);
      toast.error("Gagal memeriksa kuota tugas");
    }
  };

  const handleClassToggle = (classId: string, checked: boolean) => {
    // Check quota before allowing selection
    if (checked) {
      const quotaStatus = getClassQuotaStatus(classId);
      if (!quotaStatus.canSelect) {
        return; // Don't allow selection if quota is full
      }

      const newClasses = [...selectedClasses, classId];
      setSelectedClasses(newClasses);
      setValue("selectedClasses", newClasses);
    } else {
      const newClasses = selectedClasses.filter((c) => c !== classId);
      setSelectedClasses(newClasses);
      setValue("selectedClasses", newClasses);
      // Remove from quotas
      const newQuotas = { ...classQuotas };
      delete newQuotas[classId];
      setClassQuotas(newQuotas);
    }
  };

  const canSelectClass = (classId: string) => {
    const currentCount = classQuotas[classId]?.used || 0;
    return currentCount < maxQuota;
  };

  const getClassQuotaStatus = (classId: string) => {
    // Get current class status from props
    const classStatus = currentClassStatuses.find(cs => cs.class.id === classId);
    const assignmentType = watch('type');

    if (!classStatus) {
      return {
        current: 0,
        remaining: 2,
        canSelect: true,
        status: "available" as const,
      };
    }

    // Check based on assignment type
    const currentCount = assignmentType === 'TUGAS' ? classStatus.tasks : classStatus.exams;
    const maxLimit = assignmentType === 'TUGAS' ? classStatus.maxTasks : classStatus.maxExams;
    const remaining = maxLimit - currentCount;

    return {
      current: currentCount,
      remaining,
      canSelect: remaining > 0,
      status: remaining === 0 ? "full" : remaining === 1 ? "warning" : "available",
    };
  };

  const useLearningGoalTemplate = (template: string) => {
    const goal = template.replace("{subject}", selectedSubject);
    setValue("learningGoal", goal);
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      setIsSubmitting(true);

      // Validate that all selected classes have available quota
      const invalidClasses = selectedClasses.filter(classId => !canSelectClass(classId));
      if (invalidClasses.length > 0) {
        toast.error(`Beberapa kelas sudah mencapai batas maksimal tugas minggu ini`);
        return;
      }

      const assignmentPayload = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        learningGoal: data.learningGoal,
        type: data.type,
        weekNumber: currentWeekInfo.weekNumber,
        year: currentWeekInfo.year,
        teacherId,
        dueDate: data.dueDate,
        status: "published" as const,
      };

      // Create assignment via API
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...assignmentPayload,
          assignedClasses: selectedClasses,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific database errors
        if (result.isDatabaseError) {
          throw new Error('Koneksi database gagal. Silakan coba lagi beberapa saat.');
        }
        throw new Error(result.error || 'Failed to create assignment');
      }

      // Handle offline mode success
      if (result.isOfflineMode) {
        toast.success(result.message || 'Tugas/Ujian berhasil dibuat (mode offline)');
        onSuccess(result.assignment);
        handleClose();
        return;
      }

      toast.success(
        `Tugas/Ujian berhasil dibuat untuk ${selectedClasses.length} kelas`
      );
      onSuccess(result.assignment);
      handleClose();
    } catch (error) {
      console.error("Error creating assignment:", error);

      // Handle specific error messages
      const errorMessage = error.message;
      if (errorMessage.includes('database') || errorMessage.includes('Database')) {
        toast.error("Gagal terhubung ke database. Silakan coba lagi atau hubungi admin.");
      } else if (errorMessage.includes('timeout')) {
        toast.error("Request timeout. Silakan coba lagi.");
      } else {
        toast.error(`Gagal membuat tugas/ujian: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedClasses([]);
    setClassQuotas({});
    onClose();
  };

  const groupedClasses = classes.reduce((acc, cls) => {
    if (!acc[cls.grade]) {
      acc[cls.grade] = [];
    }
    acc[cls.grade].push(cls);
    return acc;
  }, {} as Record<number, Class[]>);

  const learningGoalTemplates = [
    "Mampu memahami konsep dasar {subject}",
    "Mampu mengaplikasikan {subject} dalam kehidupan sehari-hari",
    "Mampu menganalisis permasalahan terkait {subject}",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignment ? "Edit Tugas/Ujian" : "Buat Tugas/Ujian Baru"}
          </DialogTitle>
          <DialogDescription>
            Minggu {currentWeekInfo.weekNumber} Tahun {currentWeekInfo.year} -
            Batas maksimal: {maxQuota} tugas/ujian per kelas per minggu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">📝 Informasi Dasar</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Judul Tugas/Ujian</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Masukkan judul"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Jenis</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setValue("type", value as "TUGAS" | "UJIAN")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TUGAS">Tugas</SelectItem>
                    <SelectItem value="UJIAN">Ujian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={(value) => setValue("subject", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {SMP_SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-sm text-red-500 mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <Label>Tenggat Waktu</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP", { locale: id }) : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => setValue("dueDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Deskripsi tambahan tentang tugas/ujian"
                rows={3}
              />
            </div>
          </div>

          {/* Learning Goal */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">🎯 Tujuan Pembelajaran</h3>
            </div>

            {selectedSubject && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Template:</Label>
                <div className="flex flex-wrap gap-2">
                  {learningGoalTemplates.map((template, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => useLearningGoalTemplate(template)}
                    >
                      Gunakan Template
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="learningGoal">Tujuan Pembelajaran</Label>
              <Textarea
                id="learningGoal"
                {...register("learningGoal")}
                placeholder="Tuliskan tujuan pembelajaran yang ingin dicapai"
                rows={3}
                className={errors.learningGoal ? "border-red-500" : ""}
              />
              {errors.learningGoal && (
                <p className="text-sm text-red-500 mt-1">{errors.learningGoal.message}</p>
              )}
            </div>
          </div>

          {/* Class Selection with Quota */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">👥 Pilih Kelas</h3>
              {isCheckingQuota && (
                <p className="text-sm text-muted-foreground">Memeriksa kuota...</p>
              )}
            </div>

            {Object.entries(groupedClasses)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([grade, gradeClasses]) => (
                <div key={grade} className="space-y-3">
                  <h4 className="font-medium">Kelas {grade}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {gradeClasses.map((cls) => {
                      const quotaStatus = getClassQuotaStatus(cls.id);
                      const isSelected = selectedClasses.includes(cls.id);

                      return (
                        <div
                          key={cls.id}
                          className={cn(
                            "p-3 border rounded-lg space-y-2",
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : quotaStatus.canSelect
                              ? "border-gray-200"
                              : "border-gray-100 bg-gray-50 opacity-60"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={cls.id}
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleClassToggle(cls.id, checked as boolean)
                              }
                              disabled={!quotaStatus.canSelect}
                            />
                            <Label
                              htmlFor={cls.id}
                              className={cn(
                                "text-sm font-medium cursor-pointer",
                                !quotaStatus.canSelect && "text-gray-500"
                              )}
                            >
                              {cls.id}
                            </Label>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                quotaStatus.status === "full"
                                  ? "destructive"
                                  : quotaStatus.status === "warning"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {quotaStatus.current}/{quotaStatus.remaining + quotaStatus.current} {assignmentType === 'TUGAS' ? 'tugas' : 'ujian'}
                            </Badge>
                            {quotaStatus.canSelect ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>

                          {quotaStatus.remaining === 0 && (
                            <p className="text-xs text-red-500">
                              Kuota penuh minggu ini
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {errors.selectedClasses && (
              <p className="text-sm text-red-500">{errors.selectedClasses.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedClasses.length === 0}
            >
              {isSubmitting
                ? "Menyimpan..."
                : assignment
                ? "Update Tugas/Ujian"
                : `Buat Tugas/Ujian (${selectedClasses.length} kelas)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

