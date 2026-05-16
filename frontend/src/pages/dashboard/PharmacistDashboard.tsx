export function PharmacistDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Pending Prescriptions',value:'18',bg:'bg-amber-500'},{label:'Dispensed Today',value:'43',bg:'bg-green-600'},{label:'Low Stock Alerts',value:'7',bg:'bg-red-500'},{label:'Expiry Alerts',value:'3',bg:'bg-orange-500'}].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 mb-2">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value}</p><div className={`mt-2 h-1 rounded-full ${s.bg} opacity-60`}/></div>
        ))}
      </div>
    </div>
  );
}
