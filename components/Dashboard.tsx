
import React, { useMemo } from 'react';
import { Users, CreditCard, Calendar, TrendingUp, Bell, AlertCircle, CheckCircle2, Trophy, Clock } from 'lucide-react';
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
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();

  const totalCustomers = data.customers.length;
  const totalCollected = data.attendance.reduce((acc, rec) => acc + rec.amountPaid, 0);
  
  // Real-time Analytics
  const unpaidToday = useMemo(() => {
    return data.customers.filter(c => {
      const record = data.attendance.find(a => a.customerId === c.id && a.date === todayStr);
      return !record || record.status === PaymentStatus.UNPAID;
    });
  }, [data.customers, data.attendance, todayStr]);

  // SMART INTELLISENSE: 30-Day Cycle Logic
  const cycleAlerts = useMemo(() => {
    return data.qissts.map(q => {
      const startDate = new Date(q.startDate);
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const dayInCycle = diffDays % 30;
      const daysRemaining = 30 - dayInCycle;
      const cycleNumber = Math.floor(diffDays / 30) + 1;
      
      // Warning starts 5 days before 30-day mark
      const isWarning = dayInCycle >= 25 || dayInCycle === 0; 
      
      return {
        ...q,
        dayInCycle,
        daysRemaining,
        isWarning,
        cycleNumber
      };
    }).filter(q => q.isWarning);
  }, [data.qissts, today]);

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
        <p className="text-slate-500 text-sm font-medium">Monitoring 30-day payout cycles and daily compliance.</p>
      </header>

      {/* Reminders Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg"><Bell className="w-4 h-4 text-amber-600" /></div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Priority Alerts</h3>
          </div>
          <div className="space-y-4">
            {unpaidToday.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  <p className="text-xs font-black text-red-900 uppercase tracking-tight">{unpaidToday.length} Daily Payments Pending</p>
                </div>
                <TrendingUp className="w-4 h-4 text-red-400" />
              </div>
            )}
            
            {cycleAlerts.map((q) => (
              <div key={q.id} className="flex flex-col gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">Cycle #{q.cycleNumber} Ending Soon</p>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-1 rounded-lg border border-indigo-100">
                    {q.daysRemaining === 30 ? 'DUE TODAY' : `${q.daysRemaining} DAYS LEFT`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                  Circle <span className="text-indigo-600 font-black">{q.name}</span> is completing its 30-day rotation. 
                  Prepare for the draw and winner announcement.
                </p>
              </div>
            ))}

            {unpaidToday.length === 0 && cycleAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Harmony</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col justify-center relative overflow-hidden group">
           <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700"></div>
           <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">Master Vault Liquidity</p>
           <h3 className="text-white text-4xl font-black tracking-tighter mb-2">PKR {totalCollected.toLocaleString()}</h3>
           <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Aggregate System Collection</p>
           <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Architect</p>
                <p className="text-white font-black text-sm tracking-tight">Umar Ali</p>
              </div>
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
                <Trophy className="w-5 h-5 text-white" />
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-100 flex items-center gap-5 transition-all hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1">
            <div className={`p-3 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
              <p className="text-xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Circle Distribution</h3>
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
          </div>
          <div className="h-72 w-full">
            {qisstSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={qisstSummary} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={10} dataKey="value">
                    {qisstSummary.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '900' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Awaiting Circle Initialization...</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Growth Projections</h3>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qisstSummary}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '900' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
