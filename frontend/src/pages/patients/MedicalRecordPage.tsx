// frontend/src/pages/patients/MedicalRecordPage.tsx
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../utils/api';
import { MedicalRecord } from '../../types';
import { ArrowLeft, Pill, FlaskConical, Paperclip } from 'lucide-react';

export function MedicalRecordPage() {
  const { id, recordId } = useParams<{ id:string; recordId:string }>();
  const { data: record, isLoading } = useQuery({
    queryKey: ['medical-record', recordId],
    queryFn: () => apiGet<MedicalRecord>(`/medical-records/${recordId}`),
  });

  if (isLoading) return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!record) return <div className="p-6 text-gray-500">Record not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/patients/${id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18}/></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Medical Record</h1>
          <p className="text-gray-500 text-sm">{new Date(record.createdAt).toLocaleDateString('en-KE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>

      {/* Clinician */}
      {record.doctor && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {record.doctor.title?.[0] ?? record.doctor.firstName[0]}
          </div>
          <div>
            <p className="font-semibold text-teal-900">{record.doctor.title} {record.doctor.firstName} {record.doctor.lastName}</p>
            <p className="text-sm text-teal-700">{record.doctor.specialisation}</p>
          </div>
        </div>
      )}

      {/* Clinical sections */}
      {[
        { label:'Chief Complaint', value: record.chiefComplaint },
        { label:'History of Presenting Illness', value: record.history },
        { label:'Examination Findings', value: record.examination },
        { label:'Management Plan', value: record.plan },
        { label:'Follow-up Advice', value: record.followUpAdvice },
        { label:'Clinical Notes', value: record.notes },
      ].map(s => s.value ? (
        <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{s.label}</h3>
          <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{s.value}</p>
        </div>
      ) : null)}

      {/* Diagnoses */}
      {record.diagnosis.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Diagnoses</h3>
          <div className="flex flex-wrap gap-2">
            {record.diagnosis.map((d,i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">{d}</span>
            ))}
          </div>
          {record.icdCodes.length > 0 && (
            <p className="mt-2 text-xs text-gray-400">ICD-10: {record.icdCodes.join(', ')}</p>
          )}
        </div>
      )}

      {/* Prescriptions */}
      {record.prescriptions && record.prescriptions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Pill size={14}/> Prescriptions
          </h3>
          {record.prescriptions.map(rx => (
            <div key={rx.id} className="border border-gray-100 rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Rx #{rx.prescriptionNo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rx.status==='DISPENSED'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{rx.status}</span>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400">{['Drug','Qty','Dosage','Duration'].map(h=><th key={h} className="text-left pb-1">{h}</th>)}</tr></thead>
                <tbody>{rx.items?.map((item,i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="py-1.5 font-medium text-gray-900">{item.drug?.name} <span className="text-gray-400 font-normal">{item.drug?.strength}</span></td>
                    <td className="py-1.5 text-gray-600">{item.quantity}</td>
                    <td className="py-1.5 text-gray-600">{item.dosage}</td>
                    <td className="py-1.5 text-gray-600">{item.duration ?? '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Lab Requests */}
      {record.labRequests && record.labRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FlaskConical size={14}/> Lab Investigations
          </h3>
          {record.labRequests.map(req => (
            <div key={req.id} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{req.requestNo}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${req.status==='COMPLETED'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{req.status}</span>
              </div>
              {req.items?.map((item,i)=>(
                <div key={i} className="flex items-center justify-between py-2 border-t border-gray-50 text-sm">
                  <span className="text-gray-700">{item.labTest.name} <span className="text-gray-400 text-xs">({item.labTest.code})</span></span>
                  {item.result ? (
                    <span className={`font-medium ${item.result.isAbnormal?'text-red-600':'text-green-700'}`}>
                      {item.result.value} {item.result.unit}
                      {item.result.isAbnormal && ' ⚠'}
                    </span>
                  ) : <span className="text-gray-400 text-xs">Pending</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
