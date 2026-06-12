import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, ArrowRight, Users, Loader2 } from 'lucide-react';
import { api } from '../../utils/api';

type Step = 'upload' | 'map' | 'import';

interface PatientRow {
  firstName:   string;
  lastName:    string;
  dateOfBirth: string;
  gender:      string;
  phone:       string;
  shaNumber:   string;
  county:      string;
  bloodGroup:  string;
}

interface ImportResult {
  total:    number;
  imported: number;
  skipped:  number;
  failed:   number;
  errors:   { row: number; error: string }[];
}

const CHUNK_SIZE = 50; // smaller chunks — each row does 2 DB writes + checks

// ── CSV headers we expect (must match the template exactly) ──────────────────
const EXPECTED_HEADERS = [
  'firstName','lastName','dateOfBirth','gender','phone','shaNumber','county','bloodGroup',
];

function parsePatientCSV(text: string): { rows: PatientRow[]; warnings: string[] } {
  const lines    = text.trim().split('\n');
  const warnings: string[] = [];
  if (lines.length < 2) return { rows: [], warnings: ['CSV file appears empty'] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // Warn about missing expected columns
  EXPECTED_HEADERS.forEach(h => {
    if (!headers.includes(h)) warnings.push(`Missing expected column: ${h}`);
  });

  const rows: PatientRow[] = lines
    .slice(1)
    .filter(l => l.trim())
    .map(line => {
      // Handle quoted CSV values
      const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g)
        ?.map(v => v.trim().replace(/^"|"$/g, '')) ?? line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
      return obj as unknown as PatientRow;
    });

  return { rows, warnings };
}

export function MigrationPage() {
  const [step,     setStep]     = useState<Step>('upload');
  const [csvData,  setCsvData]  = useState<PatientRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result,   setResult]   = useState<ImportResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows, warnings: w } = parsePatientCSV(ev.target?.result as string);
      setCsvData(rows);
      setWarnings(w);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    setProgress(0);

    const totals: ImportResult = {
      total: csvData.length, imported: 0, skipped: 0, failed: 0, errors: [],
    };

    // Split into chunks to avoid Vercel 30s serverless timeout
    const chunks: PatientRow[][] = [];
    for (let i = 0; i < csvData.length; i += CHUNK_SIZE) {
      chunks.push(csvData.slice(i, i + CHUNK_SIZE));
    }

    try {
      for (let i = 0; i < chunks.length; i++) {
        const res  = await api.post('/patients/import', { patients: chunks[i] });
        const data = res.data as ImportResult;

        totals.imported += data.imported;
        totals.skipped  += data.skipped;
        totals.failed   += data.failed;

        const offset = i * CHUNK_SIZE;
        totals.errors.push(
          ...data.errors.map((e: { row: number; error: string }) => ({
            ...e,
            row: e.row + offset,
          }))
        );

        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      setResult(totals);
      setStep('import');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Import failed. Check network or server logs.');
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
    setWarnings([]);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const stepIndex = { upload: 0, map: 1, import: 2 }[step];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Migration</h1>
        <p className="text-gray-500 mt-1">Bulk import patients from a CSV file</p>
      </div>

      {/* Card descriptor */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 flex items-start gap-4 shadow-sm">
        <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-semibold text-gray-900">Import Patients</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">HIGH</span>
          </div>
          <p className="text-sm text-gray-500">
            Demographics, SHA, medical history, next of kin, allergies
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Upload CSV', 'Map Fields', 'Import'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              i < stepIndex
                ? 'bg-teal-600 text-white'
                : i === stepIndex
                  ? 'bg-teal-50 text-teal-700 border border-teal-300'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : <span>{i + 1}</span>}
              {label}
            </div>
            {i < 2 && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* ── Step 1: Upload ─────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="p-8 text-center">
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Click to upload patient CSV</p>
              <p className="text-xs text-gray-400 mt-2 font-mono">
                firstName, lastName, dateOfBirth, gender, phone, shaNumber, county, bloodGroup
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {/* ── Step 2: Map / Confirm ──────────────────────────────────── */}
        {step === 'map' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Field Mapping</h3>
                <p className="text-sm text-gray-500">
                  {fileName} — {csvData.length} patients ·{' '}
                  {Math.ceil(csvData.length / CHUNK_SIZE)} chunks of {CHUNK_SIZE}
                </p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                ✓ Auto-mapped
              </span>
            </div>

            {/* Column preview table */}
            <div className="mb-4 rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">CSV Column</th>
                    <th className="px-3 py-2 text-left">Maps to</th>
                    <th className="px-3 py-2 text-left">Sample value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {EXPECTED_HEADERS.map(h => (
                    <tr key={h}>
                      <td className="px-3 py-2 font-mono text-gray-700">{h}</td>
                      <td className="px-3 py-2 text-teal-700 font-medium">{h}</td>
                      <td className="px-3 py-2 text-gray-500 truncate max-w-[120px]">
                        {(csvData[0] as Record<string,string>)?.[h] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CSV warnings */}
            {warnings.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                <p className="font-medium mb-1">⚠ Column warnings:</p>
                {warnings.map((w, i) => <p key={i} className="text-xs">{w}</p>)}
              </div>
            )}

            {/* API error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Progress bar */}
            {loading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Importing patients…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={loading || csvData.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Importing {progress}%…</>
                  : `Import ${csvData.length} Patients`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Results ────────────────────────────────────────── */}
        {step === 'import' && result && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                result.failed === 0 ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                {result.failed === 0
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <AlertCircle className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Import Complete</h3>
                <p className="text-sm text-gray-500">Patients migration finished</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total',      value: result.total,    color: 'text-gray-700 bg-gray-50 border-gray-200' },
                { label: '✓ Imported', value: result.imported, color: 'text-green-700 bg-green-50 border-green-200' },
                { label: '◎ Skipped',  value: result.skipped,  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                {
                  label: '✕ Failed',
                  value: result.failed,
                  color: result.failed > 0
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : 'text-gray-400 bg-gray-50 border-gray-200',
                },
              ].map(s => (
                <div key={s.label} className={`border rounded-xl p-4 text-center ${s.color}`}>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <div className="text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-red-50 px-4 py-2.5 flex items-center gap-2 border-b border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">
                    {result.errors.length} Error{result.errors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-red-100 max-h-56 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-mono flex-shrink-0">
                        Row {e.row}
                      </span>
                      <span className="text-red-700 break-all">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.imported > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <p className="font-medium">Temporary passwords assigned</p>
                <p className="text-xs mt-0.5">
                  Each imported patient's password is <span className="font-mono">MED@{'<last4ofPhone><birthYear>'}</span>.
                  Ask patients to reset via Forgot Password on first login.
                </p>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Import Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
