// frontend/src/pages/reports/ReportsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, formatKES } from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { BarChart3, Download, Calendar } from 'lucide-react';

const COLORS = ['#0d9488','#0ea5e9','#f59e0b','#ef4444','#8b5cf6','#10b981'];

const MONTHLY_PATIENTS = [
  {month:'Jan',opd:320,inpatient:45,emergency:67},{month:'Feb',opd:290,inpatient:52,emergency:59},
  {month:'Mar',opd:410,inpatient:61,emergency:78},{month:'Apr',opd:380,inpatient:48,emergency:72},
  {month:'May',opd:450,inpatient:55,emergency:83},{month:'Jun',opd:430,inpatient:63,emergency:76},
];
const DIAGNOSIS_TOP = [
  {name:'Malaria',count:142},{name:'Hypertension',count:98},{name:'Diabetes',count:87},
  {name:'Pneumonia',count:76},{name:'Anaemia',count:65},{name:'UTI',count:58},
  {name:'Gastroenteritis',count:54},{name:'TB',count:41},
];
const REVENUE_TREND = [
  {month:'Jan',total:980000},{month:'Feb',total:870000},{month:'Mar',total:1120000},
  {month:'Apr',total:1050000},{month:'May',total:1280000},{month:'Jun',total:1190000},
];
const PAYMENT_SPLIT = [
  {name:'M-Pesa',value:38},{name:'NHIF/SHA',value:29},{name:'Cash',value:21},
  {name:'Insurance',value:9},{name:'Waiver',value:3},
];
const DEPT_UTILISATION = [
  {dept:'OPD',patients:1420,capacity:1600},{dept:'Medicine',patients:87,capacity:100},
  {dept:'Surgery',patients:42,capacity:60},{dept:'Paeds',patients:78,capacity:80},
  {dept:'Obs & Gynae',patients:55,capacity:70},{dept:'ICU',patients:14,capacity:16},
];

type ReportTab = 'overview'|'patients'|'diagnoses'|'revenue'|'departments'|'labs';

export function ReportsPage() {
  const [tab, setTab]         = useState<ReportTab>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const tabs: { key: ReportTab; label: string }[] = [
    {key:'overview',    label:'Overview'},
    {key:'patients',    label:'Patient Census'},
    {key:'diagnoses',   label:'Diagnoses'},
    {key:'revenue',     label:'Revenue'},
    {key:'departments', label:'Department Utilisation'},
    {key:'labs',        label:'Lab TAT'},
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={22} className="text-teal-600"/>Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Hospital performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={15}/>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
            <span>to</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 font-medium">
            <Download size={15}/> Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t.key?'bg-white text-teal-700 shadow-sm':'text-gray-600 hover:text-gray-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab==='overview' && (
        <div className="space-y-5">
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:'Total Patients (YTD)',     value:'4,218',  sub:'+12% vs last year',  color:'bg-teal-600'},
              {label:'Total Revenue (YTD)',       value:formatKES(6490000), sub:'6 months',color:'bg-emerald-600'},
              {label:'Avg. Length of Stay',       value:'4.2 days', sub:'Inpatient',       color:'bg-sky-500'},
              {label:'Bed Occupancy Rate',        value:'78%',    sub:'All wards',          color:'bg-violet-500'},
            ].map(kpi=>(
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`w-2 h-8 ${kpi.color} rounded-full mb-3`}/>
                <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-xs font-medium text-gray-600 mt-0.5">{kpi.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue (KES)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={REVENUE_TREND}>
                  <defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{fontSize:12}}/>
                  <YAxis tick={{fontSize:12}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                  <Tooltip formatter={(v:number)=>formatKES(v)}/>
                  <Area type="monotone" dataKey="total" stroke="#0d9488" fill="url(#rv)" name="Revenue"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method Split (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={PAYMENT_SPLIT} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {PAYMENT_SPLIT.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>`${v}%`}/>
                  <Legend/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Patient Census ── */}
      {tab==='patients' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Patient Volume by Visit Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MONTHLY_PATIENTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:12}}/>
                <Tooltip/>
                <Legend/>
                <Bar dataKey="opd"       fill="#0d9488" name="OPD"       radius={[3,3,0,0]}/>
                <Bar dataKey="inpatient" fill="#0ea5e9" name="Inpatient" radius={[3,3,0,0]}/>
                <Bar dataKey="emergency" fill="#f59e0b" name="Emergency" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Summary table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50"><h3 className="font-semibold text-gray-900 text-sm">Monthly Summary</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b">{['Month','OPD','Inpatient','Emergency','Total'].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {MONTHLY_PATIENTS.map(r=>(
                  <tr key={r.month} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.month}</td>
                    <td className="px-4 py-2.5 text-gray-700">{r.opd.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-700">{r.inpatient.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-700">{r.emergency.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-semibold text-teal-700">{(r.opd+r.inpatient+r.emergency).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Diagnoses ── */}
      {tab==='diagnoses' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Diagnoses (6 months)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={DIAGNOSIS_TOP} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis type="number" tick={{fontSize:12}}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:12}} width={120}/>
              <Tooltip/>
              <Bar dataKey="count" fill="#0d9488" radius={[0,4,4,0]} name="Cases"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Revenue ── */}
      {tab==='revenue' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend (KES)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={REVENUE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:12}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
                <Tooltip formatter={(v:number)=>formatKES(v)}/>
                <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2} dot={{fill:'#0d9488'}} name="Revenue"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {label:'Cash Collections',     value:formatKES(1382000), pct:'21%'},
              {label:'M-Pesa Payments',       value:formatKES(2498000), pct:'38%'},
              {label:'NHIF / SHA Claims',     value:formatKES(1905000), pct:'29%'},
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                <p className="text-xs text-teal-600 font-medium mt-0.5">{s.pct} of total</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Department Utilisation ── */}
      {tab==='departments' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Department Utilisation</h3>
          <div className="space-y-3">
            {DEPT_UTILISATION.map(d=>{
              const pct = Math.round((d.patients/d.capacity)*100);
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{d.dept}</span>
                    <span className={`text-sm font-semibold ${pct>=90?'text-red-600':pct>=70?'text-amber-600':'text-green-600'}`}>{pct}% ({d.patients}/{d.capacity})</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct>=90?'bg-red-500':pct>=70?'bg-amber-400':'bg-teal-500'}`} style={{width:`${Math.min(pct,100)}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lab TAT ── */}
      {tab==='labs' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Average Lab Turnaround Time (hours)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                {test:'FBC',tat:2.1},{test:'RFT',tat:4.5},{test:'LFT',tat:4.2},{test:'Malaria RDT',tat:0.5},
                {test:'Culture',tat:72},{test:'Thyroid',tat:6.0},{test:'HIV',tat:1.0},{test:'Glucose',tat:0.3},
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="test" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:12}}/>
                <Tooltip/>
                <Bar dataKey="tat" fill="#0ea5e9" radius={[4,4,0,0]} name="TAT (hrs)"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {label:'Tests This Month', value:'1,847'},
              {label:'Avg. TAT (Routine)', value:'3.8 hrs'},
              {label:'Avg. TAT (STAT)',    value:'0.9 hrs'},
              {label:'Abnormal Results',  value:'14.2%'},
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
