// frontend/src/pages/pharmacy/PharmacyInventoryPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, formatKES } from '../../utils/api';
import { Drug } from '../../types';
import { Search, AlertTriangle, Pill } from 'lucide-react';

export function PharmacyInventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['drugs', search, category],
    queryFn:  () => apiGet<any>(`/pharmacy/drugs?search=${search}&category=${category}&limit=50`),
  });
  const drugs: Drug[] = data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Drug Inventory</h1><p className="text-gray-500 text-sm">{data?.pagination?.total ?? '—'} drugs in formulary</p></div>
        <button className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors">+ Add Drug</button>
      </div>

      {/* Alerts */}
      {drugs.some(d=>d.stockQuantity<=d.reorderLevel) && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          <AlertTriangle size={16}/> {drugs.filter(d=>d.stockQuantity<=d.reorderLevel).length} drugs are at or below reorder level.
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, generic name…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
        </div>
        <select value={category} onChange={e=>setCategory(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Categories</option>
          {['Antibiotic','Analgesic','Antihypertensive','Antidiabetic','Antimalarial','Antiparasitic','Antifungal','Antiviral','Cardiovascular','Respiratory','GI','Vitamins'].map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>
        : drugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Pill size={40} className="mb-3 opacity-30"/><p>No drugs found</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Name','Form / Strength','Category','Stock','Reorder','Unit Price','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drugs.map(drug=>(
                <tr key={drug.id} className={`hover:bg-gray-50 transition-colors ${drug.stockQuantity<=drug.reorderLevel?'bg-amber-50/30':''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{drug.name}</p>
                    <p className="text-xs text-gray-400">{drug.genericName}</p>
                    {drug.brand && <p className="text-xs text-gray-400 italic">{drug.brand}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{drug.form} · {drug.strength}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{drug.category}</span></td>
                  <td className={`px-4 py-3 font-semibold ${drug.stockQuantity<=drug.reorderLevel?'text-red-600':'text-gray-900'}`}>
                    {drug.stockQuantity} {drug.unit}
                    {drug.stockQuantity<=drug.reorderLevel && <AlertTriangle size={13} className="inline ml-1"/>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{drug.reorderLevel}</td>
                  <td className="px-4 py-3 text-gray-700">{formatKES(drug.unitPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${drug.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {drug.isActive?'Active':'Inactive'}
                    </span>
                    {drug.isControlled && <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Controlled</span>}
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
