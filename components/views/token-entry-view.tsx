"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Eye } from 'lucide-react';

interface TokenEntryViewProps {
  onNavigate: (view: any) => void;
}

export function TokenEntryView({ onNavigate }: TokenEntryViewProps) {
  const [token, setToken] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      // Redirect ke halaman dynamic route view/[token]
      router.push(`/view/${token}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20 font-sans">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => onNavigate('landing')} className="-ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Public View Access</CardTitle>
          </div>
          <CardDescription>Masukkan token database untuk melihat data (Read Only).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Masukkan Token..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="text-center font-mono text-lg tracking-widest"
                maxLength={20}
              />
            </div>
            <Button type="submit" className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={!token}>
              <Eye className="h-4 w-4" />
              Lihat Database
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}