"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn as supabaseSignIn, getCurrentUser } from "@/lib/client-auth";
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
    const [user, setUser] = useState<any | null>(null);

    // Redirect if already logged in
    useEffect(() => {
        const checkExistingSession = async () => {
            // Check Supabase session
            try {
                const user = await getCurrentUser();
                if (user) {
                    router.replace("/admin");
                }
            } catch (error) {
                // No session, continue with login flow
            }
        };

        checkExistingSession();
    }, [router]);

    // Auto-focus email input on mount
    useEffect(() => {
        emailInputRef.current?.focus();
    }, []);

    // Show loading while checking session
    if (isLoading && user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Memeriksa sesi...</p>
                </div>
            </div>
        );
    }

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

            // Use Supabase auth
            const result = await supabaseSignIn(email, password);

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            if (result.success) {
                // Check if user is admin
                const isAdmin = result.user?.isAdmin;

                if (!isAdmin) {
                    toast.error("Akses ditolak", {
                        description: "Anda tidak memiliki akses administrator",
                        icon: <AlertCircle className="h-4 w-4" />,
                        duration: 5000,
                    });
                    setError("Admin access required");
                    return;
                }

                // Success toast
                toast.success("Login berhasil!", {
                    description: `Selamat datang kembali, ${result.user?.name || 'Admin'}`,
                    icon: <CheckCircle className="h-4 w-4" />,
                });

                // Wait a moment for session to be established, then redirect to admin
                setTimeout(() => {
                    router.push("/admin");
                }, 1000);
            } else {
                toast.error("Login gagal", {
                    description: result.error || "Terjadi kesalahan saat masuk",
                    icon: <AlertCircle className="h-4 w-4" />,
                    duration: 5000,
                });
                setError(result.error || "Login failed");
            }
        } catch (err: unknown) {
            toast.error("Terjadi kesalahan teknis", {
                description: err instanceof Error ? err.message : "Silakan coba lagi beberapa saat",
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 5000,
            });
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
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