// frontend/src/pages/billing/CreateInvoicePage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, formatKES } from '../../utils/api';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';

interface LineItem { description:string; category:string; quantity:number; unitPrice:number; discount:number }
const CATEGORIES = ['CONSULTATION','DRUG','LAB','PROCEDURE','WARD','RADIOLOGY','NURSING','SUPPLY','OTHER'];
const IC = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ description:'', category:'CONSULTATION', quantity:1, unitPrice:0, discount:0 }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: patients } = useQuery({ queryKey:['patients-select'], queryFn:()=>apiGet<any>('/patients?limit=200') });

  const updateItem = (i:number, field:keyof LineItem, value:any) => {
    setItems(prev => prev.map((item,idx) => idx===i ? {...item,[field]:value} : item));
  };
  const addItem    = () => setItems(prev => [...prev, { description:'', category:'DRUG', quantity:1, unitPrice:0, discount:0 }]);
  const removeItem = (i:number) => setItems(prev => prev.filter((_,idx)=>idx!==i));

  const subtotal = items.reduce((s,it) => s + it.quantity * it.unitPrice - it.discount, 0);
  const total    = subtotal - discount;

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setServerError('Please select a patient.'); return; }
    if (items.some(it=>!it.description || it.unitPrice<=0)) { setServerError('All items need a description and price.'); return; }
    try {
      setLoading(true); setServerError('');
      const res = await apiPost<any>('/billing/invoices', { patientId, items, discount, notes });
      navigate(`/billing/${res.id}`);
    } catch(e:any) {
      setServerError(e.response?.data?.error || 'Failed to create invoice.');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/billing" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
      </div>
      {serverError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={16}/>{serverError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)} className={IC}>
            <option value="">Select patient…</option>
            {patients?.data?.map((p:any)=><option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.patientNumber}</option>)}
          </select>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Line Items</h2>
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-800 font-medium"><Plus size={16}/>Add Item</button>
          </div>
          <div className="space-y-3">
            {items.map((item,i)=>(
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {i===0 && <p className="text-xs text-gray-500 mb-1">Description</p>}
                  <input value={item.description} onChange={e=>updateItem(i,'description',e.target.value)} className={IC} placeholder="e.g. Consultation fee"/>
                </div>
                <div className="col-span-2">
                  {i===0 && <p className="text-xs text-gray-500 mb-1">Category</p>}
                  <select value={item.category} onChange={e=>updateItem(i,'category',e.target.value)} className={IC}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  {i===0 && <p className="text-xs text-gray-500 mb-1">Qty</p>}
                  <input type="number" min={1} value={item.quantity} onChange={e=>updateItem(i,'quantity',+e.target.value)} className={IC}/>
                </div>
                <div className="col-span-2">
                  {i===0 && <p className="text-xs text-gray-500 mb-1">Unit Price (KES)</p>}
                  <input type="number" min={0} value={item.unitPrice} onChange={e=>updateItem(i,'unitPrice',+e.target.value)} className={IC}/>
                </div>
                <div className="col-span-2">
                  {i===0 && <p className="text-xs text-gray-500 mb-1">Discount (KES)</p>}
                  <input type="number" min={0} value={item.discount} onChange={e=>updateItem(i,'discount',+e.target.value)} className={IC}/>
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length>1 && <button type="button" onClick={()=>removeItem(i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={15}/></button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatKES(subtotal)}</span></div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Discount</span>
              <div className="flex items-center gap-2"><span>KES</span><input type="number" min={0} value={discount} onChange={e=>setDiscount(+e.target.value)} className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"/></div>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 text-base"><span>Total</span><span className="text-teal-700">{formatKES(total)}</span></div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className={IC} placeholder="Optional billing notes…"/>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/billing" className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
}
