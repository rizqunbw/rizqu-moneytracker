import React, { useState, useRef, useEffect } from 'react';
import { DbInfo } from '@/types';
import { Settings, Plus, Check, X, ChevronDown, Database, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DatabaseSelectorProps {
  databases: DbInfo[];
  selectedDb: DbInfo;
  onSelect: (db: DbInfo) => void;
  onUpdateDatabases: (newDatabases: DbInfo[], newSelection?: DbInfo) => Promise<void>;
  onNavigateToDocs?: () => void;
}

export function DatabaseSelector({ databases, selectedDb, onSelect, onUpdateDatabases, onNavigateToDocs }: DatabaseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDb, setEditingDb] = useState<{ index: number, data: DbInfo } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditClick = (e: React.MouseEvent, index: number, db: DbInfo) => {
    e.stopPropagation(); // Mencegah dropdown tertutup/terpilih saat klik gear
    setEditingDb({ index, data: db });
    setFormName(db.name);
    setFormUrl(db.scriptUrl || ''); // Asumsi ada field url
    setIsOpen(false);
  };

  const handleAddClick = () => {
    if (databases.length >= 3) {
      setShowUpgradeModal(true);
      setIsOpen(false);
      return;
    }
    setEditingDb(null);
    setIsAdding(true);
    setFormName('');
    setFormUrl('');
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (isSaving) return;
    const newDbs = [...databases];
    const newDbData = { name: formName, scriptUrl: formUrl };

    if (isAdding) {
      newDbs.push(newDbData);
    } else if (editingDb) {
      newDbs[editingDb.index] = newDbData;
    }

    setIsSaving(true);
    try {
      await onUpdateDatabases(newDbs, isAdding ? newDbData : undefined);
      closeModal();
    } catch (error) {
      // Error sudah dihandle di parent (toast), biarkan modal tetap terbuka
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setEditingDb(null);
    setIsAdding(false);
    setFormName('');
    setFormUrl('');
  };

  const showModal = isAdding || editingDb !== null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-background/50 border rounded-lg shadow-sm hover:bg-accent transition-colors min-w-40 justify-between h-9"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="font-medium text-card-foreground">{selectedDb?.name || 'Select Database'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-60 bg-card text-card-foreground border rounded-lg shadow-lg z-9999 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-75 overflow-y-auto">
            {databases.map((db, index) => (
              <div 
                key={index}
                onClick={() => { onSelect(db); setIsOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-accent group ${selectedDb?.name === db.name ? 'bg-primary/10' : ''}`}
              >
                <span className={`text-sm ${selectedDb?.name === db.name ? 'text-primary font-medium' : 'text-foreground'}`}>
                  {db.name}
                </span>
                
                {/* Edit Button (Gear/Settings) */}
                <button
                  type="button"
                  onClick={(e) => handleEditClick(e, index, db)}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                  title="Edit Database"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Database Button (Max 3) */}
            <>
              <div className="h-px bg-border my-1" />
              <button
                type="button"
                onClick={handleAddClick}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Database</span>
              </button>
            </>
        </div>
      )}

      {/* Edit/Add Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in-95 border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {isAdding ? 'Add New Database' : 'Edit Database'}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {onNavigateToDocs && (
              <button onClick={onNavigateToDocs} className="text-sm text-primary hover:underline flex items-center justify-center gap-2 mx-auto transition-colors p-3 bg-secondary rounded-lg w-full">
                <Info className="h-4 w-4" /> Wajib Baca: Panduan Setup Database & Script
              </button>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="e.g., Personal Finance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Script URL</label>
                {!isAdding && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Maksimal perubahan link database adalah 3 kali. ({editingDb?.data.editCount || 0}/3)
                  </p>
                )}
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  disabled={!isAdding && (editingDb?.data.editCount || 0) >= 3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono text-xs ${!isAdding && (editingDb?.data.editCount || 0) >= 3 ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
                  placeholder="https://script.google.com/..."
                />
                {(!isAdding && (editingDb?.data.editCount || 0) >= 3) && <p className="text-xs text-destructive mt-1">Batas edit link tercapai (3/3). Hanya nama yang dapat diubah.</p>}
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formName || !formUrl || isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> : <Check className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal (Shadcn) */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
            <DialogDescription>
              Anda telah mencapai batas maksimal 3 database. Upgrade ke layanan Premium untuk membuat database tanpa batas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground bg-muted rounded-md">
            Fitur Premium akan segera hadir (Coming Soon)
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUpgradeModal(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
