// frontend/src/pages/lab/LabRequestsPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../utils/api';
import { LabRequest } from '../../types';
import { Search, FlaskConical } from 'lucide-react';

const URGENCY_COLORS: Record<string,string> = { ROUTINE:'bg-gray-100 text-gray-700', URGENT:'bg-orange-100 text-orange-700', STAT:'bg-red-100 text-red-700' };
const STATUS_COLORS: Record<string,string>  = { REQUESTED:'bg-yellow-100 text-yellow-700', SAMPLE_COLLECTED:'bg-blue-100 text-blue-700', PROCESSING:'bg-purple-100 text-purple-700', COMPLETED:'bg-green-100 text-green-700', CANCELLED:'bg-red-100 text-red-700' };

export function LabRequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lab-requests', search, status],
    queryFn:  () => apiGet<any>(`/lab/requests?search=${search}&status=${status}&limit=50`),
  });
  const requests: LabRequest[] = data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Lab Requests</h1><p className="text-gray-500 text-sm">Track investigations and results</p></div>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient, request number…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Statuses</option>
          {['REQUESTED','SAMPLE_COLLECTED','PROCESSING','COMPLETED','CANCELLED'].map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>
        : requests.length===0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400"><FlaskConical size={40} className="mb-3 opacity-30"/><p>No lab requests found</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Request No.','Patient','Tests','Requested By','Urgency','Status','Requested','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(req=>(
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-teal-700 font-semibold">{req.requestNo}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">—</td>
                  <td className="px-4 py-3 text-gray-600">{req.items?.map(i=>i.labTest.code).join(', ')}</td>
                  <td className="px-4 py-3 text-gray-600">{req.requestedBy ? `${req.requestedBy.title??''} ${req.requestedBy.firstName} ${req.requestedBy.lastName}` : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${URGENCY_COLORS[req.urgency]??'bg-gray-100 text-gray-700'}`}>{req.urgency}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>{req.status.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(req.requestedAt).toLocaleString('en-KE',{dateStyle:'short',timeStyle:'short'})}</td>
                  <td className="px-4 py-3">
                    {req.status==='REQUESTED' && <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Collect Sample</button>}
                    {req.status==='SAMPLE_COLLECTED' && <button className="text-xs px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">Enter Results</button>}
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
