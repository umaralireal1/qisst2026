
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  PlusCircle, 
  Menu, 
  X,
  RefreshCw,
  Wallet,
  Calendar,
  ShieldCheck,
  Download,
  Upload,
  Check,
  Database
} from 'lucide-react';
import { loadData, saveData, syncToCloud } from './store';
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
  const [showToast, setShowToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncToCloud(data);
    setIsSyncing(false);
    triggerToast("Cloud Sync Simulated Successfully");
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleDownloadBackup = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `QisstPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    triggerToast("Backup File Downloaded");
  };

  const handleUploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        // Basic validation
        if (parsedData.qissts && parsedData.customers) {
          setData(parsedData);
          triggerToast("Backup Restored Successfully");
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error reading backup file.");
      }
    };
    fileReader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navItems = [
    { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
    { id: 'qissts', label: 'Qisst Circles', icon: Wallet },
    { id: 'customers', label: 'Members', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
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
      {/* Toast Notification */}
      {showToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-500/50 animate-in slide-in-from-top-10">
              <div className="bg-green-500 p-1.5 rounded-full"><Check className="w-4 h-4 text-white stroke-[4]" /></div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest">{showToast}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Powered By Umar Ali</p>
              </div>
          </div>
      )}

      {/* Mobile Header */}
      <header className="md:hidden bg-indigo-700 text-white p-5 flex justify-between items-center sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl"><Wallet className="w-6 h-6" /></div>
          <h1 className="font-black text-2xl tracking-tighter">Qisst Pro</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-white/20 p-2 rounded-xl">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] bg-slate-900 text-white transform transition-transform duration-500 ease-in-out md:relative md:translate-x-0 w-80 flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden md:flex items-center gap-4">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20"><ShieldCheck className="w-8 h-8 text-white" /></div>
          <h1 className="font-black text-3xl tracking-tighter">Qisst Pro</h1>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-[22px] transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-500/40 scale-105' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'}
              `}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[3px]' : ''}`} />
              <span className="text-sm uppercase tracking-widest">{item.label}</span>
            </button>
          ))}

          <div className="pt-8 space-y-4">
             <p className="px-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Management</p>
             <button onClick={handleDownloadBackup} className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white font-bold transition-all">
                <Download className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Download JSON</span>
             </button>
             <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white font-bold transition-all">
                <Upload className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Upload JSON</span>
             </button>
             <input type="file" ref={fileInputRef} onChange={handleUploadBackup} className="hidden" accept=".json" />
          </div>
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/20">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-indigo-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Cloud Backup'}
          </button>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Developed By</p>
            <p className="text-white font-black text-sm tracking-tighter">Umar Ali</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 p-4 md:p-12 no-scrollbar pb-32 md:pb-12">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
          
          <footer className="mt-20 pt-10 border-t border-slate-200 text-center flex flex-col items-center gap-2">
             <div className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
               <Database className="w-3 h-3" />
               Enterprise v1.5 Stable
             </div>
             <p className="text-slate-400 font-bold text-xs">Offline Secure Installment Ledger</p>
             <p className="text-slate-900 font-black text-sm tracking-tighter mt-1">Powered By Umar Ali</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
