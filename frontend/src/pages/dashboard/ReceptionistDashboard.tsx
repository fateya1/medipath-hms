import { Users, Calendar } from 'lucide-react';
export function ReceptionistDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Check-ins Today',value:'47',bg:'bg-teal-600'},{label:'Appointments Booked',value:'23',bg:'bg-sky-500'},{label:'Pending Payments',value:'12',bg:'bg-amber-500'},{label:'Walk-ins',value:'18',bg:'bg-violet-500'}].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"><div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}><span className="text-white font-bold text-sm">{s.value}</span></div><p className="text-sm font-medium text-gray-700">{s.label}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <a href="/patients/new" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors"><Users size={24}/><div><p className="font-bold">Register New Patient</p><p className="text-sm text-teal-200">Walk-in registration</p></div></a>
        <a href="/appointments/new" className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors"><Calendar size={24}/><div><p className="font-bold">Book Appointment</p><p className="text-sm text-sky-200">Schedule OPD or specialist</p></div></a>
      </div>
    </div>
  );
}
