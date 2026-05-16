import { useAuth } from '../../contexts/AuthContext';
import { Calendar, FlaskConical, Pill, CheckCircle, Clock } from 'lucide-react';
const TODAY = [
  { time: '08:30', patient: 'James Mwangi',  type: 'OPD',       status: 'COMPLETED'   },
  { time: '09:00', patient: 'Fatuma Hassan', type: 'Follow-up', status: 'IN_PROGRESS' },
  { time: '09:30', patient: 'Peter Ochieng', type: 'OPD',       status: 'SCHEDULED'   },
  { time: '10:00', patient: 'Grace Wanjiru', type: 'Procedure', status: 'SCHEDULED'   },
  { time: '10:30', patient: 'Ali Mohammed',  type: 'OPD',       status: 'SCHEDULED'   },
];
const SC: Record<string,string> = { COMPLETED:'bg-green-100 text-green-700', IN_PROGRESS:'bg-yellow-100 text-yellow-700', SCHEDULED:'bg-blue-100 text-blue-700' };
export function DoctorDashboard() {
  const { user } = useAuth(); const p = user?.staffProfile;
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Good {new Date().getHours()<12?'morning':'afternoon'}, {p?.title} {p?.firstName}</h1><p className="text-gray-500 text-sm mt-1">{p?.specialisation} · {p?.staffNumber}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:"Today's Appointments",value:'12',bg:'bg-teal-600'},{label:'Patients Seen',value:'7',bg:'bg-green-600'},{label:'Pending Lab Results',value:'4',bg:'bg-amber-500'},{label:'Prescriptions Issued',value:'9',bg:'bg-violet-500'}].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 mb-1">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock size={16} className="text-teal-600" /> Today's Schedule</h3>
        <div className="space-y-2">{TODAY.map((a,i)=>(
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
            <span className="text-sm font-mono text-gray-500 w-12">{a.time}</span>
            <div className="flex-1"><p className="text-sm font-medium text-gray-900">{a.patient}</p><p className="text-xs text-gray-400">{a.type}</p></div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SC[a.status]}`}>{a.status.replace('_',' ')}</span>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
