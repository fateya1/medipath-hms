// frontend/src/pages/patients/PatientDetailPage.tsx

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet, calculateAge, APPOINTMENT_STATUS_COLORS } from '../../utils/api';
import { Patient } from '../../types';
import {
  ArrowLeft, User, Phone, MapPin, Droplets, Shield, AlertTriangle,
  Calendar, FileText, FlaskConical, Activity, Receipt, Edit,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TABS = ['Overview', 'Appointments', 'Medical Records', 'Vitals', 'Lab Results', 'Billing'] as const;
type Tab = typeof TABS[number];

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiGet<Patient>(`/patients/${id}`),
  });

  if (isLoading) return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  if (!patient) return (
    <div className="p-6 text-center text-gray-500">
      <User size={48} className="mx-auto mb-3 opacity-30" />
      Patient not found
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Back nav */}
      <Link to="/patients" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Patients
      </Link>

      {/* Patient header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-teal-700 font-bold text-2xl">{patient.firstName[0]}{patient.lastName[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.middleName} {patient.lastName}</h1>
                <p className="text-gray-500 text-sm font-mono">{patient.patientNumber}</p>
              </div>
              {hasRole('ADMIN', 'RECEPTIONIST', 'NURSE') && (
                <Link to={`/patients/${id}/edit`} className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 border border-teal-200 rounded-lg px-3 py-1.5">
                  <Edit size={14} /> Edit
                </Link>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5"><User size={14} /> {calculateAge(patient.dateOfBirth)} years · {patient.gender}</span>
              <span className="flex items-center gap-1.5"><Phone size={14} /> {patient.phone}</span>
              {patient.county && <span className="flex items-center gap-1.5"><MapPin size={14} /> {patient.county}{patient.subCounty ? `, ${patient.subCounty}` : ''}</span>}
              <span className="flex items-center gap-1.5"><Droplets size={14} className="text-red-500" /> {patient.bloodGroup?.replace('_', ' ')}</span>
              {patient.nhifNumber && <span className="flex items-center gap-1.5"><Shield size={14} className="text-green-600" /> NHIF: {patient.nhifNumber}</span>}
              {patient.shaNumber && <span className="flex items-center gap-1.5"><Shield size={14} className="text-blue-600" /> SHA: {patient.shaNumber}</span>}
            </div>
            {(patient.allergies?.length > 0 || patient.chronicConditions?.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {patient.allergies?.map(a => (
                  <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                    <AlertTriangle size={10} /> {a}
                  </span>
                ))}
                {patient.chronicConditions?.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
            <dl className="space-y-3">
              {[
                { label: 'Full Name', value: `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim() },
                { label: 'Date of Birth', value: new Date(patient.dateOfBirth).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'National ID', value: patient.nationalId || '—' },
                { label: 'Phone', value: patient.phone },
                { label: 'Alt. Phone', value: patient.altPhone || '—' },
                { label: 'Email', value: patient.email || '—' },
                { label: 'County', value: patient.county || '—' },
                { label: 'Sub-county', value: patient.subCounty || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Emergency & insurance */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Name', value: patient.emergencyContact || '—' },
                  { label: 'Phone', value: patient.emergencyPhone || '—' },
                  { label: 'Relationship', value: patient.emergencyRelation || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-900 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Insurance</h3>
              <dl className="space-y-3">
                {[
                  { label: 'NHIF No.', value: patient.nhifNumber || '—' },
                  { label: 'SHA No.', value: patient.shaNumber || '—' },
                  { label: 'Provider', value: patient.insuranceProvider || '—' },
                  { label: 'Policy No.', value: patient.insurancePolicyNo || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-900 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Appointments' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Appointment History</h3>
            {hasRole('ADMIN', 'RECEPTIONIST', 'DOCTOR') && (
              <Link to={`/appointments/new?patientId=${id}`} className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline">
                <Calendar size={14} /> Book Appointment
              </Link>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {patient.appointments?.map(apt => (
              <Link key={apt.id} to={`/appointments/${apt.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{apt.appointmentNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${APPOINTMENT_STATUS_COLORS[apt.status]}`}>{apt.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : ''} · {apt.type}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{new Date(apt.scheduledAt).toLocaleDateString('en-KE')}</span>
              </Link>
            ))}
            {(!patient.appointments || patient.appointments.length === 0) && (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">No appointments found</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Medical Records' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Medical Records</h3>
          </div>
          <p className="text-gray-400 text-sm text-center py-8">Select an appointment to view its medical record, or access via the Appointments tab.</p>
        </div>
      )}

      {activeTab === 'Vitals' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Latest Vitals</h3>
          {patient.vitalSigns?.[0] ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Temperature', value: patient.vitalSigns[0].temperature ? `${patient.vitalSigns[0].temperature}°C` : '—' },
                { label: 'Blood Pressure', value: patient.vitalSigns[0].systolicBP ? `${patient.vitalSigns[0].systolicBP}/${patient.vitalSigns[0].diastolicBP} mmHg` : '—' },
                { label: 'Heart Rate', value: patient.vitalSigns[0].heartRate ? `${patient.vitalSigns[0].heartRate} bpm` : '—' },
                { label: 'SpO2', value: patient.vitalSigns[0].oxygenSat ? `${patient.vitalSigns[0].oxygenSat}%` : '—' },
                { label: 'Weight', value: patient.vitalSigns[0].weight ? `${patient.vitalSigns[0].weight} kg` : '—' },
                { label: 'Height', value: patient.vitalSigns[0].height ? `${patient.vitalSigns[0].height} cm` : '—' },
                { label: 'BMI', value: patient.vitalSigns[0].bmi ? `${patient.vitalSigns[0].bmi.toFixed(1)}` : '—' },
                { label: 'Pain Score', value: patient.vitalSigns[0].painScore !== undefined ? `${patient.vitalSigns[0].painScore}/10` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No vital signs recorded yet</p>
          )}
        </div>
      )}

      {activeTab === 'Billing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Billing History</h3>
            {hasRole('ADMIN', 'RECEPTIONIST') && (
              <Link to={`/billing/new?patientId=${id}`} className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:underline">
                <Receipt size={14} /> Create Invoice
              </Link>
            )}
          </div>
          <p className="text-gray-400 text-sm text-center py-8">Visit the Billing module to view this patient's invoices.</p>
        </div>
      )}
    </div>
  );
}
