import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogIn, RefreshCw, Check, AlertCircle, X, Info } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/loading-overlay";
import { User } from "@/types";

interface AuthViewProps {
  mode: 'login' | 'register' | 'forgot-password';
  onNavigate: (view: 'landing' | 'login' | 'register' | 'forgot-password' | 'docs') => void;
  onSuccess: (user: User | null) => void;
}

export const AuthView = ({ mode, onNavigate, onSuccess }: AuthViewProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [pinError, setPinError] = useState<string | null>(null);
  
  // Captcha State
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  const [captchaInput, setCaptchaInput] = useState("");

  // Forgot Password State
  const [isPinVerified, setIsPinVerified] = useState(false);

  useEffect(() => {
    regenerateCaptcha();
  }, [mode]);

  const regenerateCaptcha = () => {
    setCaptcha({
      a: Math.floor(Math.random() * 99) + 1,
      b: Math.floor(Math.random() * 99) + 1
    });
    setCaptchaInput("");
  };

  const getPasswordUnmetRequirements = (pwd: string) => {
    const reqs = [];
    if (pwd.length < 6) reqs.push("Minimal 6 karakter");
    if (!/[A-Z]/.test(pwd)) reqs.push("Minimal 1 huruf besar (Uppercase)");
    if (!/[0-9]/.test(pwd)) reqs.push("Minimal 1 angka");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) reqs.push("Minimal 1 karakter spesial (!@#$%^&*(),.?)");
    return reqs;
  };

  const unmetRequirements = getPasswordUnmetRequirements(password);

  const validatePin = (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return "PIN harus 6 angka.";
    if (/^(\d)\1+$/.test(pin)) return "PIN tidak boleh angka kembar semua (contoh: 000000).";
    
    const sequential = "01234567890123456789";
    const reverseSequential = "98765432109876543210";
    
    if (sequential.includes(pin)) return "PIN tidak boleh berurutan (contoh: 123456).";
    if (reverseSequential.includes(pin)) return "PIN tidak boleh berurutan mundur (contoh: 654321).";
    
    return null;
  };

  const handleVerifyPin = async () => {
    if (!email || !pin) {
      toast.warning("Email dan PIN wajib diisi");
      return;
    }
    if (parseInt(captchaInput) !== captcha.a + captcha.b) {
      toast.error("Captcha Salah", { description: "Silakan hitung ulang penjumlahan." });
      return;
    }

    setLoadingMessages(["Memverifikasi PIN...", "Mengecek keamanan...", "Mohon tunggu..."]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsPinVerified(true);
        toast.success("PIN Benar", { description: "Silakan masukkan password baru." });
        regenerateCaptcha();
      } else {
        toast.error("Verifikasi Gagal", { description: data.message });
        regenerateCaptcha();
      }
    } catch (error) {
      toast.error("Error", { description: "Terjadi kesalahan koneksi." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(captchaInput) !== captcha.a + captcha.b) {
      toast.error("Captcha Salah", { description: "Silakan hitung ulang penjumlahan." });
      regenerateCaptcha();
      return;
    }

    setLoadingMessages(["Mereset Password...", "Mengupdate keamanan akun...", "Menyimpan perubahan..."]);
    setIsLoading(true);
    try {
      // STEP 2: Reset Password (Final)
      if (password !== confirmPassword) {
        toast.error("Password Tidak Sama");
        setIsLoading(false);
        return;
      }
      if (unmetRequirements.length > 0) {
        toast.error("Password Belum Aman", { description: "Penuhi semua kriteria password." });
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, newPassword: password }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success("Password Berhasil Direset", { description: "Silakan login dengan password baru." });
        onNavigate('login');
      } else {
        toast.error("Gagal Reset Password", { description: data.message });
      }
    } catch (error) {
      toast.error("Error", { description: "Terjadi kesalahan koneksi." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Captcha
    if (parseInt(captchaInput) !== captcha.a + captcha.b) {
      toast.error("Captcha Salah", { description: "Silakan hitung ulang penjumlahan." });
      regenerateCaptcha();
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        toast.error("Konfirmasi Password Tidak Cocok");
        return;
      }
      if (unmetRequirements.length > 0) {
        toast.error("Password Belum Aman", { description: "Mohon penuhi kriteria password." });
        return;
      }

      const error = validatePin(pin);
      if (error) {
        setPinError(error);
        return;
      }
    }
    setPinError(null);

    if (mode === 'login') {
      setLoadingMessages(["Sedang Masuk...", "Memverifikasi kredensial...", "Mengambil data user..."]);
    } else {
      setLoadingMessages(["Mendaftarkan Akun...", "Membuat profil user...", "Menyiapkan database..."]);
    }
    setIsLoading(true);
    
    const endpoint = mode === 'login' ? '/api/login' : '/api/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, pin: mode === 'register' ? pin : undefined }),
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server Error (${res.status})`);
      }

      const data = await res.json();
      
      if (res.ok && data.status === 'success') {
        if (mode === 'login') {
          onSuccess(data.user);
        } else {
          toast.success("Registrasi Berhasil!", { description: "Silakan login dengan akun baru Anda." });
          onNavigate('login');
        }
      } else {
        toast.error(`${mode === 'login' ? 'Login' : 'Registrasi'} Gagal`, { description: data.message });
      }
    } catch (error) {
      console.error("Auth Error:", error);
      toast.error("Gagal", { description: error instanceof Error ? error.message : "Kesalahan Koneksi" });
    }
    setIsLoading(false);
  };

  const getTitle = () => {
    if (mode === 'login') return 'Login';
    if (mode === 'register') return 'Register';
    return 'Reset Password';
  };

  const getCaptchaLabel = () => {
    if (mode === 'login') return "Selesaikan captcha untuk Login";
    if (mode === 'register') return "Selesaikan captcha untuk Register";
    if (mode === 'forgot-password') {
      return isPinVerified 
        ? "Selesaikan captcha untuk reset password" 
        : "Harap selesaikan captcha untuk check pin";
    }
    return "Captcha Keamanan";
  };

  return (
    <>
      {isLoading && <LoadingOverlay messages={loadingMessages} />}
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="icon" onClick={() => onNavigate('landing')} className="-ml-3 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <CardTitle className="text-2xl font-bold capitalize">{getTitle()}</CardTitle>
            </div>
            <CardDescription>
              {mode === 'login' && "Masuk untuk mengelola keuangan Anda."}
              {mode === 'register' && "Buat akun baru untuk mulai menggunakan Money Tracker."}
              {mode === 'forgot-password' && "Reset password Anda menggunakan PIN keamanan."}
              {(mode === 'register') && (
                <button onClick={() => onNavigate('docs')} className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center justify-center gap-1 mx-auto transition-colors pt-2">
                  <Info className="h-3 w-3" /> Wajib Baca: Panduan Setup Database & Script
                </button>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <form onSubmit={mode === 'forgot-password' ? handleForgotSubmit : handleSubmit} className="space-y-3">
              
              {/* EMAIL INPUT (Always Visible except Step 2 Forgot) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="nama@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={mode === 'forgot-password' && isPinVerified} />
              </div>

              {/* PASSWORD INPUT (Login, Register, Forgot Step 2) */}
              {(mode === 'login' || mode === 'register' || (mode === 'forgot-password' && isPinVerified)) && (
              <div className="space-y-2">
                <Label htmlFor="password">{mode === 'forgot-password' ? 'Password Baru' : 'Password'}</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                
                {/* Password Requirements (Register & Forgot Step 2) */}
                {(mode === 'register' || (mode === 'forgot-password' && isPinVerified)) && unmetRequirements.length > 0 && password.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Syarat Password:</p>
                    <ul className="text-[10px] text-amber-700 dark:text-amber-300 list-disc pl-4 space-y-0.5">
                      {unmetRequirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              )}

              {/* CONFIRM PASSWORD (Register & Forgot Step 2) */}
              {(mode === 'register' || (mode === 'forgot-password' && isPinVerified)) && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    required 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className={confirmPassword && password !== confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Password tidak cocok.</p>
                  )}
                </div>
              )}

              {/* PIN INPUT (Register & Forgot Step 1) */}
              {(mode === 'register' || mode === 'forgot-password') && (
                <div className="space-y-2">
                  <Label htmlFor="pin">{mode === 'forgot-password' ? 'Masukkan PIN Keamanan' : 'Buat PIN Keamanan (6 Angka)'}</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="pin" 
                      type={mode === 'forgot-password' && isPinVerified ? "password" : "text"}
                      inputMode="numeric"
                      maxLength={6} 
                      placeholder="123xxx" 
                      required 
                      value={pin} 
                      onChange={(e) => { setPin(e.target.value.replace(/[^0-9]/g, '')); setPinError(null); }} 
                      disabled={mode === 'forgot-password' && isPinVerified}
                    />
                  </div>
                  {pinError ? (
                    <p className="text-xs text-red-500 pt-1">{pinError}</p>
                  ) : mode === 'register' ? (
                    <p className="text-[10px] text-slate-500">Digunakan untuk reset password. Jangan gunakan angka mudah ditebak.</p>
                  ) : null}
                </div>
              )}

              {/* CAPTCHA (All Modes) */}
              <div className="space-y-2">
                <Label>{getCaptchaLabel()}</Label>
                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
                  <div className="font-mono text-lg font-bold text-foreground select-none">
                    {captcha.a} + {captcha.b} =
                  </div>
                  <div className="relative w-24 flex-1">
                    <Input 
                      type="text"
                      inputMode="numeric"
                      className="pr-8 text-center font-bold" 
                      required 
                      value={captchaInput} 
                      onChange={(e) => setCaptchaInput(e.target.value.replace(/[^0-9]/g, ''))} 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      {captchaInput && (
                        parseInt(captchaInput) === captcha.a + captcha.b 
                        ? <Check className="h-4 w-4 text-green-500" /> 
                        : <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={regenerateCaptcha} title="Refresh Captcha">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Check PIN Button (Forgot Password Only) - Appears after Captcha is correct */}
              {mode === 'forgot-password' && !isPinVerified && captchaInput && parseInt(captchaInput) === captcha.a + captcha.b && (
                <Button 
                  type="button" 
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                  onClick={handleVerifyPin} 
                  disabled={isLoading}
                >
                  Cek PIN
                </Button>
              )}

              {(mode !== 'forgot-password' || isPinVerified) && (
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base" disabled={isLoading}>
                  {isLoading ? "Loading..." : mode === 'login' ? <><LogIn className="mr-2 h-4 w-4" /> Login</> : mode === 'register' ? "Register" : "Reset Password"}
                </Button>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 justify-center border-t pt-4 pb-4 bg-muted/50 rounded-b-xl">
            {mode === 'login' && (
              <>
                <Button variant="link" className="text-muted-foreground text-xs" onClick={() => onNavigate('forgot-password')}>
                  Lupa Password?
                </Button>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  Belum punya akun? 
                  <Button variant="link" className="text-primary font-semibold p-0 h-auto" onClick={() => onNavigate('register')}>Register</Button>
                </div>
              </>
            )}
            {mode === 'register' && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Sudah punya akun? 
                <Button variant="link" className="text-primary font-semibold p-0 h-auto" onClick={() => onNavigate('login')}>Login</Button>
              </div>
            )}
            {mode === 'forgot-password' && (
              <Button variant="link" className="text-muted-foreground text-sm" onClick={() => onNavigate('login')}>
                Kembali ke Login
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
};