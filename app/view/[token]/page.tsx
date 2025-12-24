"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardView } from '@/components/views/dashboard-view';
import { LoadingOverlay } from '@/components/loading-overlay';
import { DbInfo, User } from '@/types';

export default function PublicViewPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch('/api/public/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        const data = await res.json();
        
        if (data.status === 'success') {
          setDbInfo(data.data);
        } else {
          setError(data.message || "Database tidak ditemukan");
        }
      } catch (err) {
        setError("Gagal memuat data");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) verifyToken();
  }, [token]);

  if (isLoading) return <LoadingOverlay messages={["Memverifikasi Token...", "Mencari Database..."]} />;

  if (error || !dbInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm">
          <h1 className="text-xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600">{error || "Token tidak valid"}</p>
        </div>
      </div>
    );
  }

  // Mock User object for Viewer
  const viewerUser: User = {
    email: "viewer@public",
    databases: [dbInfo]
  };

  return (
    <DashboardView 
      user={viewerUser}
      initialDb={dbInfo}
      onLogout={() => {}} // No logout for viewer
      isViewer={true}
    />
  );
}
