import React, { useState, useEffect } from 'react';
import { Button, Card } from '../components/UI';
import { SettingsIcon, Moon, Sun, RefreshCw, Trash2 } from '../components/Icons';
import { exportDatabase, importDatabase } from '../services/offlineDB';
import { useInventory } from '../src/context/InventoryContext';

const Settings: React.FC = () => {
  const { fetchInitialData } = useInventory();
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setError(isError);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MedStore_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('Database exported successfully!');
    } catch (err) {
      showMessage('Failed to export database.', true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsProcessing(true);
        const jsonData = JSON.parse(event.target?.result as string);
        await importDatabase(jsonData);
        await fetchInitialData(true); // Refresh UI
        showMessage('Database imported successfully!');
      } catch (err) {
        showMessage('Invalid backup file or import failed.', true);
      } finally {
        setIsProcessing(false);
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                <SettingsIcon className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">App Preferences & Data</p>
            </div>
         </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-center font-medium animate-in slide-in-from-top duration-300 ${error ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'}`}>
          {message}
        </div>
      )}

      {/* Backup & Restore Card */}
      <Card className="border-l-4 border-l-primary">
        <div className="space-y-4">
           <div>
              <h3 className="font-bold text-gray-800 dark:text-white">Backup & Restore</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                 Export your data to a JSON file or import a previous backup.
              </p>
           </div>
           <div className="flex flex-wrap gap-3">
              <Button onClick={handleExport} disabled={isProcessing} className="flex-1 sm:flex-none">
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Export Database
              </Button>
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                <Button variant="secondary" className="w-full" disabled={isProcessing}>
                   Import Database
                </Button>
              </div>
           </div>
           <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
             ⚠️ Importing a database will overwrite all your current local data.
           </p>
        </div>
      </Card>

      {/* Appearance Card */}
      <Card>
          <div className="flex items-center justify-between">
              <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} 
                      Appearance
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
              </div>
              <button 
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDark ? 'bg-primary' : 'bg-gray-200'}`}
              >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
          </div>
      </Card>

      {/* PWA Install Card */}
      {isInstallable && (
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Install MedStore
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Install the app on your device for quick access and better experience.</p>
            </div>
            <Button onClick={handleInstallClick}>Install Now</Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-2">About MedStore</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          MedStore is a local-first inventory management system. Your data is stored securely on your device and works 100% offline. Use the Export feature to backup your data manually.
        </p>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400">Version 3.0.0 (Offline Edition)</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
