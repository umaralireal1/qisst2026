
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
  PlusCircle,
  Trash2,
  Edit2,
  X,
  Save
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
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

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

    // FIX: Proper Payout Calculation
    // If target is 0 or missing, calculate: Daily Amount * 30 * Total Members in that Circle
    const membersInCircle = data.customers.filter(c => c.qisstId === selectedQisstId).length;
    const calculatedPayout = q.dailyAmount * 30 * membersInCircle;
    const finalAmount = q.totalTarget && q.totalTarget > 0 ? q.totalTarget : calculatedPayout;

    const newDraw: QisstDraw = {
      id: crypto.randomUUID(),
      qisstId: selectedQisstId,
      customerId: drawWinnerId,
      month: drawMonth,
      amountGiven: finalAmount,
      dateCreated: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      draws: [...prev.draws, newDraw]
    }));

    setDrawWinnerId('');
    setDrawMonth('');
    setShowToast("Month Payout Confirmed Successfully");
    setTimeout(() => setShowToast(null), 3000);
  };

  const deleteDraw = (id: string) => {
    if (!confirm("Are you sure you want to delete this draw entry?")) return;
    setData(prev => ({
      ...prev,
      draws: prev.draws.filter(d => d.id !== id)
    }));
    triggerToast("Draw Record Removed");
  };

  const startEditDraw = (draw: QisstDraw) => {
    setEditingDrawId(draw.id);
    setEditAmount(draw.amountGiven);
  };

  const saveEditDraw = () => {
    if (!editingDrawId) return;
    setData(prev => ({
      ...prev,
      draws: prev.draws.map(d => d.id === editingDrawId ? { ...d, amountGiven: editAmount } : d)
    }));
    setEditingDrawId(null);
    triggerToast("Draw Updated Successfully");
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const eligibleForDraw = useMemo(() => {
    return customerHistory.filter(c => c.qisstId === selectedQisstId && !c.hasWonDraw);
  }, [customerHistory, selectedQisstId]);

  const renderContent = () => {
    if (reportType === 'draws') {
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full"></div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-3 mb-8 uppercase tracking-[0.2em]">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Monthly Draw Allocation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Circle</label>
                <select 
                  value={selectedQisstId} 
                  onChange={e => setSelectedQisstId(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50"
                >
                  {data.qissts.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Winner Selection</label>
                <select 
                  value={drawWinnerId} 
                  onChange={e => setDrawWinnerId(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">-- Choose Eligible Member --</option>
                  {eligibleForDraw.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payout Month</label>
                <input 
                  type="month" 
                  value={drawMonth} 
                  onChange={e => setDrawMonth(e.target.value)} 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-sm outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50" 
                />
              </div>
            </div>
            <button 
              onClick={handleCreateDraw} 
              className="mt-8 w-full md:w-auto bg-slate-900 hover:bg-indigo-600 text-white px-12 py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl transition-all active:scale-95"
            >
              Confirm Month Payout
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">Draw Hall of Fame (Past Winners)</h4>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  <tr>
                    <th className="px-8 py-5">Winner Profile</th>
                    <th className="px-8 py-5">Active Circle</th>
                    <th className="px-8 py-5">Month</th>
                    <th className="px-8 py-5 text-right">Amount Awarded</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.draws.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">No payout records found in history.</td></tr>
                  ) : (
                    data.draws.map(d => {
                      const c = data.customers.find(c => c.id === d.customerId);
                      const q = data.qissts.find(q => q.id === d.qisstId);
                      const isEditing = editingDrawId === d.id;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="font-black text-slate-900 text-sm tracking-tighter">{c?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{c?.phone || 'No Contact'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-indigo-600 text-[10px] font-black uppercase bg-indigo-50 px-2 py-1 rounded-md">{q?.name || 'Archived Circle'}</span>
                          </td>
                          <td className="px-8 py-5 font-black text-slate-600 text-[11px] uppercase">{d.month}</td>
                          <td className="px-8 py-5 text-right">
                            {isEditing ? (
                              <input 
                                type="number" 
                                value={editAmount} 
                                onChange={e => setEditAmount(Number(e.target.value))}
                                className="w-32 px-3 py-1.5 border border-indigo-200 rounded-lg text-right font-black text-xs text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100"
                              />
                            ) : (
                              <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-xl text-[11px] font-black uppercase border border-green-100 shadow-sm">
                                PKR {d.amountGiven.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button onClick={saveEditDraw} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingDrawId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditDraw(d)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => deleteDraw(d.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                  </>
                                )}
                             </div>
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
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-500" />
            <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">Awaiting Payout (Rotation Queue)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <tr>
                  <th className="px-8 py-5">Member Name</th>
                  <th className="px-8 py-5">Active Circle</th>
                  <th className="px-8 py-5 text-right">Total Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerHistory.filter(c => !c.hasWonDraw).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-black text-slate-900 text-sm tracking-tight">{c.name}</td>
                    <td className="px-8 py-5 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">{c.qisstName}</td>
                    <td className="px-8 py-5 text-right font-black text-red-500 text-xs tracking-tight">PKR {c.remaining.toLocaleString()}</td>
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
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[100px] rounded-full"></div>
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-600/30">
                  {activeCust?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">{activeCust?.name}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Audit Trail Active • Since {new Date(activeCust?.startDate || '').toLocaleDateString()}</p>
                </div>
             </div>
             <div className="flex gap-4 relative z-10 w-full md:w-auto mt-6 md:mt-0">
               <div className="flex-1 bg-white/5 px-8 py-4 rounded-2xl border border-white/10 text-center backdrop-blur-md">
                  <p className="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-widest">Total Collected</p>
                  <p className="text-xl font-black text-green-400">PKR {activeCust?.totalCollected.toLocaleString()}</p>
               </div>
               <div className="flex-1 bg-white/5 px-8 py-4 rounded-2xl border border-white/10 text-center backdrop-blur-md">
                  <p className="text-[9px] uppercase font-black text-slate-400 mb-1 tracking-widest">Pending Due</p>
                  <p className="text-xl font-black text-red-400">PKR {activeCust?.remaining.toLocaleString()}</p>
               </div>
             </div>
          </div>
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h4 className="font-black text-slate-700 text-[10px] uppercase tracking-[0.2em]">Transaction Ledger</h4>
                <div className="relative w-full sm:w-auto">
                 <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                 <input 
                    type="text" 
                    placeholder="Search by date..." 
                    value={statementSearch} 
                    onChange={e => setStatementSearch(e.target.value)} 
                    className="pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 w-full sm:w-56 outline-none focus:border-indigo-500 shadow-sm" 
                 />
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Posting Date</th>
                      <th className="px-8 py-5 text-center">Status</th>
                      <th className="px-8 py-5 text-right">Credit (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledger.filter(l => l.date.includes(statementSearch)).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4.5 font-black text-slate-700 text-xs uppercase">
                          {new Date(row.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-4.5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${
                            row.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`px-8 py-4.5 text-right font-black text-xs ${row.amount > 0 ? 'text-green-600' : 'text-slate-300 italic'}`}>
                          {row.amount > 0 ? `PKR ${row.amount.toLocaleString()}` : 'Outstanding'}
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
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Member Profile</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Aggregate</th>
                <th className="px-8 py-6 text-right">Dues</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerHistory.map(ch => (
                <tr key={ch.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-900 text-sm tracking-tighter">{ch.name}</p>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tight">{ch.qisstName}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {ch.hasWonDraw ? (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-amber-200 flex items-center justify-center gap-1.5 w-fit mx-auto shadow-sm">
                        <Trophy className="w-3 h-3" /> Winner ({ch.drawMonth})
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-slate-200 w-fit mx-auto flex items-center justify-center">
                        Active Runner
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-green-600 font-black text-right text-xs">PKR {ch.totalCollected.toLocaleString()}</td>
                  <td className="px-8 py-5 text-red-500 font-black text-right text-xs">PKR {ch.remaining.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => { setSelectedCustomerId(ch.id); setReportType('statement'); }} 
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 shadow-xl transition-all active:scale-95 group-hover:bg-indigo-600"
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
    <div className="space-y-8 pb-20 relative">
      {showToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] bg-slate-900 text-white px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-5 border border-indigo-500/50 animate-in slide-in-from-top-12">
              <div className="bg-green-500 p-2 rounded-full shadow-lg shadow-green-500/50">
                <Check className="w-4 h-4 text-white stroke-[4]" />
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-[0.1em]">{showToast}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-1">Audit Protocol Verified</p>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Financial Terminal</h2>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1 opacity-70">Payout allocation & Transaction Audit.</p>
        </div>
        {reportType === 'statement' && (
          <button 
            onClick={() => setReportType('history')} 
            className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Hub
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 overflow-x-auto no-scrollbar py-2">
        {[
          { id: 'history', label: 'Financial Hub', icon: History }, 
          { id: 'draws', label: 'Draw Management', icon: Trophy }, 
          { id: 'remaining', label: 'Rotation Queue', icon: Users }
        ].map(btn => (
          <button 
            key={btn.id} 
            onClick={() => setReportType(btn.id as any)} 
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] border-2 transition-all duration-300 ${
              reportType === btn.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl shadow-indigo-600/30 scale-105' : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-300'
            }`}
          >
            <btn.icon className={`w-4 h-4 ${reportType === btn.id ? 'fill-white stroke-[3]' : 'stroke-[2.5]'}`} />
            {btn.label}
          </button>
        ))}
      </div>
      <div className="mt-8">{renderContent()}</div>
    </div>
  );
};

export default Reports;
