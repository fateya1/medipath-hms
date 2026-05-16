export function LabDashboard() {
  const urgent = [{patient:'Mary Akinyi',test:'Full Blood Count',urgency:'STAT',time:'08:15'},{patient:'John Kamau',test:'Malaria RDT',urgency:'URGENT',time:'09:00'},{patient:'Amina Abdi',test:'Renal Function Test',urgency:'STAT',time:'09:45'}];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Laboratory Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Pending Requests',value:'14'},{label:'Samples Collected',value:'9'},{label:'Results Pending',value:'6'},{label:'Completed Today',value:'28'}].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 mb-2">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">STAT / Urgent Requests</h3>
        <div className="space-y-2">{urgent.map((r,i)=>(
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><p className="text-sm font-medium text-gray-900">{r.patient}</p><p className="text-xs text-gray-500">{r.test}</p></div>
            <div className="text-right"><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${r.urgency==='STAT'?'bg-red-100 text-red-700':'bg-orange-100 text-orange-700'}`}>{r.urgency}</span><p className="text-xs text-gray-400 mt-1">{r.time}</p></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
