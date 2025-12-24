import React, { useState } from 'react';
import { toast } from "sonner";
import { Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingOverlay } from "@/components/loading-overlay";
import { User, DbInfo } from "@/types";

interface SetupViewProps {
  user: User;
  onSuccess: (updatedUser: User, newDb: DbInfo) => void;
  onNavigate: (view: 'docs') => void;
}

export const SetupView = ({ user, onSuccess, onNavigate }: SetupViewProps) => {
  const [dbName, setDbName] = useState("");
  const [userScriptUrl, setUserScriptUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectDatabase = async () => {
    if (!userScriptUrl || !dbName) {
      toast.warning("Data tidak lengkap", { description: "Nama Database dan URL Script wajib diisi." });
      return;
    }
    setIsLoading(true);
    try {
      const setupRes = await fetch('/api/setup-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptUrl: userScriptUrl }),
      });
      const setupData = await setupRes.json();

      if (setupData.status === 'success') {
        // Gunakan update-user agar konsisten dengan validasi di admin-script
        const newDatabases = [...(user.databases || []), { name: dbName, scriptUrl: userScriptUrl }];
        
        const addDbRes = await fetch('/api/user/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email, 
            updates: { databases: newDatabases } 
          }),
        });
        const addDbData = await addDbRes.json();
        if (addDbData.status === 'success') {
          // Gunakan data user dari response server agar token terbaca
          const updatedUser = addDbData.user;
          const createdDb = updatedUser.databases.find(
            (db: DbInfo) => db.name === dbName && db.scriptUrl === userScriptUrl
          );
          onSuccess(updatedUser, createdDb || { name: dbName, scriptUrl: userScriptUrl });
        } else {
          toast.error("Gagal Menambahkan Database", { description: addDbData.message || "Terjadi kesalahan validasi." });
        }
      } else {
        toast.error("Gagal Menghubungkan", { description: setupData.message });
      }
    } catch (error) {
      console.error("Setup Error:", error);
      toast.error("Gagal Menghubungkan Database", { description: error instanceof Error ? error.message : "Unknown Error" });
    }
    setIsLoading(false);
  };

  return (
    <>
      {isLoading && <LoadingOverlay messages={["Menghubungkan Database...", "Memverifikasi Script URL...", "Menyiapkan konfigurasi..."]} />}
      <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Hubungkan Database</CardTitle>
            <CardDescription>Masukkan nama database dan URL Google Apps Script Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button onClick={() => onNavigate('docs')} className="text-sm text-primary hover:underline flex items-center justify-center gap-2 mx-auto transition-colors p-3 bg-primary/10 rounded-lg w-full">
              <Info className="h-4 w-4" /> Wajib Baca: Panduan Setup Database & Script
            </button>
            <div className="space-y-2 text-left">
              <Label>Nama Database</Label>
              <Input placeholder="Contoh: Dompet Utama" value={dbName} onChange={(e) => setDbName(e.target.value)} />
            </div>
            <div className="space-y-2 text-left">
              <Label>Script URL</Label>
              <Input placeholder="https://script.google.com/macros/s/..." value={userScriptUrl} onChange={(e) => setUserScriptUrl(e.target.value)} />
            </div>
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleConnectDatabase} disabled={isLoading || !dbName || !userScriptUrl}>
              {isLoading ? "Menghubungkan..." : "Connect & Setup Database"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};