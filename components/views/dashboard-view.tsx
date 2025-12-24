import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowUpCircle, ArrowDownCircle, CheckCircle, FileImage, ScrollText, Eye, Pencil, Trash2, Loader2, Filter, X, Copy, Home, Shield, LogOut } from 'lucide-react';
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { LoadingOverlay } from "@/components/loading-overlay";
import { DatabaseSelector } from "@/components/dashboard/database-selector";
import { formatRupiah, formatFullTimestamp, toBase64 } from "@/lib/utils";
import { User, DbInfo, Summary, Transaction, LogItem } from "@/types";

interface DashboardViewProps {
  user: User;
  initialDb: DbInfo;
  onLogout: () => void;
  
  onUpdateUser?: (user: User) => void;
  isViewer?: boolean;
  isSuperAdmin?: boolean;
  onSuperAdminClick?: () => void;
  onNavigateToDocs?: () => void;
}

// Helper untuk convert Google Drive Link ke Direct Image
const getDirectImageUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=s2000`;
    }
  }
  return url;
};
 
export const DashboardView = ({ user, initialDb, onLogout, onUpdateUser, isViewer = false, isSuperAdmin = false, onSuperAdminClick, onNavigateToDocs = () => {} }: DashboardViewProps) => {
  const router = useRouter();
  const [selectedDb, setSelectedDb] = useState<DbInfo>(initialDb);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [pendingSuccessToast, setPendingSuccessToast] = useState<string | null>(null);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  
  // Form States 
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterDesc, setFilterDesc] = useState<string>("ALL");
 
  // UI States
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Edit States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDisplayAmount, setEditDisplayAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmountError, setEditAmountError] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  // Delete States
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const fetchDashboardData = async (scriptUrl: string) => {
    try {
      const [summaryRes, transRes] = await Promise.all([
        fetch('/api/get-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptUrl }),
        }),
        fetch('/api/get-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scriptUrl }),
        })
      ]);
      
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.status === 'success') setSummary(summaryData.data);
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        if (transData.status === 'success') {
          const mappedData = transData.data.map((item: any) => ({
            ...item,
            amount: String(item.amount),
            image_url: item['image url'] || item['Image URL'] || item.image_url || ''
          }));
          setTransactions(mappedData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast.error("Gagal Memuat Ulang Data");
    }
  };

  useEffect(() => {
    if (selectedDb?.scriptUrl) {
      const loadData = async () => {
        setLoadingMessages(["Memuat Data...", "Sinkronisasi dengan server...", "Mohon tunggu..."]);
        setIsLoading(true);
        await fetchDashboardData(selectedDb.scriptUrl);
        setIsLoading(false);
      };
      loadData();
    }
  }, [selectedDb]);

  // Effect untuk menampilkan toast setelah loading selesai
  useEffect(() => {
    if (!isLoading && pendingSuccessToast) {
      toast.success(pendingSuccessToast);
      setPendingSuccessToast(null);
    }
  }, [isLoading, pendingSuccessToast]);

  const handleUpdateDatabases = async (newDatabases: DbInfo[], newSelection?: DbInfo) => {
    setIsLoading(true);
    setLoadingMessages(["Menyimpan Database...", "Mohon tunggu sebentar..."]);
    try {
      // Menggunakan endpoint update-user (pastikan route ini ada/dibuat di backend Next.js Anda)
      const res = await fetch('/api/user/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          updates: { databases: newDatabases }
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        const updatedUser = data.user ? data.user : { ...user, databases: newDatabases };
        if (onUpdateUser) onUpdateUser(updatedUser);
        
        // Gunakan updatedUser.databases (dari server) agar token terbaru terbaca
        let nextDb = null;
        if (newSelection) {
          // Cari DB baru di list yang sudah diupdate server
          nextDb = updatedUser.databases.find((d: DbInfo) => d.name === newSelection.name && d.scriptUrl === newSelection.scriptUrl);
        } else {
          // Cek apakah DB yang sedang dipilih masih ada
          nextDb = updatedUser.databases.find((d: DbInfo) => d.name === selectedDb.name);
          if (!nextDb && updatedUser.databases.length > 0) {
            nextDb = updatedUser.databases[0];
          }
        }
        
        if (nextDb) {
          setSelectedDb(nextDb); // Ini akan memicu useEffect fetchDashboardData -> isLoading(true)
          setPendingSuccessToast("Database berhasil disimpan");
          // Jangan set isLoading(false) disini, biarkan useEffect fetchDashboardData yang mengaturnya
          // agar loading tidak putus-nyambung
        }
      } else {
        throw new Error(data.message || "Gagal update database");
      }
    } catch (error) {
      console.error("Update DB Error:", error);
      setIsLoading(false);
      setTimeout(() => toast.error("Gagal menyimpan database", { 
        description: error instanceof Error ? error.message : "Pastikan koneksi internet lancar." 
      }), 100);
      throw error; // PENTING: Re-throw error agar DatabaseSelector tahu proses gagal dan tidak menutup modal
    }
  };

  // 1. Smart Filter Logic: Cari kata kunci yang muncul lebih dari sekali
  const smartFilterKeywords = useMemo(() => {
    const wordCounts: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (!t.description) return;
      // Pecah deskripsi menjadi kata-kata, lowercase, dan ambil kata yang panjangnya > 2 (untuk hindari "di", "ke", dll)
      const words = t.description.toLowerCase().split(/\s+/);
      const uniqueWordsInDesc = new Set(words); // Hindari hitung kata sama dalam 1 deskripsi
      
      uniqueWordsInDesc.forEach(word => {
        if (word.length > 2) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    // Ambil kata yang muncul lebih dari 1 kali
    return Object.keys(wordCounts)
      .filter(word => wordCounts[word] > 1)
      .sort();
  }, [transactions]);

  // 2. Filter transaksi berdasarkan kata kunci pilihan user
  const filteredTransactions = useMemo(() => {
    if (filterDesc === "ALL") return transactions;
    
    return transactions.filter(t => 
      t.description && t.description.toLowerCase().includes(filterDesc.toLowerCase())
    );
  }, [transactions, filterDesc]);

  // 3. Hitung ulang summary secara real-time berdasarkan data yang difilter
  const displayedSummary = useMemo(() => {
    if (filterDesc === "ALL") return summary;

    return filteredTransactions.reduce((acc, curr) => {
      const val = parseFloat(curr.amount);
      if (val > 0) {
        acc.income += val;
      } else {
        acc.expense += Math.abs(val);
      }
      acc.balance += val;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [summary, filteredTransactions, filterDesc]);

  const getGreeting = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const gmt7Time = new Date(utc + (3600000 * 7));
    const hour = gmt7Time.getHours();

    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const getUsername = (email: string) => {
    if (isViewer) return "Viewer";
    if (!email) return "user";
    const localPart = email.split('@')[0];
    const parts = localPart.split(/[^a-zA-Z0-9]/).filter(Boolean);
    if (parts.length === 0) return localPart.toLowerCase();
    // Cari kata terpanjang
    return parts.reduce((a, b) => a.length > b.length ? a : b, "").toLowerCase();
  };

  const handleCopyToken = () => {
    if (selectedDb?.token) {
      navigator.clipboard.writeText(selectedDb.token);
      toast.success("Token disalin ke clipboard");
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const value = e.target.value;
    const currentSign = (isEdit ? editAmount : amount).startsWith('-') ? '-' : '+';
    
    if (!value) {
      if (isEdit) {
        setEditAmount(currentSign);
        setEditDisplayAmount(currentSign + " ");
        setEditAmountError(null);
      } else {
        setAmount(currentSign);
        setDisplayAmount(currentSign + " ");
        setAmountError(null);
      }
      return;
    }

    const lastPlus = value.lastIndexOf('+');
    const lastMinus = value.lastIndexOf('-');
    const sign = lastPlus > lastMinus ? '+' : lastMinus > -1 ? '-' : '';
    const numbers = value.replace(/[^0-9]/g, '');

    if (!sign) {
      const msg = "Harap masukkan + untuk income atau - untuk pengeluaran.";
      if (isEdit) setEditAmountError(msg); else setAmountError(msg);
      return;
    }

    if (isEdit) {
      setEditAmountError(null);
      setEditAmount(sign + numbers);
      const formatted = numbers ? new Intl.NumberFormat('id-ID').format(Number(numbers)) : '';
      setEditDisplayAmount(numbers ? `${sign} Rp ${formatted}` : `${sign} `);
    } else {
      setAmountError(null);
      setAmount(sign + numbers);
      const formatted = numbers ? new Intl.NumberFormat('id-ID').format(Number(numbers)) : '';
      setDisplayAmount(numbers ? `${sign} Rp ${formatted}` : `${sign} `);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDb?.scriptUrl || !imageFile) {
      toast.warning("Data tidak lengkap", { description: "Mohon lengkapi jumlah, keterangan, dan gambar bukti." });
      return;
    }
    
    setLoadingMessages(amount.includes('-') ? ["Menyimpan Pengeluaran...", "Mengupload bukti transaksi...", "Mengupdate saldo..."] : ["Menyimpan Pemasukan...", "Mengupload bukti transaksi...", "Mengupdate saldo..."]);
    setIsLoading(true);

    try {
      const base64Image = await toBase64(imageFile);
      const cleanBase64 = base64Image.split(',')[1]; 

      const res = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl: selectedDb.scriptUrl,
          amount: amount,
          description: desc,
          imageBase64: cleanBase64,
          mimeType: imageFile.type
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        await fetchDashboardData(selectedDb.scriptUrl);
        toast.success("Transaksi Berhasil Disimpan!");
        setAmount("");
        setDisplayAmount("");
        setDesc("");
        
        // Reset filter jika user menambah transaksi baru agar terlihat
        if (filterDesc !== "ALL") {
          setFilterDesc("ALL");
        }
        setImageFile(null);
      } else {
        throw new Error(data.message || "Gagal menyimpan.");
      }
    } catch (error) {
      console.error("Transaction Error:", error);
      toast.error("Gagal Menyimpan Transaksi", { description: error instanceof Error ? error.message : "Unknown Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (t: Transaction) => {
    setEditData(t);
    setEditDesc(t.description);
    setEditImageFile(null);
    
    const rawAmount = String(t.amount);
    const sign = rawAmount.includes('-') ? '-' : '+';
    const numbers = rawAmount.replace(/[^0-9]/g, '');
    const formatted = numbers ? new Intl.NumberFormat('id-ID').format(Number(numbers)) : '';
    
    setEditAmount(rawAmount);
    setEditDisplayAmount(`${sign} Rp ${formatted}`);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDb?.scriptUrl || !editData) return;
    
    setLoadingMessages(["Mengupdate Transaksi...", "Menyimpan perubahan...", "Sinkronisasi data..."]);
    setIsLoading(true);
    try {
      let cleanBase64 = "";
      let mimeType = "";

      if (editImageFile) {
        const base64Image = await toBase64(editImageFile);
        cleanBase64 = base64Image.split(',')[1];
        mimeType = editImageFile.type;
      }

      const res = await fetch('/api/edit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl: selectedDb.scriptUrl,
          rowIndex: editData.rowIndex,
          amount: editAmount,
          description: editDesc,
          imageBase64: cleanBase64,
          mimeType: mimeType
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        await fetchDashboardData(selectedDb.scriptUrl);
        toast.success("Transaksi Berhasil Diupdate!");
        setIsEditOpen(false);
      } else {
        throw new Error(data.message || "Gagal mengupdate.");
      }
    } catch (error) {
      console.error("Edit Error:", error);
      toast.error("Gagal Update", { description: error instanceof Error ? error.message : "Unknown Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const executeDeleteTransaction = async () => {
    if (deleteTargetIndex === null || !selectedDb?.scriptUrl) return;
    
    setLoadingMessages(["Menghapus Transaksi...", "Membersihkan data...", "Mengupdate saldo..."]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/delete-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptUrl: selectedDb.scriptUrl,
          rowIndex: deleteTargetIndex
        }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        await fetchDashboardData(selectedDb.scriptUrl);
        toast.success("Transaksi Berhasil Dihapus!");
      } else {
        throw new Error(data.message || "Gagal menghapus.");
      }
    } catch (error) {
      console.error("Delete Error:", error);
      let errorMessage = error instanceof Error ? error.message : "Unknown Error";
      if (errorMessage.includes("Action tidak valid")) {
        errorMessage = "Script belum update. Lakukan 'New Deployment' di Google Sheets.";
      }
      toast.error("Gagal Hapus", { description: errorMessage });
    } finally {
      setIsLoading(false);
      setIsDeleteAlertOpen(false);
    }
  };

  const handleOpenLogs = async () => {
    setIsLogsOpen(true);
    if (!selectedDb?.scriptUrl) return;
    setLoadingMessages(["Memuat Logs...", "Mengambil riwayat aktivitas...", "Mohon tunggu..."]);
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: selectedDb.scriptUrl }),
      });
      const data = await res.json();
      if (data.status === 'success') setLogs(data.data);
    } catch (error) {
      console.error("Logs Error:", error);
      toast.error("Gagal memuat logs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        if (file.size > 3 * 1024 * 1024) { // Limit 3MB
           toast.error("File terlalu besar", { description: "Maksimal ukuran gambar adalah 3MB agar proses cepat." });
           return;
        }
        setImageFile(file);
      }
      else toast.error("File tidak valid", { description: "Harap upload file gambar." });
      e.dataTransfer.clearData();
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay messages={loadingMessages} />}
      <div className="min-h-screen bg-background p-2 sm:p-4 font-sans transition-colors duration-300">
        <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="relative flex flex-col bg-card/90 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-lg border border-border/50 gap-3">
            {/* Decorative Element */}
            <div className="absolute inset-0 overflow-hidden rounded-xl -z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
            </div>
            
            <div className="flex items-start gap-3 w-full">
              {/* Icon Section */}
              <div className="flex items-center gap-2 shrink-0 pt-1">
                <Button variant="ghost" size="icon" onClick={() => isViewer && router.push('/')} className="shrink-0">
                  <Home className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="h-10 w-10 bg-linear-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center shadow-sm border border-primary/10 shrink-0">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Main Content Section */}
              <div className="flex flex-col flex-1 min-w-0 gap-2">
                {/* Top Row: Greeting */}
                <div className="flex items-center gap-2">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {getGreeting()}, <span className="text-foreground font-bold">{getUsername(user.email)}</span>!
                    </div>
                    {isSuperAdmin && (
                      <Button variant="outline" onClick={onSuperAdminClick} className="h-5 px-2 text-[10px] font-bold text-purple-600 border-purple-200 bg-purple-50/50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/40 shrink-0">
                        <Shield className="h-3 w-3 mr-1" /> Super Admin
                      </Button>
                    )}
                </div>

                {/* Bottom Row: Controls */}
                <div className="flex items-center gap-2 w-full">
                  {!isViewer ? (
                      <>
                          <div className="shrink-0">
                              <DatabaseSelector 
                                  databases={user.databases || []}
                                  selectedDb={selectedDb}
                                  onSelect={setSelectedDb}
                                  onUpdateDatabases={handleUpdateDatabases}
                                  onNavigateToDocs={onNavigateToDocs}
                              />
                          </div>
                          {selectedDb.token && (
                              <div className="flex items-center gap-1.5 bg-background/50 border px-2 py-1 rounded-lg shadow-sm h-9 shrink-0 max-w-25 sm:max-w-none overflow-hidden">
                                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Token:</span>
                                  <span className="text-xs font-mono font-bold text-foreground truncate">{selectedDb.token}</span>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary shrink-0" onClick={handleCopyToken} title="Copy Token">
                                      <Copy className="h-3 w-3" />
                                  </Button>
                              </div>
                          )}
                      </>
                  ) : (
                      <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">{selectedDb.name} (Read Only)</span>
                  )}
                </div>

                {/* Logout Button Row */}
                {!isViewer && (
                  <div className="flex justify-end w-full">
                    <Button variant="ghost" size="sm" onClick={onLogout} className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors px-2">
                        <LogOut className="h-3.5 w-3.5 mr-1.5" /> Logout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Card className="col-span-2 md:col-span-1 shadow-sm bg-linear-to-br from-primary/10 via-card to-card border-primary/20 dark:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-1.5 pb-1">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Saldo</CardTitle>
                <Wallet className="h-3.5 w-3.5 text-primary" />
              </CardHeader>
              <CardContent className="px-3 py-1.5 pt-0">
                <div className="text-lg sm:text-xl font-bold text-primary truncate leading-none tracking-tight">{formatRupiah(displayedSummary.balance)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm bg-linear-to-br from-green-500/5 via-card to-card border-green-200/50 dark:border-green-900/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-1.5 pb-1">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pemasukan</CardTitle>
                <ArrowUpCircle className="h-3.5 w-3.5 text-green-500" />
              </CardHeader>
              <CardContent className="px-3 py-1.5 pt-0">
                <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 truncate leading-none tracking-tight">{formatRupiah(displayedSummary.income)}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm bg-linear-to-br from-red-500/5 via-card to-card border-red-200/50 dark:border-red-900/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-1.5 pb-1">
                <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pengeluaran</CardTitle>
                <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
              </CardHeader>
              <CardContent className="px-3 py-1.5 pt-0">
                <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 truncate leading-none tracking-tight">{formatRupiah(displayedSummary.expense)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Form Input */}
          {!isViewer && (
          <Card className="shadow-md border-t-4 border-t-primary bg-card/80 backdrop-blur-sm">
            <CardHeader className="px-3 py-2 pb-0">
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground/80">Input Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="px-3 py-2 pt-2">
              <form onSubmit={handleTransactionSubmit} className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground">Jumlah (+/- Rp)</Label>
                  <Input id="amount" type="text" placeholder="+ Rp 50.000" required value={displayAmount} onChange={(e) => handleAmountChange(e, false)} className="h-9 text-base font-medium bg-background/50" />
                  {amountError && <p className="text-xs text-red-500 pt-1">{amountError}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground">Keterangan</Label>
                  <Input id="description" placeholder="Contoh: Gaji Bulanan / Beli Kopi" required value={desc} onChange={e => setDesc(e.target.value)} className="h-9 text-sm bg-background/50" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">Bukti Transfer (Gambar)</Label>
                  <div 
                    onDrop={handleFileDrop}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    className={`border-2 border-dashed rounded-lg p-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative h-14 ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/20 hover:bg-accent/50 hover:border-primary/50'}`}
                  >
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${isDragging ? 'pointer-events-none' : ''}`} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size > 3 * 1024 * 1024) {
                          toast.error("File terlalu besar", { description: "Maksimal 3MB." });
                          e.target.value = ""; // Reset input
                        } else {
                          setImageFile(file || null);
                        }
                      }} 
                    />
                    {imageFile ? (
                      <div className="flex items-center text-green-600 gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium text-xs sm:text-sm truncate max-w-40 sm:max-w-full">{imageFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center pointer-events-none">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileImage className="h-4 w-4" />
                          <span className="text-xs font-medium">Upload Gambar</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-bold shadow-sm" disabled={isLoading}>Simpan Transaksi</Button>
              </form>
            </CardContent>
          </Card>
          )}

          {/* Transaction List */}
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-2 pb-2 border-b">
              <div className="flex items-center gap-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground/80">Riwayat Transaksi</CardTitle>
                {/* Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <Select value={filterDesc} onValueChange={setFilterDesc}>
                    <SelectTrigger className="w-36 h-8 text-xs bg-background/50 border-input/50">
                      <Filter className="w-3 h-3 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filter Keterangan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Transaksi</SelectItem>
                      {smartFilterKeywords.map((keyword, i) => (
                        <SelectItem key={i} value={keyword}>{keyword}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filterDesc !== "ALL" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFilterDesc("ALL")}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
              {!isViewer && <Button variant="ghost" size="sm" onClick={handleOpenLogs} className="h-8 text-xs px-2 text-muted-foreground hover:text-primary"><ScrollText className="mr-1.5 h-3.5 w-3.5" /> Logs</Button>}
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile View: Card List */}
              <div className="md:hidden flex flex-col divide-y divide-border/50">
                {filteredTransactions.map((t, i) => (
                  <div key={i} className="p-3 hover:bg-accent/30 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5 flex-1 mr-2">
                        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-tight">{t.description}</p>
                        <p className="text-[10px] font-medium text-muted-foreground">{formatFullTimestamp(t.timestamp)}</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                         <span className={`font-bold text-sm block ${parseFloat(t.amount) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {parseFloat(t.amount) > 0 ? '+ ' : ''}{formatRupiah(parseFloat(t.amount))}
                        </span>
                        <Badge variant={parseFloat(t.amount) > 0 ? 'outline' : 'outline'} className={`text-[9px] px-1.5 py-0 h-4 mt-1 border-0 ${parseFloat(t.amount) > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                          {parseFloat(t.amount) > 0 ? 'Income' : 'Expense'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-end items-center gap-1 pt-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setViewingImage(t.image_url); setIsImageLoading(true); }}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Bukti
                        </Button>
                        {!isViewer && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80 hover:text-primary hover:bg-primary/10" onClick={() => handleEditClick(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeleteTargetIndex(t.rowIndex); setIsDeleteAlertOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </>
                        )}
                    </div>
                  </div>
                ))}
                {!isLoading && filteredTransactions.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-12 flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <ScrollText className="h-6 w-6 opacity-50" />
                    </div>
                    <p>Belum ada transaksi.</p>
                  </div>
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-center">Bukti</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    {!isViewer && <TableHead className="text-center">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 && filteredTransactions.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{formatFullTimestamp(t.timestamp)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => { setViewingImage(t.image_url); setIsImageLoading(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant={parseFloat(t.amount) > 0 ? 'default' : 'destructive'}>
                          {parseFloat(t.amount) > 0 ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${parseFloat(t.amount) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {parseFloat(t.amount) > 0 ? '+ ' : ''}{formatRupiah(parseFloat(t.amount))}
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="text-center flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(t)}><Pencil className="h-4 w-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteTargetIndex(t.rowIndex); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {!isLoading && filteredTransactions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada transaksi.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Dialogs */}
          <Dialog open={!!viewingImage} onOpenChange={(isOpen) => !isOpen && setViewingImage(null)}>
            <DialogContent className="max-w-3xl pt-12 [&>button]:bg-destructive [&>button]:text-destructive-foreground [&>button]:hover:bg-destructive/90 [&>button]:top-3 [&>button]:right-3 [&>button]:h-7 [&>button]:w-7 [&>button]:rounded-md [&>button]:opacity-100 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:border [&>button]:border-border">
              <DialogHeader className="sr-only"><DialogTitle>Bukti Transaksi</DialogTitle></DialogHeader>
              <div className="flex flex-col items-center justify-center min-h-50">
                {isImageLoading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
                {viewingImage && (
                    <img 
                      src={getDirectImageUrl(viewingImage)} 
                      alt="Bukti" 
                      className={`max-w-full h-auto rounded-md max-h-[70vh] object-contain ${isImageLoading ? 'hidden' : 'block'}`} 
                      onLoad={() => setIsImageLoading(false)} 
                      onError={() => setIsImageLoading(false)}
                    />
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Transaksi</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Jumlah (+/- Rp)</Label>
                  <Input id="edit-amount" type="text" placeholder="+ Rp 50.000" required value={editDisplayAmount} onChange={(e) => handleAmountChange(e, true)} />
                  {editAmountError && <p className="text-xs text-red-500 pt-1">{editAmountError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Keterangan</Label>
                  <Input id="edit-description" placeholder="Contoh: Gaji Bulanan / Beli Kopi" required value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ganti Bukti Transfer (Opsional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-accent transition cursor-pointer relative">
                    <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />
                    {editImageFile ? (
                      <div className="flex items-center text-green-600 gap-2"><CheckCircle className="h-4 w-4" /><span className="font-medium text-xs truncate max-w-40 sm:max-w-full">{editImageFile.name}</span></div>
                    ) : (
                      <p className="text-xs text-muted-foreground pointer-events-none">Klik atau drag & drop gambar baru</p>
                    )}
                  </div>
                </div>
                <Button className="w-full" onClick={handleSaveEdit}>Simpan Perubahan</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>System Logs</DialogTitle></DialogHeader>
              <Table>
                <TableHeader><TableRow><TableHead className="w-50">Waktu</TableHead><TableHead>Aktivitas</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.length > 0 ? logs.map((log, i) => (
                    <TableRow key={i}><TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatFullTimestamp(log.timestamp)}</TableCell><TableCell className="text-sm">{log.action}</TableCell></TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Belum ada logs tercatat.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle><AlertDialogDescription>Data yang dihapus tidak dapat dikembalikan.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={executeDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
};