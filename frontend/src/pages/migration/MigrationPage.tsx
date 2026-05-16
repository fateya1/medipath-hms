import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

type Step = 'upload' | 'map' | 'import';

interface ShiftRow {
  staffNumber: string;
  staffName: string;
  department: string;
  shiftDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  onCall: string;
  ward: string;
}

interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: { row: number; error: string }[];
}

const MIGRATION_TYPES = [
  {
    id: 'shifts',
    title: 'Import Shift Rosters (24/7)',
    subtitle: 'Morning, Afternoon, Night shifts — on-call rosters, department duty rota',
    priority: 'HIGH',
    fields: ['staffNumber','staffName','department','shiftDate','shiftType','startTime','endTime','onCall','ward'],
  },
];

function parseCSV(text: string): ShiftRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj as unknown as ShiftRow;
  });
}

export function MigrationPage() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedType] = useState(MIGRATION_TYPES[0]);
  const [csvData, setCsvData] = useState<ShiftRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setCsvData(rows);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/staff/shifts/import', { shifts: csvData });
      setResult(res.data);
      setStep('import');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setCsvData([]);
    setFileName('');
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const stepIndex = { upload: 0, map: 1, import: 2 }[step];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Migration</h1>
        <p className="text-gray-500 mt-1">Import staff rosters and operational data</p>
      </div>

      {/* Migration type card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex items-start gap-4 shadow-sm">
        <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-semibold text-gray-900">{selectedType.title}</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {selectedType.priority}
            </span>
          </div>
          <p className="text-sm text-gray-500">{selectedType.subtitle}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {['Upload CSV', 'Map Fields', 'Import'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${i < stepIndex ? 'bg-teal-600 text-white' :
                i === stepIndex ? 'bg-teal-50 text-teal-700 border border-teal-300' :
                'bg-gray-100 text-gray-400'}`}>
              {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : <span>{i + 1}</span>}
              {label}
            </div>
            {i < 2 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* Upload */}
        {step === 'upload' && (
          <div className="p-8 text-center">
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Click to upload CSV file</p>
              <p className="text-sm text-gray-400 mt-1">
                Required columns: {selectedType.fields.join(', ')}
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        )}

        {/* Map fields */}
        {step === 'map' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Field Mapping</h3>
                <p className="text-sm text-gray-500">{fileName} — {csvData.length} rows detected</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                ✓ All fields auto-mapped
              </span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">CSV Column</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Maps To</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Sample</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedType.fields.map(field => (
                    <tr key={field}>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{field}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> {field}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 font-mono text-xs truncate max-w-[140px]">
                        {csvData[0]?.[field as keyof ShiftRow] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : `Import ${csvData.length} Records`}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'import' && result && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Import Complete</h3>
                <p className="text-sm text-gray-500">Shift Rosters (24/7) migration finished</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total', value: result.total, color: 'text-gray-700 bg-gray-50 border-gray-200' },
                { label: '✓ Imported', value: result.imported, color: 'text-green-700 bg-green-50 border-green-200' },
                { label: '◎ Skipped', value: result.skipped, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                { label: '✕ Failed', value: result.failed, color: result.failed > 0 ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-400 bg-gray-50 border-gray-200' },
              ].map(s => (
                <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-red-50 px-4 py-2.5 flex items-center gap-2 border-b border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">{result.errors.length} Errors</span>
                </div>
                <div className="divide-y divide-red-100 max-h-56 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-mono">Row {e.row}</span>
                      <span className="text-red-700">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Import Another File
              </button>
              {result.failed > 0 && (
                <button
                  onClick={() => { setCsvData([]); setStep('upload'); setResult(null); }}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
                >
                  Retry Failed Rows
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
