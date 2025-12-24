import React from 'react';
import { Database, ArrowRight, PlayCircle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface LandingViewProps {
  onNavigate: (view: 'login' | 'token-entry' | 'docs') => void;
}

export const LandingView = ({ onNavigate }: LandingViewProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <div className="h-24 w-24 bg-primary rounded-full flex items-center justify-center shadow-lg overflow-hidden">
            <img src="/logo.png" alt="Logo" className="h-16 w-16 object-contain" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Money Tracker</h1>
          <p className="text-muted-foreground text-lg">
            Kelola keuanganmu dengan mudah. Backend Google Sheets & Input Gambar Google Drive.
          </p>
        </div>

        <div className="space-y-4 pt-8">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all hover:scale-[1.02]"
            onClick={() => onNavigate('login')}
          >
            <Database className="mr-2 h-5 w-5" />
            Create New Database
          </Button>

          <div className="text-center">
            <button onClick={() => onNavigate('docs')} className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center justify-center gap-1 mx-auto transition-colors">
              <Info className="h-3 w-3" /> Wajib Baca: Panduan Setup Database & Script
            </button>
          </div>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full text-lg h-14 border-border hover:bg-accent hover:text-accent-foreground transition-all"
            onClick={() => onNavigate('token-entry')}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            View Exist Database (Public)
          </Button>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3 font-medium">Bingung cara menggunakan aplikasi ini?</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-primary hover:text-primary/90 hover:bg-accent gap-2">
                  <PlayCircle className="h-5 w-5" />
                  Tonton Video Penjelasan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-black border-0">
                <DialogTitle className="sr-only">Video Penjelasan Money Tracker</DialogTitle>
                <div className="aspect-video w-full">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/D-geLVTaBAo?autoplay=1" 
                    title="Money Tracker Explainer" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};