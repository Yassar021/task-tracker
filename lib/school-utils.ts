
// Class configuration based on PRD
export const CLASS_NAMES = [
  "DISCIPLINE",
  "RESPECT",
  "RESILIENT",
  "COLLABORATIVE",
  "CREATIVE",
  "INDEPENDENT"
];

export const GRADES = [7, 8, 9];

// Generate all 18 class combinations
export function generateAllClasses(): Array<{ id: string; grade: number; name: string }> {
  const classes: Array<{ id: string; grade: number; name: string }> = [];

  GRADES.forEach(grade => {
    CLASS_NAMES.forEach(name => {
      classes.push({
        id: `${grade}-${name}`,
        grade,
        name,
      });
    });
  });

  return classes;
}

// Date and week utilities
export function getWeekNumber(date: Date = new Date()): number {
  // Use ISO week standard for consistency
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  // Calculate full weeks to nearest Thursday
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export function getCurrentWeekInfo(): { weekNumber: number; year: number } {
  const now = new Date();
  return {
    weekNumber: getWeekNumber(now),
    year: now.getFullYear(),
  };
}

export function getWeekStartEnd(weekNumber: number, year: number): { start: Date; end: Date } {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7;
  const startOfWeek = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);

  // Adjust to Monday (start of week)
  const dayOfWeek = startOfWeek.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  return { start: startOfWeek, end: endOfWeek };
}

// WhatsApp integration utilities
export function generateWhatsAppLink(phone: string, message: string): string {
  // Remove any non-digit characters from phone number
  const cleanPhone = phone.replace(/\D/g, '');

  // Remove leading 0 if present (Indonesia format)
  const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;

  // Add Indonesia country code if not present
  const phoneNumber = formattedPhone.startsWith('62') ? formattedPhone : `62${formattedPhone}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

export function generateReminderMessage(teacherName: string, assignmentDetails: {
  subject: string;
  learningGoal: string;
  className: string;
  createdDate: string;
}): string {
  return `Yth. Bapak/Ibu ${teacherName},

REMINDER PENILAIAN TUGAS
SMP YPS SINGKOLE

📚 Tugas/Ujian: ${assignmentDetails.subject}
🎯 Tujuan Pembelajaran: ${assignmentDetails.learningGoal}
👥 Kelas: ${assignmentDetails.className}
📅 Tanggal Dibuat: ${assignmentDetails.createdDate}

Tugas ini sudah melewati batas pengumpulan dan belum dinilai.

Mohon segera melakukan penilaian dan menginput nilai ke dalam Rapor Sementara.

Terima kasih,
Admin SMP YPS SINGKOLE`;
}

// Validation utilities
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^(?:\+62|62|08)[0-9]{8,13}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.startsWith('0')) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('62')) {
    return `0${cleanPhone.substring(2)}`;
  } else if (cleanPhone.startsWith('+62')) {
    return `0${cleanPhone.substring(3)}`;
  }

  return cleanPhone;
}

// Subject list for SMP (sesuai list-mapel.md)
export const SMP_SUBJECTS = [
  "AGAMA ISLAM",
  "AGAMA KRISTEN",
  "AGAMA KATOLIK",
  "AGAMA HINDU",
  "PENDIDIKAN AGAMA",
  "PANCASILA",
  "BAHASA INDONESIA",
  "MATEMATIKA",
  "IPA",
  "IPS",
  "BAHASA INGGRIS",
  "PJOK",
  "INFORMATIKA",
  "SENI, BUDAYA DAN PRAKARYA",
  "MANDARIN"
];

// Assignment status utilities
export const ASSIGNMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  GRADED: 'graded',
  CLOSED: 'closed'
} as const;

export function getAssignmentStatusColor(status: string): string {
  switch (status) {
    case ASSIGNMENT_STATUS.DRAFT:
      return 'bg-gray-100 text-gray-800';
    case ASSIGNMENT_STATUS.PUBLISHED:
      return 'bg-blue-100 text-blue-800';
    case ASSIGNMENT_STATUS.GRADED:
      return 'bg-green-100 text-green-800';
    case ASSIGNMENT_STATUS.CLOSED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getAssignmentStatusLabel(status: string): string {
  switch (status) {
    case ASSIGNMENT_STATUS.DRAFT:
      return 'Draft';
    case ASSIGNMENT_STATUS.PUBLISHED:
      return 'Diterbitkan';
    case ASSIGNMENT_STATUS.GRADED:
      return 'Sudah Dinilai';
    case ASSIGNMENT_STATUS.CLOSED:
      return 'Ditutup';
    default:
      return 'Tidak Diketahui';
  }
}

// Learning goal templates
export const LEARNING_GOAL_TEMPLATES = [
  "Mampu memahami konsep dasar {subject}",
  "Mampu mengaplikasikan {subject} dalam kehidupan sehari-hari",
  "Mampu menganalisis permasalahan terkait {subject}",
  "Mampu berkolaborasi dalam kelompok untuk menyelesaikan tugas {subject}",
  "Mampu berpikir kritis dalam menyelesaikan soal {subject}",
  "Mampu mengkomunikasikan hasil pembelajaran {subject}",
  "Mampu menggunakan teknologi dalam pembelajaran {subject}",
  "Mampu menunjukkan sikap disiplin dalam mengerjakan tugas {subject}",
];

export function generateLearningGoal(subject: string, templateIndex?: number): string {
  const template = templateIndex !== undefined
    ? LEARNING_GOAL_TEMPLATES[templateIndex]
    : LEARNING_GOAL_TEMPLATES[Math.floor(Math.random() * LEARNING_GOAL_TEMPLATES.length)];

  return template.replace('{subject}', subject);
}

// Search and filter utilities
export function filterBySearchTerm<T>(
  items: T[],
  searchTerm: string,
  searchableFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return items.filter(item =>
    searchableFields.some(field => {
      const value = item[field];
      return typeof value === 'string' &&
             value.toLowerCase().includes(lowerSearchTerm);
    })
  );
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Export utilities for reports
export function exportToCSV<T>(
  data: T[],
  filename: string,
  headers?: Partial<Record<keyof T, string>>
): void {
  if (data.length === 0) return;

  const csvHeaders = headers
    ? Object.values(headers).join(',')
    : Object.keys(data[0] as Record<string, unknown>).join(',');

  const csvRows = data.map(row =>
    Object.values(row as Record<string, unknown>)
      .map(value => `"${value}"`)
      .join(',')
  );

  const csvContent = [csvHeaders, ...csvRows].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}