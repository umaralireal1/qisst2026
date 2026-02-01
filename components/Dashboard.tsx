import React, { useMemo } from 'react';
import { Users, CreditCard, Calendar, TrendingUp, Bell, AlertCircle, CheckCircle2, Trophy } from 'lucide-react';
import { AppData, PaymentStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface Props {
  data: AppData;
}

const Dashboard: React.FC<Props> = ({ data }) => {
  const today = new Date().toISOString().split('T')[0];

  const totalCustomers = data.customers.length;
  const totalCollected = data.attendance.reduce((acc, rec) => acc + rec.amountPaid, 0);
  
  // Real-time Analytics
  const unpaidToday = useMemo(() => {
    return data.customers.filter(c => {
      const record = data.attendance.find(a => a.customerId === c.id && a.date === today);
      return !record || record.status === PaymentStatus.UNPAID;
    });
  }, [data.customers, data.attendance, today]);

  const drawReminders = useMemo(() => {
    return data.qissts.filter(q => {
      const startDate = new Date(q.startDate);
      const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const expectedDraws = Math.floor(diffDays / 30);
      const actualDraws = data.draws.filter(d => d.qisstId === q.id).length;
      return actualDraws < expectedDraws && actualDraws < data.customers.filter(c => c.qisstId === q.id).length;
    });
  }, [data.qissts, data.draws, data.customers]);

  const qisstSummary = data.qissts.map(q => {
    const collected = data.attendance
      .filter(rec => rec.qisstId === q.id)
      .reduce((acc, rec) => acc + rec.amountPaid, 0);
    return { name: q.name, value: collected };
  });

  const stats = [
    { label: 'Total Members', value: totalCustomers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Collection', value: `PKR ${totalCollected.toLocaleString()}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Unpaid Today', value: unpaidToday.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Active Circles', value: data.qissts.length, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Insights</h2>
        <p className="text-slate-500 text-sm">Real-time installment and draw monitoring.</p>
      </header>

      {/* Reminders Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Priority Alerts</h3>
          </div>
          <div className="space-y-3">
            {unpaidToday.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <p className="text-xs font-bold text-red-700">{unpaidToday.length} Members haven't paid today.</p>
                </div>
                <TrendingUp className="w-4 h-4 text-red-300" />
              </div>
            )}
            
            {drawReminders.map((q) => {
              return (
                <div key={q.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-indigo-600" />
                    <p className="text-xs font-bold text-indigo-700">Cycle Complete: Pick winner for {q.name}.</p>
                  </div>
                  <span className="text-[10px] font-black text-indigo-400">30 DAYS +</span>
                </div>
              );
            })}

            {unpaidToday.length === 0 && drawReminders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">All Records Up to Date</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
           <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Enterprise Ledger</p>
           <h3 className="text-white text-3xl font-black tracking-tighter mb-1">PKR {totalCollected.toLocaleString()}</h3>
           <p className="text-slate-500 text-xs font-bold">Total Vault Collection</p>
           <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">System Architect</p>
              <p className="text-white font-bold text-sm tracking-tight">Powered By Umar Ali</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 transition-all hover:border-indigo-200">
            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Collection Spread</h3>
          <div className="h-64 w-full">
            {qisstSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={qisstSummary} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={8} dataKey="value">
                    {qisstSummary.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold">Waiting for Data...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Growth Trends</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qisstSummary}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;