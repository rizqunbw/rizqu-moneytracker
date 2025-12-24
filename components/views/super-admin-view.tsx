"use client";

import React, { useEffect, useState } from 'react';
import { Users, Database, Shield, Trash2, Key, Lock, Search, ArrowLeft, Eye, EyeOff, LogOut } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/loading-overlay";

interface SuperAdminViewProps {
  onBack: () => void;
  onLogout: () => void;
}

export function SuperAdminView({ onBack, onLogout }: SuperAdminViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // View Details State
  const [viewingUser, setViewingUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/get-users', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        setUsers(data.users);
      } else {
        toast.error("Gagal memuat data user");
      }
    } catch (e) {
      toast.error("Error koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Yakin ingin menghapus user ${email}? Data tidak bisa dikembalikan.`)) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: email }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success("User berhasil dihapus");
        fetchUsers();
      } else {
        toast.error("Gagal menghapus user");
      }
    } catch (e) {
      toast.error("Error koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!editingUser) return;
    
    const updates: any = {};
    if (newPassword) updates.password = newPassword;
    if (newPin) updates.pin = newPin;

    if (Object.keys(updates).length === 0) {
      toast.info("Tidak ada perubahan");
      setIsEditOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editingUser.email, updates }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success("Credential berhasil diupdate");
        setIsEditOpen(false);
        setNewPassword("");
        setNewPin("");
        fetchUsers();
      } else {
        toast.error("Gagal update");
      }
    } catch (e) {
      toast.error("Error koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDatabase = async (targetEmail: string, dbIndex: number) => {
    if (!confirm("Yakin ingin menghapus database ini dari user?")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/delete-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail, dbIndex }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast.success("Database berhasil dihapus");
        setViewingUser(null); // Tutup modal agar refresh data
        fetchUsers();
      } else {
        toast.error("Gagal menghapus database");
      }
    } catch (e) {
      toast.error("Error koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDatabases = users.reduce((acc, curr) => acc + (curr.databases?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 font-sans pt-16 md:pt-6">
      {isLoading && <LoadingOverlay messages={["Memuat Data Admin...", "Sinkronisasi User..."]} />}
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border pr-14 md:pr-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Kelola seluruh user dan database aplikasi.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold hidden sm:block">
              SUPER ADMIN MODE
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} title="Logout">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Databases</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDatabases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari email user..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Databases</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.databases?.length || 0} DB</Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewingUser(user)}>
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditingUser(user); setIsEditOpen(true); }}>
                        <Key className="h-4 w-4 mr-1" /> Creds
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(user.email)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Credentials Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Credentials: {editingUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input type="text" placeholder="Kosongkan jika tidak ubah" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New PIN</label>
                <Input type="text" maxLength={6} placeholder="Kosongkan jika tidak ubah" value={newPin} onChange={e => setNewPin(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button onClick={handleUpdateCredentials}>Simpan Perubahan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details: {viewingUser?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground block">Password</span>
                  <code className="font-mono font-bold">{viewingUser?.password}</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground block">PIN</span>
                  <code className="font-mono font-bold">{viewingUser?.pin}</code>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-xs text-muted-foreground block">Total DB</span>
                  <span className="font-bold">{viewingUser?.databases?.length || 0}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Databases ({viewingUser?.databases?.length || 0})</h3>
                <div className="space-y-2">
                  {viewingUser?.databases?.map((db: any, idx: number) => (
                    <div key={idx} className="border p-3 rounded-lg text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400">{db.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Edits: {db.editCount || 0}/3</span>
                          <span className="font-mono text-xs bg-muted px-2 rounded">{db.token || 'No Token'}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:bg-red-50" onClick={() => handleDeleteDatabase(viewingUser.email, idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground break-all font-mono bg-muted p-1 rounded">
                        {db.scriptUrl}
                      </div>
                    </div>
                  ))}
                  {(!viewingUser?.databases || viewingUser.databases.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">Tidak ada database.</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
