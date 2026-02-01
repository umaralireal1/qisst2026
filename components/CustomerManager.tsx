
import React, { useState } from 'react';
import { Plus, UserPlus, Phone, Search, Trash2, Calendar, LayoutGrid, AlertCircle, CheckCircle2, X, Check } from 'lucide-react';
import { AppData, Customer } from '../types';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

const CustomerManager: React.FC<Props> = ({ data, setData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [search, setSearch] = useState('');
  const [newCust, setNewCust] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    qisstId: data.qissts[0]?.id || '',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const handleRegister = () => {
    if (!newCust.name?.trim()) { alert("Name is required!"); return; }
    const selectedQisstId = newCust.qisstId || (data.qissts[0]?.id || '');
    if (!selectedQisstId) { alert("Create a circle first!"); return; }

    const newMember: Customer = {
      id: crypto.randomUUID(),
      name: newCust.name.trim(),
      phone: newCust.phone || 'N/A',
      qisstId: selectedQisstId,
      joiningDate: newCust.joiningDate || new Date().toISOString().split('T')[0]
    };

    setData(prev => ({ ...prev, customers: [...prev.customers, newMember] }));
    setIsAdding(false);
    setNewCust({ name: '', phone: '', qisstId: data.qissts[0]?.id || '', joiningDate: new Date().toISOString().split('T')[0] });
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const deleteCust = (id: string) => {
    if (!confirm('Are you sure? All records will be wiped.')) return;
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
      attendance: prev.attendance.filter(a => a.customerId !== id)
    }));
  };

  const filtered = data.customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
      {showToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-500/50">
              <Check className="w-4 h-4 text-green-400" />
              <div>
                <p className="font-bold text-xs uppercase tracking-widest">Member Registered Successfully</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered By Umar Ali</p>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Member Directory</h2>
          <p className="text-slate-500 text-sm">Enroll and manage circle participants.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-bold outline-none" />
          </div>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"><UserPlus className="w-4 h-4" />Enroll</button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600" />Enroll Member</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Member Name</label><input type="text" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm font-bold outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contact</label><input type="text" value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 text-slate-900 text-sm font-bold outline-none" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Circle</label><select value={newCust.qisstId} onChange={e => setNewCust({...newCust, qisstId: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none">{data.qissts.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Enroll Date</label><input type="date" value={newCust.joiningDate} onChange={e => setNewCust({...newCust, joiningDate: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-8"><button onClick={handleRegister} className="px-8 py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md transition-all active:scale-95">Enroll Member</button></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100"><th className="px-6 py-4">Member</th><th className="px-6 py-4">Circle</th><th className="px-6 py-4">Enrolled</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => {
              const q = data.qissts.find(q => q.id === c.qisstId);
              return (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3"><p className="font-bold text-slate-900 text-sm">{c.name}</p><p className="text-[10px] text-slate-500">{c.phone}</p></td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">{q?.name}</span></td>
                  <td className="px-6 py-3 text-slate-500 text-xs">{new Date(c.joiningDate).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-right"><button onClick={() => deleteCust(c.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManager;
