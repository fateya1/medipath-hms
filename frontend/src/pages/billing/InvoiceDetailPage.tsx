// frontend/src/pages/billing/InvoiceDetailPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, formatKES, formatMpesaPhone, BILLING_STATUS_COLORS } from '../../utils/api';
import { Invoice } from '../../types';
import { ArrowLeft, Smartphone, Banknote, CheckCircle, AlertCircle } from 'lucide-react';

export function InvoiceDetailPage() {
  const { id } = useParams<{id:string}>();
  const qc     = useQueryClient();
  const [phone, setPhone]         = useState('');
  const [mpesaAmount, setMpesaAmount] = useState(0);
  const [mpesaMsg, setMpesaMsg]   = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [tab, setTab]             = useState<'mpesa'|'cash'>('mpesa');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn:  () => apiGet<Invoice>(`/billing/invoices/${id}`),
  });

  const mpesaMut = useMutation({
    mutationFn: ({ phone, amount }:{phone:string;amount:number}) =>
      apiPost('/billing/pay/mpesa', { invoiceId: id, phone: formatMpesaPhone(phone), amount }),
    onSuccess: (d:any) => { setMpesaMsg(d.message); qc.invalidateQueries({queryKey:['invoice',id]}); },
    onError: (e:any)   => { setMpesaMsg(e.response?.data?.error || 'M-Pesa request failed.'); },
  });

  const cashMut = useMutation({
    mutationFn: (amount:number) => apiPost('/billing/pay/cash', { invoiceId: id, amount }),
    onSuccess: () => { setCashAmount(0); qc.invalidateQueries({queryKey:['invoice',id]}); },
  });

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!invoice)  return <div className="p-6 text-gray-500">Invoice not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/billing" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNo}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BILLING_STATUS_COLORS[invoice.status]}`}>{invoice.status.replace('_',' ')}</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">{new Date(invoice.createdAt).toLocaleDateString('en-KE')}</p>
      </div>

      {/* Patient & summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Patient</p>
          {invoice.patient && <>
            <Link to={`/patients/${invoice.patient.id}`} className="font-semibold text-teal-700 hover:underline">{invoice.patient.firstName} {invoice.patient.lastName}</Link>
            <p className="text-sm text-gray-500">{invoice.patient.patientNumber}</p>
            <p className="text-sm text-gray-500">{invoice.patient.phone}</p>
          </>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatKES(invoice.subtotal)}</span></div>
          {invoice.discount>0 && <div className="flex justify-between text-gray-600"><span>Discount</span><span>-{formatKES(invoice.discount)}</span></div>}
          <div className="flex justify-between font-bold text-gray-900 border-t pt-1.5"><span>Total</span><span>{formatKES(invoice.total)}</span></div>
          <div className="flex justify-between text-green-700"><span>Paid</span><span>{formatKES(invoice.amountPaid)}</span></div>
          <div className="flex justify-between font-bold text-red-600"><span>Balance</span><span>{formatKES(invoice.balance)}</span></div>
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>{['Description','Category','Qty','Unit Price','Discount','Total'].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map(item=>(
              <tr key={item.id}>
                <td className="px-4 py-2.5 text-gray-900">{item.description}</td>
                <td className="px-4 py-2.5"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span></td>
                <td className="px-4 py-2.5 text-gray-600">{item.quantity}</td>
                <td className="px-4 py-2.5 text-gray-600">{formatKES(item.unitPrice)}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.discount>0?formatKES(item.discount):'—'}</td>
                <td className="px-4 py-2.5 font-medium text-gray-900">{formatKES(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment panel */}
      {invoice.balance > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Record Payment</h3>
          <div className="flex gap-2 mb-4">
            {(['mpesa','cash'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab===t?'bg-teal-700 text-white border-teal-700':'border-gray-300 hover:bg-gray-50'}`}>
                {t==='mpesa' ? '📱 M-Pesa' : '💵 Cash'}
              </button>
            ))}
          </div>

          {tab==='mpesa' && (
            <div className="space-y-3">
              {mpesaMsg && <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${mpesaMsg.includes('failed')||mpesaMsg.includes('error')?'bg-red-50 text-red-700 border border-red-200':'bg-green-50 text-green-700 border border-green-200'}`}><CheckCircle size={15}/>{mpesaMsg}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (0712 345 678)</label>
                  <input value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="0712 345 678"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                  <input type="number" value={mpesaAmount||invoice.balance} onChange={e=>setMpesaAmount(+e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                </div>
              </div>
              <button onClick={()=>mpesaMut.mutate({phone, amount:mpesaAmount||invoice.balance})}
                disabled={mpesaMut.isPending||!phone}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm disabled:opacity-60 transition-colors">
                <Smartphone size={16}/>{mpesaMut.isPending?'Sending STK Push…':'Send STK Push'}
              </button>
            </div>
          )}

          {tab==='cash' && (
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount (KES)</label>
                <input type="number" value={cashAmount||invoice.balance} onChange={e=>setCashAmount(+e.target.value)}
                  className="w-48 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
              </div>
              <button onClick={()=>cashMut.mutate(cashAmount||invoice.balance)}
                disabled={cashMut.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm disabled:opacity-60 transition-colors">
                <Banknote size={16}/>{cashMut.isPending?'Recording…':'Record Cash'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payments history */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-900 text-sm">Payment History</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['Method','Amount','Status','Reference','Date'].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.payments.map(p=>(
                <tr key={p.id}>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{p.method}</td>
                  <td className="px-4 py-2.5 text-gray-700">{formatKES(p.amount)}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status==='SUCCESS'?'bg-green-100 text-green-700':p.status==='PENDING'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{p.status}</span></td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{p.mpesaReceiptNo||p.reference||'—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{p.paidAt?new Date(p.paidAt).toLocaleString('en-KE'):'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
