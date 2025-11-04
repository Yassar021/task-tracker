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
} from "@/lib/school-utils";

// Define types locally to avoid importing schema with database connections
interface Class {
  id: string;
  grade: number;
  name: string;
  isActive: boolean;
}

// Form validation schema
const examFormSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  subject: z.string().min(1, "Mata pelajaran harus dipilih"),
  learningGoal: z.string().min(10, "Tujuan pembelajaran minimal 10 karakter"),
  examType: z.enum(["SUMATIF", "UTS", "UAS"]),
  selectedClasses: z.array(z.string()).min(1, "Pilih minimal 1 kelas"),
  examDate: z.date().min(new Date(), "Tanggal ujian tidak boleh di masa lalu"),
});

type ExamFormData = z.infer<typeof examFormSchema>;

interface ExamFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacherId: string;
}

// Helper function for adding learning goal template
const addLearningGoalTemplate = (
  template: string,
  subject: string,
  setValue: (field: string, value: string) => void
) => {
  const goal = template.replace("{subject}", subject);
  setValue("learningGoal", goal);
};

export function ExamForm({ isOpen, onClose, onSuccess, teacherId }: ExamFormProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentWeekInfo, setCurrentWeekInfo] = useState<{ weekNumber: number; year: number } | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classQuotas, setClassQuotas] = useState<Record<string, { used: number; max: number }>>({});

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      learningGoal: "",
      examType: "SUMATIF",
      selectedClasses: [],
      examDate: undefined,
    },
  });

  const selectedSubject = form.watch("subject");
  const examDate = form.watch("examDate");

  // Fetch classes and current week info on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesResponse, weekInfoResponse, settingsResponse] = await Promise.all([
          fetch('/api/classes'),
          fetch('/api/utils/week-info'),
          fetch('/api/settings'),
        ]);

        if (classesResponse.ok && weekInfoResponse.ok && settingsResponse.ok) {
          const [classesData, weekInfoData, settingsData] = await Promise.all([
            classesResponse.json(),
            weekInfoResponse.json(),
            settingsResponse.json(),
          ]);

          setClasses(classesData.classes);
          setCurrentWeekInfo(weekInfoData.weekInfo);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Check quota for selected classes
  useEffect(() => {
    if (selectedClasses.length > 0 && currentWeekInfo) {
      checkClassQuotas();
    }
  }, [selectedClasses, currentWeekInfo]);

  const checkClassQuotas = async () => {
    if (!currentWeekInfo) return;

    try {
      const response = await fetch('/api/assignments/check-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classIds: selectedClasses,
          weekNumber: currentWeekInfo.weekNumber,
          year: currentWeekInfo.year,
          assignmentType: 'UJIAN',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setClassQuotas(data.quotas);
      }
    } catch (error) {
      console.error("Error checking quotas:", error);
    }
  };

  const canSelectClass = (classId: string) => {
    const quota = classQuotas[classId];
    if (!quota) return true;
    return quota.used < quota.max;
  };

  const onSubmit = async (data: ExamFormData) => {
    try {
      setIsSubmitting(true);

      // Validate that all selected classes have available quota
      const invalidClasses = selectedClasses.filter(classId => !canSelectClass(classId));
      if (invalidClasses.length > 0) {
        toast.error(`Beberapa kelas sudah mencapai batas maksimal ujian minggu ini`);
        return;
      }

      const examPayload = {
        title: data.title,
        description: data.description,
        subject: data.subject,
        learningGoal: data.learningGoal,
        type: "UJIAN",
        examType: data.examType,
        weekNumber: currentWeekInfo?.weekNumber || 1,
        year: currentWeekInfo?.year || new Date().getFullYear(),
        teacherId,
        examDate: data.examDate,
        status: "published" as const,
      };

      // Create exam via API
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...examPayload,
          assignedClasses: selectedClasses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create exam');
      }

      toast.success("Ujian berhasil dijadwalkan!");
      form.reset();
      setSelectedClasses([]);
      onSuccess();
    } catch (error) {
      console.error("Error creating exam:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menjadwalkan ujian");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const getQuotaColor = (classId: string) => {
    if (!canSelectClass(classId)) return "text-red-600 border-red-200";
    const quota = classQuotas[classId];
    if (!quota) return "text-green-600 border-green-200";
    const percentage = (quota.used / quota.max) * 100;
    if (percentage >= 75) return "text-orange-600 border-orange-200";
    return "text-green-600 border-green-200";
  };

  const getQuotaText = (classId: string) => {
    const quota = classQuotas[classId];
    if (!quota) return "0/2";
    return `${quota.used}/${quota.max}`;
  };

  const learningGoalTemplates = selectedSubject ? [
    `Siswa dapat memahami konsep dasar ${selectedSubject.toLowerCase()}`,
    `Siswa dapat menerapkan teori ${selectedSubject.toLowerCase()} dalam soal`,
    `Siswa dapat menganalisis masalah ${selectedSubject.toLowerCase()}`,
  ] : [];

  
  if (!isOpen) return null;

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-medium">📝 Informasi Dasar Ujian</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Judul Ujian</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Masukkan judul ujian"
                className={form.formState.errors.title ? "border-red-500" : ""}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="examType">Jenis Ujian</Label>
              <Select value={form.watch("examType")} onValueChange={(value) => form.setValue("examType", value as "SUMATIF" | "UTS" | "UAS")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis ujian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUMATIF">SUMATIF</SelectItem>
                  <SelectItem value="UTS">UTS</SelectItem>
                  <SelectItem value="UAS">UAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Mata Pelajaran</Label>
            <Select value={form.watch("subject")} onValueChange={(value) => form.setValue("subject", value)}>
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
            {form.formState.errors.subject && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="examDate">Tanggal Ujian</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !examDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {examDate ? format(examDate, "PPP", { locale: id }) : "Pilih tanggal ujian"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={examDate}
                  onSelect={(date) => date && form.setValue("examDate", date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.examDate && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.examDate.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Deskripsi tambahan tentang ujian"
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => addLearningGoalTemplate(template, selectedSubject, form.setValue as any)}
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
              {...form.register("learningGoal")}
              placeholder="Jelaskan tujuan pembelajaran yang ingin dicapai"
              rows={3}
              className={form.formState.errors.learningGoal ? "border-red-500" : ""}
            />
            {form.formState.errors.learningGoal && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.learningGoal.message}</p>
            )}
          </div>
        </div>

        {/* Class Selection */}
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-lg font-medium">👥 Pilih Kelas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((classItem) => {
              const isSelected = selectedClasses.includes(classItem.id);
              const canSelect = canSelectClass(classItem.id);

              return (
                <div
                  key={classItem.id}
                  className={cn(
                    "flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors",
                    isSelected ? "bg-primary/10 border-primary" : "hover:bg-gray-50",
                    !canSelect && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => canSelect && handleClassToggle(classItem.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    disabled={!canSelect}
                    onChange={() => {}}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{classItem.id}</div>
                    <div className="text-sm text-muted-foreground">{classItem.name}</div>
                    <div className={`text-xs ${getQuotaColor(classItem.id)}`}>
                      Kuota ujian: {getQuotaText(classItem.id)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedClasses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Label className="text-sm font-medium">Kelas dipilih:</Label>
              {selectedClasses.map((classId) => (
                <Badge key={classId} variant="secondary">
                  {classId}
                </Badge>
              ))}
            </div>
          )}

          {form.formState.errors.selectedClasses && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.selectedClasses.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting || selectedClasses.length === 0}>
            {isSubmitting ? "Menyimpan..." : "Jadwalkan Ujian"}
          </Button>
        </div>
      </form>
    </div>
  );
}