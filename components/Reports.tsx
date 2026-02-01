
import React, { useMemo, useState } from 'react';
import { 
  ChevronRight, 
  Search, 
  Clock, 
  Check, 
  Zap,
  Trophy,
  History,
  Users,
  PlusCircle
} from 'lucide-react';
import { AppData, PaymentStatus, AttendanceRecord, QisstDraw } from '../types';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const Reports: React.FC<Props> = ({ data, setData }) => {
  const [reportType, setReportType] = useState<'history' | 'draws' | 'remaining' | 'statement'>('history');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [statementSearch, setStatementSearch] = useState('');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Draw Management State
  const [selectedQisstId, setSelectedQisstId] = useState(data.qissts[0]?.id || '');
  const [drawWinnerId, setDrawWinnerId] = useState('');
  const [drawMonth, setDrawMonth] = useState('');

  const toLocalISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const customerHistory = useMemo(() => {
    return data.customers.map(c => {
      const q = data.qissts.find(q => q.id === c.qisstId);
      const records = data.attendance.filter(a => a.customerId === c.id && a.qisstId === c.qisstId);
      const totalCollected = records.reduce((sum, r) => sum + r.amountPaid, 0);
      const draw = data.draws.find(d => d.customerId === c.id);
      
      const today = new Date();
      const startDateParts = (q?.startDate || c.joiningDate).split('-').map(Number);
      const startDate = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
      
      let daysCount = 0;
      let temp = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      while (temp <= end) {
        daysCount++;
        temp.setDate(temp.getDate() + 1);
      }
      
      const expectedAmount = daysCount * (q?.dailyAmount || 0);
      const remaining = Math.max(0, expectedAmount - totalCollected);

      return {
        ...c,
        qisstName: q?.name || 'Unknown',
        totalCollected,
        remaining,
        records,
        hasWonDraw: !!draw,
        drawMonth: draw?.month,
        startDate: q?.startDate || c.joiningDate
      };
    });
  }, [data]);

  const handleCreateDraw = () => {
    if (!drawWinnerId || !drawMonth || !selectedQisstId) {
      alert("Validation Error: Please select a winner and month.");
      return;
    }

    const q = data.qissts.find(q => q.id === selectedQisstId);
    if (!q) return;

    const newDraw: QisstDraw = {
      id: crypto.randomUUID(),
      qisstId: selectedQisstId,
      customerId: drawWinnerId,
      month: drawMonth,
      amountGiven: q.totalTarget || 0,
      dateCreated: new Date().toISOString()
    };

    if (typeof setData !== 'function') {
      console.error("setData is not available. Please ensure it is passed from App.tsx");
      return;
    }

    setData(prev => ({
      ...prev,
      draws: [...prev.draws, newDraw]
    }));

    setDrawWinnerId('');
    setDrawMonth('');
    setShowToast("Month Payout Confirmed Successfully");
    setTimeout(() => setShowToast(null), 3000);
  };

  const eligibleForDraw = useMemo(() => {
    return customerHistory.filter(c => c.qisstId === selectedQisstId && !c.hasWonDraw);
  }, [customerHistory, selectedQisstId]);

  const renderContent = () => {
    if (reportType === 'draws') {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Monthly Draw Allocation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Select Circle</label>
                <select 
                  value={selectedQisstId} 
                  onChange={e => setSelectedQisstId(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all focus:bg-white focus:border-indigo-600"
                >
                  {data.qissts.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Winner Selection</label>
                <select 
                  value={drawWinnerId} 
                  onChange={e => setDrawWinnerId(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all focus:bg-white focus:border-indigo-600"
                >
                  <option value="">-- Choose Eligible Member --</option>
                  {eligibleForDraw.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payout Month</label>
                <input 
                  type="month" 
                  value={drawMonth} 
                  onChange={e => setDrawMonth(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all focus:bg-white focus:border-indigo-600" 
                />
              </div>
            </div>
            <button 
              onClick={handleCreateDraw} 
              className="mt-6 w-full md:w-auto bg-indigo-600 hover:bg-black text-white px-10 py-3.5 rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
            >
              Confirm Month Payout
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Draw Hall of Fame (Past Winners)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Winner</th>
                    <th className="px-6 py-4">Circle</th>
                    <th className="px-6 py-4">Month</th>
                    <th className="px-6 py-4 text-right">Amount Awarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.draws.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No payout history found.</td></tr>
                  ) : (
                    data.draws.map(d => {
                      const c = data.customers.find(c => c.id === d.customerId);
                      const q = data.qissts.find(q => q.id === d.qisstId);
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-900 text-sm">{c?.name}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-medium uppercase">{q?.name}</td>
                          <td className="px-6 py-4 font-bold text-slate-700 text-xs">{d.month}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-green-100">
                              PKR {d.amountGiven.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (reportType === 'remaining') {
      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Awaiting Payout (Rotation Queue)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Active Circle</th>
                  <th className="px-6 py-4 text-right">Total Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerHistory.filter(c => !c.hasWonDraw).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm tracking-tight">{c.name}</td>
                    <td className="px-6 py-4 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">{c.qisstName}</td>
                    <td className="px-6 py-4 text-right font-black text-red-500 text-xs tracking-tight">PKR {c.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (reportType === 'statement' && selectedCustomerId) {
      const activeCust = customerHistory.find(c => c.id === selectedCustomerId);
      const ledger = getLedger(activeCust);
      return (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-center shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-2xl font-black shadow-lg">
                  {activeCust?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{activeCust?.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Since {new Date(activeCust?.startDate || '').toLocaleDateString()}</p>
                </div>
             </div>
             <div className="flex gap-3 relative z-10 w-full md:w-auto mt-4 md:mt-0">
               <div className="flex-1 bg-white/5 px-6 py-3 rounded-xl border border-white/10 text-center">
                  <p className="text-[8px] uppercase font-black text-slate-400 mb-0.5 tracking-widest">Total Collected</p>
                  <p className="text-lg font-black text-green-400">PKR {activeCust?.totalCollected.toLocaleString()}</p>
               </div>
               <div className="flex-1 bg-white/5 px-6 py-3 rounded-xl border border-white/10 text-center">
                  <p className="text-[8px] uppercase font-black text-slate-400 mb-0.5 tracking-widest">Pending Due</p>
                  <p className="text-lg font-black text-red-400">PKR {activeCust?.remaining.toLocaleString()}</p>
               </div>
             </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h4 className="font-black text-slate-700 text-[10px] uppercase tracking-[0.2em]">Daily Installment Ledger</h4>
                <div className="relative w-full sm:w-auto">
                 <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search by date..." 
                    value={statementSearch} 
                    onChange={e => setStatementSearch(e.target.value)} 
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-48 outline-none focus:border-indigo-500 shadow-sm" 
                 />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-center">Payment Status</th>
                      <th className="px-6 py-4 text-right">Amount Credited</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledger.filter(l => l.date.includes(statementSearch)).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-700 text-xs">
                          {new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border tracking-wider ${
                            row.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`px-6 py-3.5 text-right font-black text-xs ${row.amount > 0 ? 'text-green-600' : 'text-slate-300 italic'}`}>
                          {row.amount > 0 ? `PKR ${row.amount.toLocaleString()}` : 'Awaiting'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Member Profile</th>
                <th className="px-6 py-4 text-center">Payout Status</th>
                <th className="px-6 py-4 text-right">Total Net</th>
                <th className="px-6 py-4 text-right">Outstanding</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerHistory.map(ch => (
                <tr key={ch.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 text-sm tracking-tight">{ch.name}</p>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">{ch.qisstName}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ch.hasWonDraw ? (
                      <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border border-amber-200">
                        Winner ({ch.drawMonth})
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border border-slate-200">
                        In Rotation
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-green-600 font-black text-right text-xs">PKR {ch.totalCollected.toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-500 font-black text-right text-xs">PKR {ch.remaining.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedCustomerId(ch.id); setReportType('statement'); }} 
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 shadow-md transition-all active:scale-95"
                    >
                      Audit Trail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  function getLedger(ch: any) {
    if (!ch) return [];
    const ledger = [];
    const today = new Date();
    const startDateParts = ch.startDate.split('-').map(Number);
    const start = new Date(startDateParts[0], startDateParts[1] - 1, startDateParts[2]);
    let current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (current <= end) {
      const dStr = toLocalISO(current);
      const rec = ch.records.find((r: any) => r.date === dStr);
      ledger.push({ date: dStr, status: rec?.status || 'UNPAID', amount: rec?.amountPaid || 0 });
      current.setDate(current.getDate() + 1);
    }
    return ledger.reverse();
  }

  return (
    <div className="space-y-6 pb-20 relative">
      {showToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-500/50 animate-in slide-in-from-top-10">
              <div className="bg-green-500 p-1.5 rounded-full">
                <Check className="w-4 h-4 text-white stroke-[4]" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-widest">{showToast}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Powered By Umar Ali</p>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Terminal</h2>
          <p className="text-slate-500 text-sm font-medium">Monthly draws, payout allocation, and audit trails.</p>
        </div>
        {reportType === 'statement' && (
          <button 
            onClick={() => setReportType('history')} 
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Directory
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar py-2">
        {[
          { id: 'history', label: 'Financial Directory', icon: History }, 
          { id: 'draws', label: 'Draw Management', icon: Trophy }, 
          { id: 'remaining', label: 'Rotation Queue', icon: Users }
        ].map(btn => (
          <button 
            key={btn.id} 
            onClick={() => setReportType(btn.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest border transition-all ${
              reportType === btn.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
            }`}
          >
            <btn.icon className={`w-4 h-4 ${reportType === btn.id ? 'fill-current' : ''}`} />
            {btn.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{renderContent()}</div>
    </div>
  );
};

export default Reports;
