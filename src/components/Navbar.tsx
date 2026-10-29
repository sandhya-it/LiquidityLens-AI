import React from 'react';
import { Upload } from 'lucide-react';

export type NavPage =
  | 'executive'
  | 'data-quality'
  | 'forecast-explorer'
  | 'driver-analysis'
  | 'benchmarking'
  | 'buffer-simulator'
  | 'methodology';

interface NavbarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  isDemoData: boolean;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onSelectPage,
  isDemoData,
  onOpenUpload,
}) => {
  const navItems: { id: NavPage; label: string }[] = [
    { id: 'executive', label: 'Executive' },
    { id: 'forecast-explorer', label: 'Forecasts' },
    { id: 'buffer-simulator', label: 'Cash Buffer' },
    { id: 'driver-analysis', label: 'Drivers' },
    { id: 'benchmarking', label: 'Benchmarking' },
    { id: 'data-quality', label: 'Data Quality' },
    { id: 'methodology', label: 'Methodology' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectPage('executive')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-indigo-600 transition-colors text-left"
          >
            LiquidityLens AI
          </button>
          <span className="hidden lg:inline text-xs text-slate-400">· PS03 Cash Intelligence</span>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed, subtle hover) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Mandatory Demo Data Banner per Requirement 13 */}
      {isDemoData && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold text-center border-t border-amber-600 flex items-center justify-center gap-2">
          <span>DEMO DATA — NOT FOR REAL FINANCIAL DECISIONS</span>
          <span className="opacity-80 font-normal hidden sm:inline">
            (Showing pre-seeded 48-month AMFI/RBI synthetic series. Click "Upload CSV" to ingest official files.)
          </span>
        </div>
      )}
    </header>
  );
};
