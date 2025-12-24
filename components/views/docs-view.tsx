// d:\MoneyTracker\components\views\docs-view.tsx

import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, FileCode, Server } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_SCRIPT_TEMPLATE, USER_SCRIPT_TEMPLATE } from '@/lib/script-templates';
import { toast } from "sonner";

interface DocsViewProps {
  onBack: () => void;
}

export const DocsView = ({ onBack }: DocsViewProps) => {
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);

  const copyToClipboard = (text: string, isUserScript: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUserScript) {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    }
    toast.success("Kode berhasil disalin!");
  };

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-accent">
            <ArrowLeft className="h-6 w-6 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panduan Setup Database</h1>
            <p className="text-muted-foreground">Ikuti langkah-langkah berikut untuk menghubungkan Google Sheets Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Steps */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Langkah Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</div>
                  <p>Buka <a href="https://sheets.google.com" target="_blank" className="text-primary hover:underline">Google Sheets</a> dan buat Spreadsheet baru.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</div>
                  <p>Klik menu <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">3</div>
                  <p>Hapus semua kode yang ada di <code>Code.gs</code>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">4</div>
                  <p>Salin kode <strong>User Script</strong> (untuk database pribadi) atau <strong>Admin Script</strong> (untuk server pusat) dari panel di samping.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">5</div>
                  <p>Paste kode ke editor Apps Script dan Simpan (Ctrl+S).</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">6</div>
                  <p>Klik <strong>Deploy</strong> &gt; <strong>New deployment</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">7</div>
                  <div className="space-y-1">
                    <p>Pilih type: <strong>Web app</strong>.</p>
                    <p>Execute as: <strong>Me</strong>.</p>
                    <p>Who has access: <strong>Anyone</strong>.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-none w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">8</div>
                  <p>Klik <strong>Deploy</strong>, salin <strong>Web App URL</strong>, dan tempel di aplikasi Money Tracker.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" /> User Script (Database Pribadi)
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Server className="h-4 w-4" /> Admin Script (Server Pusat)
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="user">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/50 rounded-t-xl border-b">
                    <div className="space-y-1">
                      <CardTitle className="text-base">User Script Code</CardTitle>
                      <CardDescription>Gunakan ini untuk database transaksi Anda.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(USER_SCRIPT_TEMPLATE, true)}>
                      {copiedUser ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedUser ? "Tersalin" : "Salin Kode"}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-muted text-muted-foreground p-4 overflow-auto h-125 font-mono text-xs rounded-b-xl border-x border-b">
                      <pre>{USER_SCRIPT_TEMPLATE}</pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="admin">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/50 rounded-t-xl border-b">
                    <div className="space-y-1">
                      <CardTitle className="text-base">Admin Script Code</CardTitle>
                      <CardDescription>Hanya untuk Super Admin / Server Utama.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(ADMIN_SCRIPT_TEMPLATE, false)}>
                      {copiedAdmin ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copiedAdmin ? "Tersalin" : "Salin Kode"}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="bg-muted text-muted-foreground p-4 overflow-auto h-125 font-mono text-xs rounded-b-xl border-x border-b">
                      <pre>{ADMIN_SCRIPT_TEMPLATE}</pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
