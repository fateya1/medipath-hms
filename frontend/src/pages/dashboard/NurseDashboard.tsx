import { useAuth } from '../../contexts/AuthContext';
export function NurseDashboard() {
  const { user } = useAuth(); const p = user?.staffProfile;
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Nursing Station</h1><p className="text-gray-500 text-sm">{p?.firstName} {p?.lastName} · {p?.staffNumber}</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{label:'Triage Queue',value:'8',bg:'bg-red-500'},{label:'Vitals Pending',value:'14',bg:'bg-amber-500'},{label:'Ward Patients',value:'32',bg:'bg-teal-600'}].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500 mb-2">{s.label}</p><div className="flex items-center gap-3"><div className={`w-3 h-10 ${s.bg} rounded-full`}/><p className="text-3xl font-bold text-gray-900">{s.value}</p></div></div>
        ))}
      </div>
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5"><p className="font-semibold text-teal-800 mb-1">Shift Handover Reminder</p><p className="text-sm text-teal-700">Next shift at 14:00. Complete pending vitals and update ward notes before handover.</p></div>
    </div>
  );
}
