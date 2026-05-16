// frontend/src/pages/patients/PatientsListPage.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiGet, calculateAge } from '../../utils/api';
import { PaginatedResponse, PatientSummary } from '../../types';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function PatientsListPage() {
  const { hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [gender, setGender] = useState('');

  // Debounce search
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, debouncedSearch, gender],
    queryFn: () => apiGet<PaginatedResponse<PatientSummary>>('/patients', { page, limit: 20, search: debouncedSearch || undefined, gender: gender || undefined }),
    placeholderData: {
      data: [
        { id: '1', patientNumber: 'MED-2024-00001', firstName: 'Amina', lastName: 'Wanjiku', dateOfBirth: '1985-03-14', gender: 'FEMALE', phone: '0712345678', county: 'Nairobi', bloodGroup: 'O_POSITIVE', registeredAt: new Date().toISOString(), isActive: true },
        { id: '2', patientNumber: 'MED-2024-00002', firstName: 'John', lastName: 'Kamau', dateOfBirth: '1978-07-22', gender: 'MALE', phone: '0723456789', county: 'Kiambu', bloodGroup: 'A_POSITIVE', registeredAt: new Date().toISOString(), isActive: true },
        { id: '3', patientNumber: 'MED-2024-00003', firstName: 'Grace', lastName: 'Muthoni', dateOfBirth: '1992-11-05', gender: 'FEMALE', phone: '0734567890', county: 'Muranga', bloodGroup: 'B_NEGATIVE', registeredAt: new Date().toISOString(), isActive: true },
        { id: '4', patientNumber: 'MED-2024-00004', firstName: 'Peter', lastName: 'Ochieng', dateOfBirth: '1965-01-30', gender: 'MALE', phone: '0745678901', county: 'Kisumu', bloodGroup: 'AB_POSITIVE', registeredAt: new Date().toISOString(), isActive: true },
        { id: '5', patientNumber: 'MED-2024-00005', firstName: 'Mary', lastName: 'Njeri', dateOfBirth: '2001-09-18', gender: 'FEMALE', phone: '0756789012', county: 'Nakuru', bloodGroup: 'O_NEGATIVE', registeredAt: new Date().toISOString(), isActive: true },
      ] as PatientSummary[],
      pagination: { page: 1, limit: 20, total: 3842, pages: 193 },
    },
  });

  const patients = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pagination?.total?.toLocaleString() ?? '—'} total records</p>
        </div>
        {hasRole('ADMIN', 'RECEPTIONIST') && (
          <Link
            to="/patients/new"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Register Patient
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, patient no., phone, ID, NHIF…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={gender}
          onChange={e => { setGender(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Patient</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Patient No.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Age / Gender</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">County</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Blood Group</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Registered</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              )}
              {!isLoading && patients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-teal-700 font-semibold text-xs">{patient.firstName[0]}{patient.lastName[0]}</span>
                      </div>
                      <span className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{patient.patientNumber}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {calculateAge(patient.dateOfBirth)}y · <span className="capitalize">{patient.gender.toLowerCase()}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{patient.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{patient.county || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
                      {patient.bloodGroup?.replace('_', ' ') || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(patient.registeredAt).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/patients/${patient.id}`} className="text-teal-600 hover:text-teal-800 text-xs font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {!isLoading && patients.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <User size={32} className="mx-auto mb-2 opacity-40" />
                    No patients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600 font-medium">Page {page} / {pagination.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
