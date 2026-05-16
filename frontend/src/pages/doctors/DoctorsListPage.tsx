// frontend/src/pages/doctors/DoctorsListPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet } from '../../utils/api';
import { Search, Stethoscope, ChevronRight } from 'lucide-react';

export function DoctorsListPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search],
    queryFn: () => apiGet<any>(`/doctors?search=${search}&limit=50`),
  });
  const doctors = data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Doctors</h1><p className="text-gray-500 text-sm">{data?.pagination?.total ?? '—'} clinical staff</p></div>
        <Link to="/staff/new?role=DOCTOR" className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors">+ Add Doctor</Link>
      </div>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, specialisation…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({length:6}).map((_,i)=>(
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"><div className="w-12 h-12 bg-gray-200 rounded-full mb-3"/><div className="h-4 bg-gray-200 rounded w-3/4 mb-2"/><div className="h-3 bg-gray-100 rounded w-1/2"/></div>
        )) : doctors.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-gray-400">
            <Stethoscope size={40} className="mx-auto mb-3 opacity-30"/>
            <p>No doctors found</p>
          </div>
        ) : doctors.map((d:any)=>(
          <Link key={d.id} to={`/doctors/${d.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-sm transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-lg flex-shrink-0">
                {d.firstName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{d.title} {d.firstName} {d.lastName}</p>
                <p className="text-sm text-teal-600">{d.specialisation || 'General Practice'}</p>
                <p className="text-xs text-gray-400 mt-1">{d.department?.name || '—'} · {d.staffNumber}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-teal-500 transition-colors mt-1 flex-shrink-0"/>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
