
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  Menu, 
  X,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Download,
  Upload,
  Check,
  Database,
  CloudCheck,
  Settings,
  Link2,
  AlertCircle,
  CloudUpload,
  ToggleLeft as Toggle,
  ToggleRight,
  ShieldAlert,
  Server,
  Zap
} from 'lucide-react';
import { 
  loadData, 
  saveData, 
  syncToGoogleSheets, 
  fetchFromGoogleSheets, 
  getSheetsUrl, 
  setSheetsUrl,
  getAutoSync,
  setAutoSync,
  getLastSyncTime
} from './store';
import { AppData } from './types';
import Dashboard from './components/Dashboard';
import QisstManager from './components/QisstManager';
import CustomerManager from './components/CustomerManager';
import AttendanceTracker from './components/AttendanceTracker';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'qissts' | 'customers' | 'attendance' | 'reports'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSheetsUrl, setTempSheetsUrl] = useState(getSheetsUrl());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(getAutoSync());
  const [lastSyncTime, setLastSyncTime] = useState(getLastSyncTime());
  
  const isInitialMount = useRef(true);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // 1. Local Safe-Save
    setSaveStatus('saving');
    const success = saveData(data);
    if (success) {
      setTimeout(() => setSaveStatus('synced'), 500);
    } else {
      setSaveStatus('error');
    }

    // 2. Intelligent Auto-Cloud Sync (Debounced by 4 seconds)
    if (autoSyncEnabled) {
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = window.setTimeout(async () => {
        setIsSyncing(true);
        const cloudSuccess = await syncToGoogleSheets(data);
        setIsSyncing(false);
        if (cloudSuccess) setLastSyncTime(getLastSyncTime());
      }, 4000); 
    }
  }, [data, autoSyncEnabled]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    const success = await syncToGoogleSheets(data);
    setIsSyncing(false);
    if (success) {
      setLastSyncTime(getLastSyncTime());
      triggerToast("Proper Cloud Backup Verified");
    } else {
      alert("Sync Error: Please check your Internet or Script URL.");
    }
  };

  const handleCloudRestore = async () => {
    if (!confirm("⚠️ CAUTION: This will replace everything on this phone with your Google Sheets data. Proceed?")) return;

    setIsSyncing(true);
    try {
      const remoteData = await fetchFromGoogleSheets();
      setIsSyncing(false);
      if (remoteData) {
        setData(remoteData);
        triggerToast("Ledger Restored from Cloud");
        setShowSettings(false);
      } else {
        alert("Restoration Failed: No valid backup found in your Sheet.");
      }
    } catch (err) {
      setIsSyncing(false);
      alert("Connectivity Error. Ensure your Google Script is deployed as 'Web App'.");
    }
  };

  const handleToggleAutoSync = () => {
    const newState = !autoSyncEnabled;
    setAutoSyncEnabled(newState);
    setAutoSync(newState);
    triggerToast(newState ? "Real-time Cloud Sync Active" : "Auto-Sync Paused");
  };

  const handleSaveSettings = () => {
    setSheetsUrl(tempSheetsUrl);
    setShowSettings(false);
    triggerToast("Connection Profile Updated");
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
    { id: 'qissts', label: 'Qisst Circles', icon: Wallet },
    { id: 'customers', label: 'Members', icon: Users },
    { id: 'attendance', label: 'Daily Ledger', icon: CalendarCheck },
    { id: 'reports', label: 'Audit Hub', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} />;
      case 'qissts': return <QisstManager data={data} setData={setData} />;
      case 'customers': return <CustomerManager data={data} setData={setData} />;
      case 'attendance': return <AttendanceTracker data={data} setData={setData} />;
      case 'reports': return <Reports data={data} setData={setData} />;
      default: return <Dashboard data={data} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Settings Modal - Redesigned for Data Control */}
      {showSettings && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
              <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="bg-indigo-600 w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                  <Server className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">Data Vault</h3>
                  <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mt-1">Google Sheets Bridge</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[28px] border border-white/10 backdrop-blur-sm">
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                    <Zap className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                    Live Cloud Sync
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Transmit data on every update</p>
                </div>
                <button onClick={handleToggleAutoSync} className="transition-all active:scale-90">
                  {autoSyncEnabled ? <ToggleRight className="w-12 h-12 text-indigo-500" /> : <Toggle className="w-12 h-12 text-slate-600" />}
                </button>
              </div>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                  Deployment Endpoint (GAS URL)
                </label>
                <input 
                  type="text" 
                  value={tempSheetsUrl} 
                  onChange={e => setTempSheetsUrl(e.target.value)} 
                  className="w-full px-6 py-5 rounded-[20px] bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner" 
                  placeholder="https://script.google.com/..."
                />
              </div>

              <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 flex gap-5">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                <div>
                  <p className="text-[11px] text-amber-900 font-black uppercase tracking-tight mb-1">Restore Protocol</p>
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed opacity-80 uppercase tracking-tighter">
                    Fetching data from cloud will wipe local records. Recommended only when switching devices or fixing data errors.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleSaveSettings} className="py-5 bg-slate-900 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.25em] hover:bg-indigo-600 shadow-xl transition-all active:scale-95">Update Endpoint</button>
                <button 
                  onClick={handleCloudRestore} 
                  disabled={isSyncing} 
                  className="py-5 border-2 border-slate-100 text-slate-600 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                   <Download className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                   Restore Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-5 border border-indigo-500/50 animate-in slide-in-from-top-12">
              <div className="bg-indigo-500 p-2 rounded-full shadow-lg shadow-indigo-500/50"><Check className="w-4 h-4 text-white stroke-[4]" /></div>
              <p className="font-black text-xs uppercase tracking-[0.25em]">{showToast}</p>
          </div>
      )}

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white p-6 flex justify-between items-center sticky top-0 z-50 shadow-2xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg"><ShieldCheck className="w-7 h-7" /></div>
          <h1 className="font-black text-2xl tracking-tighter">Qisst Pro</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-white/10 p-3 rounded-2xl transition-all active:bg-white/20">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-[100] bg-slate-900 text-white transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 w-80 flex flex-col shadow-2xl border-r border-white/5 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 hidden md:flex items-center gap-5">
          <div className="bg-indigo-600 p-3 rounded-[20px] shadow-2xl shadow-indigo-600/40"><ShieldCheck className="w-8 h-8 text-white" /></div>
          <div>
            <h1 className="font-black text-3xl tracking-tighter">Qisst Pro</h1>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em]">System V1.8</p>
          </div>
        </div>

        <nav className="flex-1 px-8 py-4 space-y-3 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-[28px] transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-600/30 scale-[1.03]' : 'text-slate-500 hover:bg-white/5 hover:text-white font-bold'}`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[3px]' : ''}`} />
              <span className="text-xs uppercase tracking-[0.25em]">{item.label}</span>
            </button>
          ))}

          <div className="pt-12 space-y-3">
             <p className="px-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Administration</p>
             <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-5 px-6 py-4.5 rounded-[24px] text-slate-500 hover:bg-white/5 hover:text-white font-bold transition-all"><Settings className="w-4.5 h-4.5" /><span className="text-[10px] uppercase tracking-widest">Cloud Terminal</span></button>
          </div>
        </nav>

        {/* Sync Footer Hub */}
        <div className="p-10 border-t border-white/5 bg-black/30">
          <div className="mb-6 px-6 py-4 bg-slate-800/40 rounded-[24px] border border-white/5">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${saveStatus === 'synced' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-amber-500 animate-pulse'}`}></div>
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em]">
                     {saveStatus === 'synced' ? 'Vault Secured' : 'Syncing...'}
                   </span>
                </div>
                {autoSyncEnabled && <div className="bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest">LIVE</div>}
             </div>
             <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Last Cloud sync:</p>
                <p className="text-[10px] font-black text-white uppercase">{lastSyncTime || 'Awaiting Connection'}</p>
             </div>
          </div>

          <button 
            onClick={handleManualSync} 
            disabled={isSyncing} 
            className="group w-full flex items-center justify-center gap-4 bg-indigo-600 hover:bg-white hover:text-indigo-600 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 disabled:opacity-50 shadow-2xl shadow-indigo-600/30 active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            {isSyncing ? 'Pushing Data...' : 'Sync to Cloud'}
          </button>
          
          <div className="mt-10 text-center flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.6em]">System Architect</p>
            <p className="text-white font-black text-sm tracking-tighter cursor-default">Umar Ali</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 p-8 md:p-16 no-scrollbar pb-40 md:pb-16">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
          
          <footer className="mt-32 pt-16 border-t border-slate-200 text-center flex flex-col items-center gap-6">
             <div className="bg-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-slate-200 text-slate-400 flex items-center gap-4 shadow-sm">
               <Database className="w-4 h-4 text-indigo-500" />
               Multi-Tab Sheets Sync Enabled • Proper Backup v1.9
             </div>
             <div className="flex flex-col items-center">
                <p className="text-slate-400 font-bold text-[12px] tracking-wide uppercase">Institutional Savings Management Platform</p>
                <p className="text-slate-900 font-black text-xl tracking-tighter mt-1 uppercase">Powered By Umar Ali</p>
             </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
