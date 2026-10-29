import React, { useState } from 'react';
import { DataRecord, DataQualityReport } from './types';
import { OFFICIAL_BENCHMARK_DATA } from './data/sampleData';
import { processRawDataset, STANDARD_SCHEMA } from './services/dataLoader';
import { Navbar, NavPage } from './components/Navbar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DataUploadQuality } from './components/DataUploadQuality';
import { ForecastExplorer } from './components/ForecastExplorer';
import { DriverAnalysisView } from './components/DriverAnalysisView';
import { ModelBenchmarkingView } from './components/ModelBenchmarkingView';
import { CashBufferSimulatorView } from './components/CashBufferSimulatorView';
import { MethodologyView } from './components/MethodologyView';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('executive');

  // Initial processing of the benchmark dataset
  const [datasetState, setDatasetState] = useState<{ records: DataRecord[]; report: DataQualityReport }>(() => {
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
    const mapping: any = {};
    STANDARD_SCHEMA.forEach(f => {
      mapping[f.key] = f.key;
    });
    return processRawDataset(dummyHeaders, dummyRows, mapping, true);
  });

  const handleUpdateDataset = (newRecords: DataRecord[], newReport: DataQualityReport) => {
    setDatasetState({
      records: newRecords,
      report: newReport,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        isDemoData={datasetState.report.isDemo}
        onOpenUpload={() => setCurrentPage('data-quality')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'executive' && (
          <ExecutiveDashboard
            records={datasetState.records}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'data-quality' && (
          <DataUploadQuality
            currentRecords={datasetState.records}
            report={datasetState.report}
            onUpdateDataset={handleUpdateDataset}
          />
        )}

        {currentPage === 'forecast-explorer' && (
          <ForecastExplorer records={datasetState.records} />
        )}

        {currentPage === 'driver-analysis' && (
          <DriverAnalysisView records={datasetState.records} />
        )}

        {currentPage === 'benchmarking' && (
          <ModelBenchmarkingView records={datasetState.records} />
        )}

        {currentPage === 'buffer-simulator' && (
          <CashBufferSimulatorView records={datasetState.records} />
        )}

        {currentPage === 'methodology' && <MethodologyView />}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">LiquidityLens AI</span>
            <span>·</span>
            <span>Zeckathon PS03: Financial Forecasting & Cash Buffer Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentPage('methodology')}
              className="hover:text-slate-900 transition-colors"
            >
              Methodology & Formulas
            </button>
            <button
              onClick={() => setCurrentPage('data-quality')}
              className="hover:text-slate-900 transition-colors"
            >
              AMFI Schema Audit
            </button>
            <span>SEBI Regulatory Decision Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
