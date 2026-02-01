
import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Target, Hash, Wallet, X, Check } from 'lucide-react';
import { AppData, Qisst } from '../types';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const QisstManager: React.FC<Props> = ({ data, setData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [newQisst, setNewQisst] = useState<Partial<Qisst>>({
    name: '',
    dailyAmount: 100,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleAdd = () => {
    if (!newQisst.name?.trim() || !newQisst.dailyAmount) {
      alert("Circle name and daily amount are required.");
      return;
    }

    // UNIQUE NAME VALIDATION
    const nameExists = data.qissts.some(q => q.name.toLowerCase() === newQisst.name?.toLowerCase().trim());
    if (nameExists) {
      alert("A circle with this name already exists. Please choose a unique name for each circle.");
      return;
    }

    const id = crypto.randomUUID();
    const q: Qisst = {
      id,
      name: newQisst.name.trim(),
      dailyAmount: Number(newQisst.dailyAmount),
      startDate: newQisst.startDate || new Date().toISOString().split('T')[0],
      totalTarget: newQisst.totalTarget ? Number(newQisst.totalTarget) : undefined
    };

    setData(prev => ({ ...prev, qissts: [...prev.qissts, q] }));
    setIsAdding(false);
    setNewQisst({ name: '', dailyAmount: 100, startDate: new Date().toISOString().split('T')[0] });
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const deleteQisst = (id: string) => {
    if (!confirm('Are you sure? This will delete everything in this circle.')) return;
    setData(prev => ({
      ...prev,
      qissts: prev.qissts.filter(q => q.id !== id),
      customers: prev.customers.filter(c => c.qisstId !== id),
      attendance: prev.attendance.filter(a => a.qisstId !== id)
    }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      {showToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-500/50">
              <Check className="w-4 h-4 text-green-400" />
              <div>
                <p className="font-bold text-xs uppercase tracking-widest">Circle Saved Successfully</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered By Umar Ali</p>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Qisst Circles</h2>
          <p className="text-slate-500 text-sm">Organize and monitor your savings groups.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          Create Circle
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               <Wallet className="w-5 h-5 text-indigo-600" />
               New Circle Configuration
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Unique Circle Name</label>
              <input type="text" value={newQisst.name} onChange={e => setNewQisst({...newQisst, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm font-bold outline-none" placeholder="e.g. Savings 2024" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Daily Amount (PKR)</label>
              <input type="number" value={newQisst.dailyAmount} onChange={e => setNewQisst({...newQisst, dailyAmount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
              <input type="date" value={newQisst.startDate} onChange={e => setNewQisst({...newQisst, startDate: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm font-bold outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Total Target (Lump Sum)</label>
              <input type="number" value={newQisst.totalTarget || ''} onChange={e => setNewQisst({...newQisst, totalTarget: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm font-bold outline-none" placeholder="Payout amount" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={() => setIsAdding(false)} className="px-6 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest">Cancel</button>
            <button onClick={handleAdd} className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md transition-all active:scale-95">Initialize Circle</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.qissts.map(q => {
          const count = data.customers.filter(c => c.qisstId === q.id).length;
          const collected = data.attendance.filter(a => a.qisstId === q.id).reduce((sum, r) => sum + r.amountPaid, 0);
          return (
            <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 group hover:border-indigo-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg"><Hash className="w-4 h-4 text-indigo-600" /></div>
                <button onClick={() => deleteQisst(q.id)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{q.name}</h3>
              <div className="mt-4 space-y-2 border-t border-slate-50 pt-3">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400"><span>Daily Rate:</span><span className="text-indigo-600">PKR {q.dailyAmount}</span></div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400"><span>Total Collected:</span><span className="text-green-600">PKR {collected.toLocaleString()}</span></div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400"><span>Members:</span><span className="text-slate-900">{count}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QisstManager;
