"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings');
      }

      setSettings(data.settings || []);

      // Initialize form data
      const initialFormData: Record<string, string> = {};
      data.settings?.forEach((setting: Setting) => {
        initialFormData[setting.key] = setting.value;
      });
      setFormData(initialFormData);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value: formData[key],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save setting');
      }

      toast.success("Pengaturan berhasil disimpan");
      fetchSettings();
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      for (const [key, value] of Object.entries(formData)) {
        const response = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            value,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save setting');
        }
      }

      toast.success("Semua pengaturan berhasil disimpan");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  const getSettingType = (key: string): "number" | "text" | "textarea" => {
    if (key.includes("max") || key.includes("year") || key.includes("semester")) {
      return "number";
    }
    if (key.includes("message") || key.includes("template")) {
      return "textarea";
    }
    return "text";
  };

  const getSettingLabel = (key: string): string => {
    switch (key) {
      case "max_weekly_assignments":
        return "Batas Maksimal Tugas per Minggu";
      case "school_year":
        return "Tahun Ajaran";
      case "semester":
        return "Semester";
      case "default_assignment_message":
        return "Pesan Default Tugas";
      case "whatsapp_reminder_template":
        return "Template Reminder WhatsApp";
      case "grading_deadline_days":
        return "Batas Waktu Penilaian (Hari)";
      case "auto_reminder_enabled":
        return "Auto Reminder Aktif";
      default:
        return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan Sistem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Memuat pengaturan...</div>
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
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pengaturan Sistem
              </CardTitle>
              <CardDescription>
                Konfigurasi parameter sistem manajemen tugas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchSettings}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Menyimpan..." : "Simpan Semua"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Core Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Pengaturan Inti</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings
                .filter((setting) =>
                  ["max_weekly_assignments", "school_year", "semester"].includes(setting.key)
                )
                .map((setting) => {
                  const type = getSettingType(setting.key);
                  return (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {getSettingLabel(setting.key)}
                      </Label>
                      <Input
                        id={setting.key}
                        type={type}
                        value={formData[setting.key] || ""}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="w-full"
                      />
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Assignment Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Pengaturan Tugas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings
                .filter((setting) =>
                  ["grading_deadline_days", "auto_reminder_enabled"].includes(setting.key)
                )
                .map((setting) => {
                  const type = getSettingType(setting.key);
                  return (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {getSettingLabel(setting.key)}
                      </Label>
                      <Input
                        id={setting.key}
                        type={type}
                        value={formData[setting.key] || ""}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="w-full"
                      />
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Message Templates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Template Pesan</h3>

            {settings
              .filter((setting) =>
                setting.key.includes("message") || setting.key.includes("template")
              )
              .map((setting) => {
                const type = getSettingType(setting.key);
                return (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={setting.key}>
                        {getSettingLabel(setting.key)}
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSave(setting.key)}
                        disabled={saving}
                      >
                        Simpan
                      </Button>
                    </div>
                    {type === "textarea" ? (
                      <Textarea
                        id={setting.key}
                        value={formData[setting.key] || ""}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        rows={4}
                        className="w-full"
                      />
                    ) : (
                      <Input
                        id={setting.key}
                        type={type}
                        value={formData[setting.key] || ""}
                        onChange={(e) => handleInputChange(setting.key, e.target.value)}
                        className="w-full"
                      />
                    )}
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Informasi Sistem</h3>

            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Pengaturan:</span>
                    <span className="ml-2">{settings.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Terakhir Diperbarui:</span>
                    <span className="ml-2">
                      {settings.length > 0
                        ? new Date(
                            Math.max(...settings.map((s) => new Date(s.updatedAt).getTime()))
                          ).toLocaleString("id-ID")
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Environment:</span>
                    <Badge variant="outline" className="ml-2">
                      {process.env.NODE_ENV || "development"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Database:</span>
                    <Badge variant="outline" className="ml-2">
                      PostgreSQL
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Perhatian</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Perubahan pada pengaturan sistem dapat mempengaruhi cara kerja aplikasi.
                    Pastikan Anda memahami dampak dari setiap perubahan sebelum menyimpan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}