// frontend/src/pages/billing/InvoicesListPage.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet, formatKES, BILLING_STATUS_COLORS } from '../../utils/api';
import { PaginatedResponse, Invoice } from '../../types';
import { Plus, Search, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';

export function InvoicesListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () => apiGet<PaginatedResponse<Invoice>>('/billing/invoices', { page, limit: 20, status: status || undefined }),
    placeholderData: {
      data: [
        { id: '1', invoiceNo: 'INV-2024-00001', patient: { id: 'p1', patientNumber: 'MED-00001', firstName: 'Amina', lastName: 'Wanjiku', phone: '0712345678', dateOfBirth: '', gender: 'FEMALE', bloodGroup: 'O_POSITIVE', registeredAt: '', isActive: true }, subtotal: 4500, discount: 0, tax: 0, total: 4500, amountPaid: 4500, balance: 0, status: 'PAID', createdAt: new Date().toISOString(), items: [], payments: [] },
        { id: '2', invoiceNo: 'INV-2024-00002', patient: { id: 'p2', patientNumber: 'MED-00002', firstName: 'John', lastName: 'Kamau', phone: '0723456789', dateOfBirth: '', gender: 'MALE', bloodGroup: 'A_POSITIVE', registeredAt: '', isActive: true }, subtotal: 12800, discount: 0, tax: 0, total: 12800, amountPaid: 5000, balance: 7800, status: 'PARTIALLY_PAID', createdAt: new Date().toISOString(), items: [], payments: [] },
        { id: '3', invoiceNo: 'INV-2024-00003', patient: { id: 'p3', patientNumber: 'MED-00003', firstName: 'Grace', lastName: 'Muthoni', phone: '0734567890', dateOfBirth: '', gender: 'FEMALE', bloodGroup: 'B_NEGATIVE', registeredAt: '', isActive: true }, subtotal: 3200, discount: 0, tax: 0, total: 3200, amountPaid: 0, balance: 3200, status: 'PENDING', createdAt: new Date().toISOString(), items: [], payments: [] },
      ] as Invoice[],
      pagination: { page: 1, limit: 20, total: 56, pages: 3 },
    },
  });

  const invoices = data?.data ?? [];
  const pagination = data?.pagination;

  const summary = {
    total: invoices.reduce((s, i) => s + i.total, 0),
    paid: invoices.reduce((s, i) => s + i.amountPaid, 0),
    pending: invoices.reduce((s, i) => s + i.balance, 0),
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-500 text-sm">{pagination?.total ?? '—'} invoices</p>
        </div>
        <Link to="/billing/new" className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold">
          <Plus size={16} /> Create Invoice
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed', value: formatKES(summary.total), color: 'bg-gray-50 border-gray-200' },
          { label: 'Amount Collected', value: formatKES(summary.paid), color: 'bg-green-50 border-green-200' },
          { label: 'Outstanding Balance', value: formatKES(summary.pending), color: 'bg-amber-50 border-amber-200' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-xl border p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none">
          <option value="">All Statuses</option>
          {['PENDING','PARTIALLY_PAID','PAID','WAIVED','CANCELLED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Invoice No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Patient</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Paid</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Balance</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.patient?.firstName} {inv.patient?.lastName}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatKES(inv.total)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{formatKES(inv.amountPaid)}</td>
                  <td className="px-4 py-3 text-right text-amber-700 font-semibold">{formatKES(inv.balance)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BILLING_STATUS_COLORS[inv.status]}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3">
                    <Link to={`/billing/${inv.id}`} className="text-teal-600 hover:underline text-xs font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
