"use client"

import React, { useState, useEffect } from 'react';
import { User, DbInfo } from "@/types";
import { toast } from "sonner";
import { LandingView } from "@/components/views/landing-view";
import { AuthView } from "@/components/views/auth-view";
import { SetupView } from "@/components/views/setup-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { TokenEntryView } from "@/components/views/token-entry-view";
import { SuperAdminView } from "@/components/views/super-admin-view";
import { DocsView } from "@/components/views/docs-view";

type ViewState = 'landing' | 'login' | 'register' | 'forgot-password' | 'setup' | 'dashboard' | 'token-entry' | 'super-admin' | 'docs';

export default function Home() {
  const [view, setView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>('landing');
  const [selectedDb, setSelectedDb] = useState<DbInfo | null>(null);

  // Cek LocalStorage saat aplikasi dimuat (Persist Login)
  useEffect(() => {
    const storedUser = localStorage.getItem('moneytracker_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.databases && parsedUser.databases.length > 0) {
          setSelectedDb(parsedUser.databases[0]);
          setView('dashboard');
        } else {
          setView('setup');
        }

        // --- SYNC DATA TERBARU DARI SERVER ---
        const syncUser = async () => {
          try {
            const res = await fetch('/api/user/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: parsedUser.email, sessionToken: parsedUser.sessionToken })
            });
            const data = await res.json();
            
            if (data.status === 'success' && data.user) {
              const latestUser = data.user;
              
              // Update Local Storage & State dengan data terbaru
              localStorage.setItem('moneytracker_user', JSON.stringify(latestUser));
              setUser(latestUser);

              // Cek status database
              if (!latestUser.databases || latestUser.databases.length === 0) {
                // Jika semua database dihapus -> Pindah ke Setup
                setSelectedDb(null);
                setView('setup');
                toast.info("Database tidak ditemukan. Silakan hubungkan database baru.");
              } else {
                // Jika masih ada database
                const currentDbName = parsedUser.databases?.[0]?.name;
                const stillExists = latestUser.databases.find((db: DbInfo) => db.name === currentDbName);
                
                if (stillExists) {
                  // Database yang sedang dipilih masih ada -> Update infonya (misal token berubah)
                  setSelectedDb(stillExists);
                } else {
                  // Database yang dipilih sudah dihapus -> Pindah ke database pertama yang tersisa
                  setSelectedDb(latestUser.databases[0]);
                  toast.info("Database sebelumnya telah dihapus. Beralih ke database yang tersedia.");
                }
              }
            } else if (res.status === 401 || data.status === 'not_found') {
               // 401: Password/PIN berubah (Session Token mismatch)
               // not_found: Akun dihapus
               toast.error("Sesi berakhir", { description: "Session expired. Silakan login ulang." });
               handleLogout();
            }
          } catch (e) {
            console.error("Sync error", e);
          }
        };
        
        syncUser();
      } catch (e) {
        localStorage.removeItem('moneytracker_user');
      }
    }
  }, []);

  const handleAuthSuccess = (loggedInUser: User | null) => {
    if (!loggedInUser) return;
    localStorage.setItem('moneytracker_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    if (loggedInUser.databases && loggedInUser.databases.length > 0) {
      setSelectedDb(loggedInUser.databases[0]);
      setView('dashboard');
    } else {
      setView('setup');
    }
  };

  const handleSetupSuccess = (updatedUser: User, newDb: DbInfo) => {
    localStorage.setItem('moneytracker_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSelectedDb(newDb);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('moneytracker_user');
    setUser(null); 
    setView('landing');
  };

  const handleNavigateToDocs = () => {
    setPreviousView(view);
    setView('docs');
  };

  return (
      <div className="transition-all duration-300 min-h-screen flex flex-col bg-background">
        <main className="grow">
          {view === 'landing' && <LandingView onNavigate={(target) => {
            if (target === 'docs') handleNavigateToDocs();
            else setView(target);
          }} />}
          
          {view === 'token-entry' && <TokenEntryView onNavigate={setView} />}

          {(view === 'login' || view === 'register' || view === 'forgot-password') && (
            <AuthView 
              mode={view} 
              onNavigate={(target) => {
                if (target === 'docs') handleNavigateToDocs();
                else setView(target);
              }} 
              onSuccess={handleAuthSuccess} 
            />
          )}

          {view === 'setup' && user && (
            <SetupView 
              user={user} 
              onSuccess={handleSetupSuccess} 
              onNavigate={(target) => {
                if (target === 'docs') handleNavigateToDocs();
                // Setup view usually doesn't navigate elsewhere except success
              }}
            />
          )}

          {view === 'dashboard' && user && selectedDb && (
            <DashboardView 
              user={user} 
              initialDb={selectedDb} 
              onLogout={handleLogout} 
              onUpdateUser={(updatedUser) => {
                localStorage.setItem('moneytracker_user', JSON.stringify(updatedUser));
                setUser(updatedUser);
              }}
              isSuperAdmin={user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL}
              onSuperAdminClick={() => setView('super-admin')}
              onNavigateToDocs={handleNavigateToDocs}
            />
          )}

          {view === 'super-admin' && user && user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && (
            <SuperAdminView onBack={() => setView('dashboard')} onLogout={handleLogout} />
          )}

          {view === 'docs' && (
            <DocsView onBack={() => setView(previousView)} />
          )}
        </main>
        <footer className="text-center p-4 text-xs text-muted-foreground">
          COPYRIGHT © 2025 by <a href="https://www.linkedin.com/in/rizqu/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Rizqu</a>. All rights reserved.
        </footer>
      </div>
  );
}
