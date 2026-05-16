// frontend/src/pages/pharmacy/PrescriptionsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../utils/api';
import { Prescription } from '../../types';
import { Search, Pill } from 'lucide-react';

const STATUS_COLORS: Record<string,string> = {
  ISSUED:'bg-yellow-100 text-yellow-700',
  DISPENSED:'bg-green-100 text-green-700',
  PARTIALLY_DISPENSED:'bg-blue-100 text-blue-700',
  CANCELLED:'bg-red-100 text-red-700',
};

export function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', search, status],
    queryFn:  () => apiGet<any>(`/pharmacy/prescriptions?search=${search}&status=${status}&limit=50`),
  });
  const prescriptions: Prescription[] = data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1><p className="text-gray-500 text-sm">Manage and dispense prescriptions</p></div>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search prescriptions…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Statuses</option>
          {['ISSUED','DISPENSED','PARTIALLY_DISPENSED','CANCELLED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>
        : prescriptions.length===0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><Pill size={40} className="mb-3 opacity-30"/><p>No prescriptions found</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Rx No.','Patient','Doctor','Items','Status','Issued At','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prescriptions.map(rx=>(
                <tr key={rx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-teal-700 font-semibold">{rx.prescriptionNo}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">—</td>
                  <td className="px-4 py-3 text-gray-600">{rx.doctor ? `${rx.doctor.title??''} ${rx.doctor.firstName} ${rx.doctor.lastName}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{rx.items?.length ?? 0} drug{rx.items?.length!==1?'s':''}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[rx.status]}`}>{rx.status.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(rx.issuedAt).toLocaleString('en-KE',{dateStyle:'short',timeStyle:'short'})}</td>
                  <td className="px-4 py-3">
                    {rx.status==='ISSUED' && (
                      <button className="text-xs px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">Dispense</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
