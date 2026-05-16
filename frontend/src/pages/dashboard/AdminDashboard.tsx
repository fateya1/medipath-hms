// frontend/src/pages/dashboard/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import { apiGet, formatKES } from '../../utils/api';
import { DashboardStats } from '../../types';
import {
  Users, Calendar, BedDouble, FlaskConical,
  Receipt, TrendingUp, Activity, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0d9488', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

const MOCK_REVENUE = [
  { month: 'Jan', cash: 420000, mpesa: 380000, nhif: 210000 },
  { month: 'Feb', cash: 380000, mpesa: 420000, nhif: 190000 },
  { month: 'Mar', cash: 510000, mpesa: 460000, nhif: 230000 },
  { month: 'Apr', cash: 470000, mpesa: 510000, nhif: 250000 },
  { month: 'May', cash: 530000, mpesa: 550000, nhif: 280000 },
  { month: 'Jun', cash: 490000, mpesa: 500000, nhif: 260000 },
];

const MOCK_DEPARTMENT = [
  { name: 'OPD', patients: 142 },
  { name: 'A&E', patients: 67 },
  { name: 'Medicine', patients: 89 },
  { name: 'Surgery', patients: 45 },
  { name: 'Paeds', patients: 78 },
  { name: 'Obs & Gynae', patients: 56 },
];

const MOCK_PAYMENT = [
  { name: 'M-Pesa', value: 42 },
  { name: 'NHIF/SHA', value: 28 },
  { name: 'Cash', value: 22 },
  { name: 'Insurance', value: 8 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

function StatCard({ title, value, subtitle, icon, trend, trendUp, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp size={12} className={trendUp ? '' : 'rotate-180'} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiGet<DashboardStats>('/reports/dashboard'),
    // Fallback mock data while API is implemented
    placeholderData: {
      totalPatients: 3842,
      newPatientsToday: 24,
      appointmentsToday: 87,
      admittedPatients: 143,
      pendingLabRequests: 31,
      pendingInvoices: 56,
      revenueToday: 287500,
      revenueThisMonth: 4830000,
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients?.toLocaleString() ?? '—'}
          subtitle={`+${stats?.newPatientsToday ?? 0} today`}
          icon={<Users size={18} className="text-white" />}
          color="bg-teal-600"
          trend="+12% this month"
          trendUp
        />
        <StatCard
          title="Appointments Today"
          value={stats?.appointmentsToday ?? '—'}
          subtitle="OPD & specialist"
          icon={<Calendar size={18} className="text-white" />}
          color="bg-sky-500"
          trend="+5 vs yesterday"
          trendUp
        />
        <StatCard
          title="Admitted Patients"
          value={stats?.admittedPatients ?? '—'}
          subtitle="Current inpatients"
          icon={<BedDouble size={18} className="text-white" />}
          color="bg-violet-500"
        />
        <StatCard
          title="Revenue Today"
          value={formatKES(stats?.revenueToday ?? 0)}
          subtitle={`${formatKES(stats?.revenueThisMonth ?? 0)} this month`}
          icon={<Receipt size={18} className="text-white" />}
          color="bg-emerald-500"
          trend="+18% vs last month"
          trendUp
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Lab Requests"
          value={stats?.pendingLabRequests ?? '—'}
          icon={<FlaskConical size={18} className="text-white" />}
          color="bg-amber-500"
        />
        <StatCard
          title="Pending Invoices"
          value={stats?.pendingInvoices ?? '—'}
          icon={<Clock size={18} className="text-white" />}
          color="bg-rose-500"
        />
        <StatCard
          title="New Patients Today"
          value={stats?.newPatientsToday ?? '—'}
          icon={<Activity size={18} className="text-white" />}
          color="bg-cyan-500"
          trend="Registered today"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Payment Method (KES)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={MOCK_REVENUE}>
              <defs>
                <linearGradient id="cash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="mpesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatKES(v)} />
              <Legend />
              <Area type="monotone" dataKey="cash" stroke="#0d9488" fill="url(#cash)" name="Cash" />
              <Area type="monotone" dataKey="mpesa" stroke="#0ea5e9" fill="url(#mpesa)" name="M-Pesa" />
              <Area type="monotone" dataKey="nhif" stroke="#f59e0b" name="NHIF/SHA" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Patients by Department Today</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOCK_DEPARTMENT}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="patients" fill="#0d9488" radius={[4, 4, 0, 0]} name="Patients" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment split pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Split (%)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={MOCK_PAYMENT} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {MOCK_PAYMENT.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Register Patient', href: '/patients/new', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100', icon: <Users size={16} /> },
              { label: 'New Appointment', href: '/appointments/new', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100', icon: <Calendar size={16} /> },
              { label: 'Create Invoice', href: '/billing/new', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', icon: <Receipt size={16} /> },
              { label: 'Lab Requests', href: '/lab', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', icon: <FlaskConical size={16} /> },
            ].map(action => (
              <a
                key={action.label}
                href={action.href}
                className={`flex items-center gap-3 p-4 rounded-xl font-medium text-sm transition-colors ${action.color}`}
              >
                {action.icon}
                {action.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
