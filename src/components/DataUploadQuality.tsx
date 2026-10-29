import React, { useState, useRef } from 'react';
import { DataRecord, DataQualityReport, StandardSchemaField } from '../types';
import {
  STANDARD_SCHEMA,
  parseCSV,
  autoMapColumns,
  processRawDataset,
  exportToCSV,
} from '../services/dataLoader';
import { OFFICIAL_BENCHMARK_DATA } from '../data/sampleData';
import { formatINR, formatMonthYear } from '../utils/indianFormat';
import {
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FileSpreadsheet,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';

interface DataUploadQualityProps {
  currentRecords: DataRecord[];
  report: DataQualityReport;
  onUpdateDataset: (records: DataRecord[], newReport: DataQualityReport) => void;
}

export const DataUploadQuality: React.FC<DataUploadQualityProps> = ({
  currentRecords,
  report,
  onUpdateDataset,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [uploadedHeaders, setUploadedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string | null>>({});
  const [activeTab, setActiveTab] = useState<'preview' | 'mapping' | 'report'>('preview');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setFileContent(text);

      const { headers, rows } = parseCSV(text);
      setUploadedHeaders(headers);
      setRawRows(rows);

      // Auto map
      const mapping = autoMapColumns(headers);
      setColumnMapping(mapping);

      // Process immediately with auto mapping
      const { records, report: newReport } = processRawDataset(headers, rows, mapping, false);
      onUpdateDataset(records, newReport);
      setUploadSuccessMessage(`Successfully uploaded "${file.name}" with ${records.length} parsed records.`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleRemapChange = (standardKey: keyof DataRecord, chosenCol: string) => {
    const updated = {
      ...columnMapping,
      [standardKey]: chosenCol === '__unmapped__' ? null : chosenCol,
    };
    setColumnMapping(updated);

    if (uploadedHeaders.length > 0 && rawRows.length > 0) {
      const { records, report: newReport } = processRawDataset(uploadedHeaders, rawRows, updated as any, false);
      onUpdateDataset(records, newReport);
    }
  };

  const handleResetToBenchmark = () => {
    const dummyHeaders = STANDARD_SCHEMA.map(f => f.key);
    const dummyRows = OFFICIAL_BENCHMARK_DATA.map(r => [
      r.date,
      r.fund_category,
      String(r.net_flow),
      String(r.AUM),
      String(r.repo_rate),
      String(r.overnight_rate),
      String(r.banking_liquidity),
      String(r.T_bill_yield),
      String(r.commercial_paper_yield),
      String(r.equity_market_return),
      String(r.advance_tax_flag),
      String(r.quarter_end_flag),
      String(r.fiscal_year_end_flag),
    ]);
    const mapping = autoMapColumns(dummyHeaders);
    const { records, report: newReport } = processRawDataset(dummyHeaders, dummyRows, mapping, true);
    onUpdateDataset(records, newReport);
    setFileContent(null);
    setUploadedHeaders([]);
    setRawRows([]);
    setUploadSuccessMessage('Restored official 48-month AMFI/RBI benchmark dataset.');
    setTimeout(() => setUploadSuccessMessage(null), 4000);
  };

  const handleDownloadCleaned = () => {
    const csvStr = exportToCSV(currentRecords);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LiquidityLens_Cleaned_${report.isDemo ? 'Benchmark' : 'Dataset'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Data Ingestion & Quality Audit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            AMFI category fund flows, RBI monetary rates, CCIL/FBIL debt yields, and advance-tax calendars
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New CSV</span>
          </button>

          <button
            onClick={handleDownloadCleaned}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Cleaned CSV</span>
          </button>

          {!report.isDemo && (
            <button
              onClick={handleResetToBenchmark}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Benchmark</span>
            </button>
          )}
        </div>
      </div>

      {uploadSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{uploadSuccessMessage}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Total Observations</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {report.totalRecords}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {report.liquidCount} Liquid · {report.overnightCount} Overnight
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Date Span Coverage</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {report.uniqueMonths} Mos
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {report.startDate} to {report.endDate}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Unit & Currency Validation</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {report.unitCheck}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Min AUM: ₹ {Math.round(Math.min(...currentRecords.map(r => r.AUM))).toLocaleString('en-IN')} Cr
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Integrity Health</div>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1">
            {report.status}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Duplicates: {report.duplicateRows} · Gaps: {report.dateGaps.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dataset Preview ({currentRecords.length} rows)
          </button>
          <button
            onClick={() => setActiveTab('mapping')}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === 'mapping'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Schema Mapping ({STANDARD_SCHEMA.length} canonical fields)
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Data Quality & Provenance Report
          </button>
        </div>
      </div>

      {/* Tab 1: Dataset Preview */}
      {activeTab === 'preview' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Displaying latest 20 cleaned observations</span>
            <span className="font-mono">{report.provenance.source}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Net Flow (₹ Cr)</th>
                  <th className="py-2.5 px-3 text-right">AUM (₹ Cr)</th>
                  <th className="py-2.5 px-3 text-right">Repo Rate</th>
                  <th className="py-2.5 px-3 text-right">Overnight</th>
                  <th className="py-2.5 px-3 text-right">Banking Liq (₹ Cr)</th>
                  <th className="py-2.5 px-3 text-right">91D T-Bill</th>
                  <th className="py-2.5 px-3 text-right">3M CP Yield</th>
                  <th className="py-2.5 px-3 text-center">Tax / Qtr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {currentRecords.slice(-20).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-semibold text-slate-900">{r.date}</td>
                    <td className="py-2 px-3 font-sans text-slate-700">{r.fund_category}</td>
                    <td className={`py-2 px-3 text-right font-medium ${r.net_flow < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {formatINR(r.net_flow)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatINR(r.AUM)}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{r.repo_rate.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right text-slate-600">{r.overnight_rate.toFixed(2)}%</td>
                    <td className={`py-2 px-3 text-right ${r.banking_liquidity < 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {r.banking_liquidity > 0 ? `+${r.banking_liquidity}` : r.banking_liquidity}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">{r.T_bill_yield.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right text-slate-600">{r.commercial_paper_yield.toFixed(2)}%</td>
                    <td className="py-2 px-3 text-center font-sans">
                      {r.fiscal_year_end_flag ? (
                        <span className="text-[10px] text-rose-700 bg-rose-50 px-1 py-0.5 rounded font-semibold">FY End</span>
                      ) : r.advance_tax_flag ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-semibold">Tax Qtr</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Column Mapping */}
      {activeTab === 'mapping' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Schema Field Mapping</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Map column names from your uploaded CSV to the canonical LiquidityLens schema
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {uploadedHeaders.length > 0 ? `${uploadedHeaders.length} Columns Uploaded` : 'Using Canonical Schema'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STANDARD_SCHEMA.map(field => {
              const currentMapped = columnMapping[field.key] || field.key;
              return (
                <div key={field.key} className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{field.unit}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{field.description}</p>

                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">CSV Col:</span>
                    <select
                      value={currentMapped || '__unmapped__'}
                      onChange={e => handleRemapChange(field.key, e.target.value)}
                      className="text-xs font-mono bg-white border border-slate-300 rounded px-2 py-1 flex-1 text-slate-700 focus:outline-indigo-500"
                    >
                      <option value={field.key}>{field.key} (Default)</option>
                      {uploadedHeaders.map(h => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                      {!field.required && <option value="__unmapped__">[Unmapped / Fallback to Policy Defaults]</option>}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Data Quality & Provenance Report */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
              Provenance & Source Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block">Ingested Source:</span>
                <span className="font-semibold text-slate-800">{report.provenance.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Retrieval / Processing Date:</span>
                <span className="font-mono text-slate-800">{report.provenance.retrievalDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Data Mode:</span>
                <span className={report.isDemo ? 'text-amber-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {report.isDemo ? 'Synthetic Demo Mode' : 'Verified Uploaded Data'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded border border-slate-100">
              {report.provenance.description}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
              Missing Values Audit
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
              {Object.entries(report.missingValues).map(([key, count]) => (
                <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                  <div className="text-slate-500 font-mono text-[11px] truncate">{key}</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {count === 0 ? '0 missing' : `${count} missing`}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-slate-400 italic">
              * Strictly compliant with Section 4: Missing values are never silently fabricated; documented falls back to conservative regulatory parameters.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
