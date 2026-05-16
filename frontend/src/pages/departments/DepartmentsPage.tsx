// frontend/src/pages/departments/DepartmentsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../utils/api';
import { Building2, Plus, X, AlertCircle } from 'lucide-react';

const DEPT_TYPES = ['CLINICAL','DIAGNOSTIC','SUPPORT','ADMINISTRATIVE'];
const IC = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const TYPE_COLORS: Record<string,string> = {
  CLINICAL:'bg-teal-50 text-teal-700 border-teal-200',
  DIAGNOSTIC:'bg-blue-50 text-blue-700 border-blue-200',
  SUPPORT:'bg-purple-50 text-purple-700 border-purple-200',
  ADMINISTRATIVE:'bg-gray-50 text-gray-700 border-gray-200',
};

const DEFAULT_DEPTS = [
  { code:'OPD',  name:'Outpatient Department',        type:'CLINICAL',       location:'Ground Floor, Block A' },
  { code:'AE',   name:'Accident & Emergency',         type:'CLINICAL',       location:'Ground Floor, Block B' },
  { code:'MED',  name:'General Medicine Ward',        type:'CLINICAL',       location:'1st Floor, Block A' },
  { code:'SURG', name:'Surgery',                      type:'CLINICAL',       location:'2nd Floor, Block A' },
  { code:'PAED', name:'Paediatrics',                  type:'CLINICAL',       location:'1st Floor, Block B' },
  { code:'OBGY', name:'Obstetrics & Gynaecology',     type:'CLINICAL',       location:'2nd Floor, Block B' },
  { code:'ICU',  name:'Intensive Care Unit',          type:'CLINICAL',       location:'3rd Floor, Block A' },
  { code:'ORTH', name:'Orthopaedics',                 type:'CLINICAL',       location:'2nd Floor, Block C' },
  { code:'LAB',  name:'Laboratory',                   type:'DIAGNOSTIC',     location:'Ground Floor, Block C' },
  { code:'RAD',  name:'Radiology / Imaging',          type:'DIAGNOSTIC',     location:'Ground Floor, Block C' },
  { code:'PHAR', name:'Pharmacy',                     type:'SUPPORT',        location:'Ground Floor, Block A' },
  { code:'PHYS', name:'Physiotherapy',                type:'SUPPORT',        location:'1st Floor, Block C' },
  { code:'DENT', name:'Dental',                       type:'CLINICAL',       location:'Ground Floor, Block D' },
  { code:'PSYC', name:'Mental Health / Psychiatry',   type:'CLINICAL',       location:'3rd Floor, Block B' },
  { code:'ADMIN','name':'Administration',             type:'ADMINISTRATIVE', location:'Admin Block' },
];

export function DepartmentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', type:'CLINICAL', description:'', location:'', phone:'' });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => apiGet<any[]>('/departments'),
  });

  const createMut = useMutation({
    mutationFn: (d: typeof form) => apiPost('/departments', d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['departments']}); setShowForm(false); setForm({name:'',code:'',type:'CLINICAL',description:'',location:'',phone:''}); setError(''); },
    onError: (e:any) => setError(e.response?.data?.error || 'Failed to create department.'),
  });

  const departments = data ?? [];

  const grouped = DEPT_TYPES.reduce((acc, type) => {
    acc[type] = departments.filter((d:any) => d.type === type);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500 text-sm mt-0.5">{departments.length} departments configured</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16}/> Add Department
        </button>
      </div>

      {/* Quick-seed helper */}
      {departments.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-semibold text-amber-800 mb-2">No departments yet</p>
          <p className="text-sm text-amber-700 mb-3">Run the seed script or add departments manually. A standard Kenyan hospital setup includes:</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_DEPTS.map(d=>(
              <span key={d.code} className="px-2 py-1 bg-white border border-amber-200 rounded text-xs text-amber-800 font-mono">{d.code}</span>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-3">Run <code className="bg-amber-100 px-1 rounded">npm run db:seed</code> to populate these automatically.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        DEPT_TYPES.map(type => grouped[type]?.length > 0 && (
          <div key={type}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{type}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped[type].map((dept: any) => (
                <div key={dept.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{dept.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[dept.type]}`}>{dept.type}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{dept.name}</p>
                  {dept.location && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Building2 size={11}/>{dept.location}</p>}
                  {dept.phone   && <p className="text-xs text-gray-500 mt-0.5">📞 {dept.phone}</p>}
                  {dept.head && (
                    <p className="text-xs text-teal-600 mt-2 font-medium">Head: {dept.head.title} {dept.head.firstName} {dept.head.lastName}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${dept.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button className="text-xs text-teal-600 hover:text-teal-800 font-medium">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create Department Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Add Department</h2>
              <button onClick={() => { setShowForm(false); setError(''); }} className="p-2 rounded-lg hover:bg-gray-100"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16}/>{error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={IC} placeholder="e.g. Paediatrics"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} className={IC} placeholder="e.g. PAED" maxLength={6}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={IC}>
                    {DEPT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className={IC} placeholder="+254..."/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Block</label>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} className={IC} placeholder="e.g. 2nd Floor, Block A"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className={IC}/>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowForm(false); setError(''); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
              <button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.name || !form.code}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm disabled:opacity-60 transition-colors">
                {createMut.isPending ? 'Creating…' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
