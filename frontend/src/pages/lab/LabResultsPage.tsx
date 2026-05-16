// frontend/src/pages/lab/LabResultsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../utils/api';
import { FlaskConical, AlertTriangle } from 'lucide-react';

export function LabResultsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['lab-results'],
    queryFn:  () => apiGet<any>('/lab/results?limit=50'),
  });
  const results = data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>
        : results.length===0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><FlaskConical size={40} className="mb-3 opacity-30"/><p>No results yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>{['Patient','Test','Result','Normal Range','Technician','Resulted At'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r:any)=>(
                <tr key={r.id} className={`hover:bg-gray-50 ${r.isAbnormal?'bg-red-50/30':''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.patient?.firstName} {r.patient?.lastName}</td>
                  <td className="px-4 py-3 text-gray-700">{r.labTest?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.isAbnormal?'text-red-600':'text-green-700'}`}>{r.value} {r.unit}</span>
                    {r.isAbnormal && <AlertTriangle size={13} className="inline ml-1 text-red-500"/>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.normalRange||'—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.resultedAt).toLocaleString('en-KE',{dateStyle:'short',timeStyle:'short'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
