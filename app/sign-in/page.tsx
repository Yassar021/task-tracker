"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "@/lib/auth-client";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const emailInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus email input on mount
    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Basic validation
        if (!email || !password) {
            toast.error("Mohon lengkapi email dan password", {
                description: "Semua field harus diisi",
                icon: <AlertCircle className="h-4 w-4" />,
            });
            setIsLoading(false);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Format email tidak valid", {
                description: "Masukkan email yang benar (contoh: user@example.com)",
                icon: <AlertCircle className="h-4 w-4" />,
            });
            setIsLoading(false);
            return;
        }

        try {
            // Show loading toast
            const loadingToast = toast.loading("Sedang masuk...", {
                description: "Memverifikasi kredensial Anda",
            });

            const result = await signIn.email({
                email,
                password,
            });

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            if (result.error) {
                // Handle specific error messages
                let errorMessage = "Sign in gagal";
                let errorDescription = "Terjadi kesalahan saat masuk";

                if (result.error.message?.toLowerCase().includes("invalid") ||
                    result.error.message?.toLowerCase().includes("wrong")) {
                    errorMessage = "Email atau password salah";
                    errorDescription = "Periksa kembali email dan password Anda";
                } else if (result.error.message?.toLowerCase().includes("not found")) {
                    errorMessage = "Akun tidak ditemukan";
                    errorDescription = "Email ini belum terdaftar dalam sistem";
                } else if (result.error.message?.toLowerCase().includes("blocked")) {
                    errorMessage = "Akun diblokir";
                    errorDescription = "Hubungi administrator untuk bantuan";
                } else if (result.error.message) {
                    errorDescription = result.error.message;
                }

                toast.error(errorMessage, {
                    description: errorDescription,
                    icon: <AlertCircle className="h-4 w-4" />,
                    duration: 5000,
                });
                setError(result.error.message || "Sign in failed");
            } else {
                // Success toast
                toast.success("Login berhasil!", {
                    description: "Selamat datang kembali di sistem YPS",
                    icon: <CheckCircle className="h-4 w-4" />,
                });

                // Small delay before redirect to show success message
                setTimeout(() => {
                    router.push("/dashboard");
                }, 500);
            }
        } catch (err) {
            toast.error("Terjadi kesalahan teknis", {
                description: "Silakan coba lagi beberapa saat",
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 5000,
            });
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Masuk</CardTitle>
                    <CardDescription>
                        Masukkan email dan password untuk mengakses sistem
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Masukkan email Anda"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="disabled:opacity-50"
                                ref={emailInputRef}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan password Anda"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="disabled:opacity-50 pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full transition-all duration-200 hover:scale-[1.02]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Masuk...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center">
                    <p className="text-sm text-muted-foreground">
                        Hubungi administrator untuk akses ke sistem
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}