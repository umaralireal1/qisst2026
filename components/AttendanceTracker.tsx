
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, Save, Check, Zap, Database, User } from 'lucide-react';
import { AppData, PaymentStatus, AttendanceRecord } from '../types';

interface Props {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

interface LocalRecord {
  status: PaymentStatus | null;
  amountPaid: number;
  isDirty: boolean; 
  isBulkPending: boolean; 
  bulkCount: number;
}

const AttendanceTracker: React.FC<Props> = ({ data, setData }) => {
  const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedQisstId, setSelectedQisstId] = useState(data.qissts[0]?.id || '');
  const [search, setSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [localRecords, setLocalRecords] = useState<Record<string, LocalRecord>>({});

  const selectedQisst = data.qissts.find(q => q.id === selectedQisstId);

  const filteredCustomers = useMemo(() => {
    return data.customers.filter(c => c.qisstId === selectedQisstId)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [data.customers, selectedQisstId, search]);

  useEffect(() => {
    const newLocal: Record<string, LocalRecord> = {};
    filteredCustomers.forEach(cust => {
      const record = data.attendance.find(a => a.customerId === cust.id && a.date === selectedDate && a.qisstId === selectedQisstId);
      newLocal[cust.id] = {
        status: record?.status || null,
        amountPaid: record ? record.amountPaid : (selectedQisst?.dailyAmount || 0),
        isDirty: false,
        isBulkPending: false,
        bulkCount: 0
      };
    });
    setLocalRecords(newLocal);
  }, [selectedDate, selectedQisstId, data.attendance, filteredCustomers, selectedQisst]);

  const updateSingleStatus = (customerId: string, status: PaymentStatus) => {
    setLocalRecords(prev => ({
      ...prev,
      [customerId]: { ...prev[customerId], status, amountPaid: selectedQisst?.dailyAmount || 0, isDirty: true, isBulkPending: false }
    }));
  };

  const handleSaveSingleEntry = (customerId: string) => {
    const local = localRecords[customerId];
    if (!local.status || !selectedQisst) return;

    setData(prev => {
      const filtered = prev.attendance.filter(a => !(a.customerId === customerId && a.date === selectedDate && a.qisstId === selectedQisstId));
      const newRec: AttendanceRecord = { date: selectedDate, customerId, qisstId: selectedQisstId, status: local.status!, amountPaid: local.amountPaid };
      return { ...prev, attendance: [...filtered, newRec] };
    });

    setLocalRecords(prev => ({ ...prev, [customerId]: { ...prev[customerId], isDirty: false } }));
    setShowSuccess(`Entry Saved for ${selectedDate}`);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handlePrepareBulk = (customerId: string) => {
    const customer = data.customers.find(c => c.id === customerId);
    if (!customer || !selectedQisst) return;
    const [tY, tM, tD] = selectedDate.split('-').map(Number);
    const targetDate = new Date(tY, tM - 1, tD);
    const joinParts = customer.joiningDate.split('-').map(Number);
    const joinDate = new Date(joinParts[0], joinParts[1] - 1, joinParts[2]);
    if (joinDate > targetDate) { alert("Invalid date selection."); return; }

    let count = 0;
    let temp = new Date(joinDate);
    while (temp <= targetDate) { count++; temp.setDate(temp.getDate() + 1); }

    setLocalRecords(prev => ({ ...prev, [customerId]: { ...prev[customerId], status: PaymentStatus.PAID, isBulkPending: true, bulkCount: count, isDirty: false } }));
  };

  const handleCommitBulkSave = (customerId: string) => {
    const customer = data.customers.find(c => c.id === customerId);
    if (!customer || !selectedQisst) return;
    const [tY, tM, tD] = selectedDate.split('-').map(Number);
    const targetDate = new Date(tY, tM - 1, tD);
    const joinParts = customer.joiningDate.split('-').map(Number);
    let iterDate = new Date(joinParts[0], joinParts[1] - 1, joinParts[2]);

    const bulkRecords: AttendanceRecord[] = [];
    while (iterDate <= targetDate) {
      bulkRecords.push({ date: getLocalDateString(iterDate), customerId, qisstId: selectedQisstId, status: PaymentStatus.PAID, amountPaid: selectedQisst.dailyAmount });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    setData(prev => {
      const dates = bulkRecords.map(r => r.date);
      const cleaned = prev.attendance.filter(a => !(a.customerId === customerId && a.qisstId === selectedQisstId && dates.includes(a.date)));
      return { ...prev, attendance: [...cleaned, ...bulkRecords] };
    });

    setLocalRecords(prev => ({ ...prev, [customerId]: { ...prev[customerId], isBulkPending: false, bulkCount: 0, isDirty: false } }));
    setShowSuccess(`${bulkRecords.length} Days Saved Successfully`);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {showSuccess && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-indigo-500/50">
              <Check className="w-4 h-4 text-green-400" />
              <div>
                <p className="font-bold text-xs uppercase tracking-widest">{showSuccess}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered By Umar Ali</p>
              </div>
          </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Collection</h2><p className="text-slate-500 text-sm">Update and commit ledger records.</p></div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select value={selectedQisstId} onChange={e => setSelectedQisstId(e.target.value)} className="flex-1 lg:flex-none px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm outline-none">{data.qissts.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}</select>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm outline-none" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200"><div className="relative"><Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" /><input type="text" placeholder="Find member..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 border border-transparent transition-all" /></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredCustomers.map(cust => {
          const local = localRecords[cust.id] || { status: null, amountPaid: 0, isDirty: false, isBulkPending: false, bulkCount: 0 };
          return (
            <div key={cust.id} className={`bg-white p-5 rounded-2xl border transition-all flex flex-col gap-5 shadow-sm ${local.isDirty || local.isBulkPending ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start"><div className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /><h4 className="font-bold text-slate-900 text-base truncate max-w-[120px]">{cust.name}</h4></div>{local.status === PaymentStatus.PAID && !local.isDirty && <div className="bg-green-500 text-white p-0.5 rounded-full"><Check className="w-3 h-3 stroke-[5]" /></div>}</div>
              <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <button onClick={() => handlePrepareBulk(cust.id)} disabled={local.isBulkPending} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900 text-white font-bold text-[9px] uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-40 transition-all"><Zap className="w-3 h-3 fill-current" />Bulk Previous</button>
                {local.isBulkPending && <button onClick={() => handleCommitBulkSave(cust.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white font-bold text-[9px] uppercase tracking-widest shadow-md animate-pulse"><Database className="w-3 h-3" />Save {local.bulkCount}d</button>}
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => updateSingleStatus(cust.id, PaymentStatus.PAID)} className={`flex-1 py-3 rounded-xl transition-all border-2 flex flex-col items-center gap-1 ${local.status === PaymentStatus.PAID ? 'bg-green-600 border-green-700 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-300'}`}><CheckCircle className="w-4 h-4" /><span className="text-[8px] font-bold uppercase tracking-widest">Paid</span></button>
                  <button onClick={() => updateSingleStatus(cust.id, PaymentStatus.UNPAID)} className={`flex-1 py-3 rounded-xl transition-all border-2 flex flex-col items-center gap-1 ${local.status === PaymentStatus.UNPAID ? 'bg-red-600 border-red-700 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-300'}`}><XCircle className="w-4 h-4" /><span className="text-[8px] font-bold uppercase tracking-widest">Unpaid</span></button>
                </div>
                <button onClick={() => handleSaveSingleEntry(cust.id)} disabled={!local.isDirty} className={`w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${local.isDirty ? 'bg-indigo-600 text-white hover:bg-black shadow-md' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}><Save className="w-3.5 h-3.5" />Save Selection</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceTracker;
