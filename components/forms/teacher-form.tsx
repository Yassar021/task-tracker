"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { SMP_SUBJECTS, LEARNING_GOAL_TEMPLATES, validatePhoneNumber } from "@/lib/school-utils";
import type { Teacher } from "@/db/schema/school";

// Form validation schema
const teacherFormSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(10, "Nomor WhatsApp tidak valid"),
  subjects: z.array(z.string()).min(1, "Pilih minimal 1 mata pelajaran"),
  learningGoals: z.array(z.string()).default([]),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  teacher?: Teacher;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper function for adding learning goal template
const addLearningGoalTemplate = (
  template: string,
  subject: string,
  currentGoals: string[],
  setGoals: (goals: string[]) => void,
  setValue: (field: string, value: string[]) => void
) => {
  const goal = template.replace("{subject}", subject);
  if (!currentGoals.includes(goal)) {
    const newGoals = [...currentGoals, goal];
    setGoals(newGoals);
    setValue("learningGoals", newGoals);
  }
};

export function TeacherForm({ teacher, isOpen, onClose, onSuccess }: TeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(teacher?.subjects || []);
  const [learningGoals, setLearningGoals] = useState<string[]>(teacher?.learningGoals || []);
  const [newLearningGoal, setNewLearningGoal] = useState("");
  const [customSubject, setCustomSubject] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TeacherFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(teacherFormSchema) as any,
    defaultValues: {
      name: teacher?.name || "",
      email: teacher?.email || "",
      phone: teacher?.phone || "",
      subjects: teacher?.subjects || [],
      learningGoals: teacher?.learningGoals || [],
    },
  });

  const selectedSubjectsValue = watch("subjects");

  const handleSubjectToggle = (subject: string, checked: boolean) => {
    if (checked) {
      const newSubjects = [...selectedSubjects, subject];
      setSelectedSubjects(newSubjects);
      setValue("subjects", newSubjects);
    } else {
      const newSubjects = selectedSubjects.filter(s => s !== subject);
      setSelectedSubjects(newSubjects);
      setValue("subjects", newSubjects);
    }
  };

  const addCustomSubject = () => {
    if (customSubject.trim() && !selectedSubjects.includes(customSubject.trim())) {
      const newSubjects = [...selectedSubjects, customSubject.trim()];
      setSelectedSubjects(newSubjects);
      setValue("subjects", newSubjects);
      setCustomSubject("");
    }
  };

  const addLearningGoal = () => {
    if (newLearningGoal.trim() && !learningGoals.includes(newLearningGoal.trim())) {
      const newGoals = [...learningGoals, newLearningGoal.trim()];
      setLearningGoals(newGoals);
      setValue("learningGoals", newGoals);
      setNewLearningGoal("");
    }
  };

  const removeLearningGoal = (goal: string) => {
    const newGoals = learningGoals.filter(g => g !== goal);
    setLearningGoals(newGoals);
    setValue("learningGoals", newGoals);
  };

  
  const onSubmit = async (data: TeacherFormData) => {
    try {
      setIsSubmitting(true);

      // Validate phone number format
      if (!validatePhoneNumber(data.phone)) {
        toast.error("Format nomor WhatsApp tidak valid");
        return;
      }

      const payload = {
        ...data,
        subjects: selectedSubjects,
        learningGoals: learningGoals,
      };

      const url = teacher
        ? `/api/admin/teachers/${teacher.id}`
        : "/api/admin/teachers";
      const method = teacher ? "PUT" : "POST";

      // For now, we'll need to handle the user ID separately
      if (!teacher) {
        toast.error("Fitur tambah guru baru akan segera tersedia");
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menyimpan data guru");
      }

      const result = await response.json();
      toast.success(result.message || "Data guru berhasil disimpan");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedSubjects([]);
    setLearningGoals([]);
    setNewLearningGoal("");
    setCustomSubject("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {teacher ? "Edit Data Guru" : "Tambah Guru Baru"}
          </DialogTitle>
          <DialogDescription>
            {teacher
              ? "Perbarui informasi data guru dan mata pelajaran yang diampu."
              : "Tambahkan guru baru dengan data lengkap dan mata pelajaran yang diampu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Data Pribadi Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">👤 Data Pribadi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Masukkan nama lengkap"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="email@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="08123456789"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Mata Pelajaran Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">📚 Mata Pelajaran</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SMP_SUBJECTS.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject}
                    checked={selectedSubjects.includes(subject)}
                    onCheckedChange={(checked) =>
                      handleSubjectToggle(subject, checked as boolean)
                    }
                  />
                  <Label htmlFor={subject} className="text-sm">
                    {subject}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom Subject Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Tambah mata pelajaran custom"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSubject())}
              />
              <Button type="button" onClick={addCustomSubject} variant="outline">
                Tambah
              </Button>
            </div>

            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                    {subject}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleSubjectToggle(subject, false)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {errors.subjects && (
              <p className="text-sm text-red-500">{errors.subjects.message}</p>
            )}
          </div>

          {/* Tujuan Pembelajaran Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-medium">🎯 Tujuan Pembelajaran</h3>
            </div>

            {/* Template Suggestions */}
            {selectedSubjects.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Template Tujuan Pembelajaran:</Label>
                <div className="flex flex-wrap gap-2">
                  {LEARNING_GOAL_TEMPLATES.slice(0, 3).map((template, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => addLearningGoalTemplate(template, selectedSubjects[0], learningGoals, setLearningGoals, setValue as any)}
                    >
                      + {template.replace("{subject}", selectedSubjects[0])}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Goals List */}
            {learningGoals.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Daftar Tujuan Pembelajaran:</Label>
                <div className="space-y-2">
                  {learningGoals.map((goal, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm">{goal}</span>
                      <X
                        className="h-4 w-4 cursor-pointer text-red-500"
                        onClick={() => removeLearningGoal(goal)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Learning Goal */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Tambah tujuan pembelajaran baru"
                value={newLearningGoal}
                onChange={(e) => setNewLearningGoal(e.target.value)}
                className="min-h-[80px]"
              />
              <Button
                type="button"
                onClick={addLearningGoal}
                variant="outline"
                className="self-end"
              >
                Tambah
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Menyimpan..."
                : teacher
                ? "Update Data Guru"
                : "Tambah Guru"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}