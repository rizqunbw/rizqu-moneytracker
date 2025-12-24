import React, { useState } from 'react';
import { Settings, Plus, Save, X, Database, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, DbInfo } from "@/types";

interface DatabaseManagerProps {
  user: User;
  onUpdateUser: (user: User) => void;
  currentDbUrl: string;
  onLoadingChange: (isLoading: boolean, messages: string[]) => void;
  onSelectDb: (db: DbInfo) => void;
}

export function DatabaseManager({ user, onUpdateUser, currentDbUrl, onSelectDb, onLoadingChange }: DatabaseManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null); // Index yang sedang diedit
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const databases = user.databases || [];

  const canEdit = user.editCount === undefined || user.editCount < 3;

  const resetForm = () => {
    setName("");
    setScriptUrl("");
    setIsEditing(null);
    setIsAdding(false);
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (isLoading) return;
    if (!name || !scriptUrl) {
      toast.warning("Nama dan URL Script harus diisi");
      return;
    }

    // Cek Limit 3 Database
    if (isAdding && databases.length >= 3) {
      toast.error("Batas Maksimal Tercapai", { description: "Anda hanya dapat membuat maksimal 3 database. Silakan berlangganan untuk menambah lebih banyak." });
      return;
    }

    setIsLoading(true);

    // 1. Validasi URL Script (Optional: bisa diperketat dengan fetch ke script)
    if (!scriptUrl.includes("script.google.com")) {
      toast.error("URL Script tidak valid");
      setIsLoading(false);
      return;
    }

    // 2. Susun Data Baru
    let newDatabases = [...databases];
    if (isAdding) {
      //LOGIC TAMBAH DB BARU
      newDatabases.push({ name, scriptUrl });
    } else if (isEditing !== null) {
      newDatabases[isEditing] = { name, scriptUrl };
    }

    // 3. Simpan ke Server
    try {
      onLoadingChange(true, ["Menyimpan Data Base"]);
      const res = await fetch('/api/user/update-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, databases: newDatabases }),
      });

      console.log(res)
      const data = await res.json();

      if (isEditing !== null){
          const res2 = await fetch('/api/user/update-databases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, databases: newDatabases }),
          });}
      if (data.status === 'success') {
        const updatedUser = { ...user, databases: data.databases };
        onUpdateUser(updatedUser);
        
        // Jika yang diedit adalah DB yang sedang aktif, update selection juga
        if (isEditing !== null && databases[isEditing].scriptUrl === currentDbUrl) {
           onSelectDb({ name, scriptUrl });
        }
        
        toast.success(isAdding ? "Database Berhasil Ditambahkan" : "Database Berhasil Diupdate");
        resetForm();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Save DB Error:", error);
      toast.error("Gagal Menyimpan", { description: "Terjadi kesalahan saat menghubungi server." });
    } finally {
      setIsLoading(false);
    }
    onLoadingChange(false, []);
  };

  const startEdit = (index: number) => {
    setName(databases[index].name);
    setScriptUrl(databases[index].scriptUrl);
    setIsEditing(index);
    setIsAdding(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
      <DialogTrigger asChild>
        {/*<Settings className="h-4 w-4" />*/}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola Database</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* List Database */}
          {!isAdding && isEditing === null && (
            <div className="space-y-3">
              {databases.map((db, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${db.scriptUrl === currentDbUrl ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Database className={`h-4 w-4 ${db.scriptUrl === currentDbUrl ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate">{db.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-50">{db.scriptUrl}</span>
                    </div>
                  </div>
                  
                    {canEdit ? (
                      <Button variant="ghost" size="icon" onClick={() => startEdit(i)} disabled={!canEdit}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" disabled>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                </div>
              ))}


            {canEdit ? ( <Button
                className="w-full mt-4 border-dashed border-2" 
                variant="outline" 
                onClick={() => {
                  if (databases.length >= 3) {
                    toast.error("Limit Tercapai", { description: "Maksimal 3 database untuk akun gratis." });
                  } else {
                    setIsAdding(true);
                    setName("");
                    setScriptUrl("");
                  }
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Database Baru
              </Button>
               ) : ("")} </div>
          )}

          {/* Form Tambah/Edit */}
          {(isAdding || isEditing !== null) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <Label>Nama Database</Label>
                <Input placeholder="Contoh: Tabungan Bisnis" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Script URL</Label>
                <Input placeholder="https://script.google.com/..." value={scriptUrl} onChange={e => setScriptUrl(e.target.value)} />
                <p className="text-[10px] text-slate-500">
                  {isEditing !== null ? "Mengubah URL tidak akan menghapus data lama di Google Sheets." : "Pastikan script sudah dideploy sebagai Web App."}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetForm} disabled={isLoading}>
                  <X className="mr-2 h-4 w-4" /> Batal
                </Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : <><Save className="mr-2 h-4 w-4" /> Simpan</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
