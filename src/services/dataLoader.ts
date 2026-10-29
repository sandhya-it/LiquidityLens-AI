import { DataRecord, DataQualityReport, StandardSchemaField, FundCategory } from '../types';

export const STANDARD_SCHEMA: StandardSchemaField[] = [
  {
    key: 'date',
    label: 'Observation Date',
    type: 'string',
    required: true,
    unit: 'YYYY-MM',
    description: 'Reporting month release (e.g. 2024-03)',
    aliases: ['date', 'month', 'period', 'reporting_month', 'release_date'],
  },
  {
    key: 'fund_category',
    label: 'Fund Category',
    type: 'string',
    required: true,
    unit: 'Category Name',
    description: 'Liquid Fund or Overnight Fund',
    aliases: ['fund_category', 'category', 'fund_type', 'scheme_category', 'category_name'],
  },
  {
    key: 'net_flow',
    label: 'Net Monthly Flow',
    type: 'number',
    required: true,
    unit: '₹ Crores',
    description: 'Net inflow (+) or net redemption (-) during the month',
    aliases: ['net_flow', 'net_inflow', 'flow', 'net_flows', 'net_amount_cr', 'net_sales'],
  },
  {
    key: 'AUM',
    label: 'Closing / Average AUM',
    type: 'number',
    required: true,
    unit: '₹ Crores',
    description: 'Category Assets Under Management at month-end',
    aliases: ['aum', 'closing_aum', 'average_aum', 'aaum', 'total_aum_cr'],
  },
  {
    key: 'repo_rate',
    label: 'RBI Repo Rate',
    type: 'number',
    required: false,
    unit: '% p.a.',
    description: 'RBI Policy Repo rate',
    aliases: ['repo_rate', 'repo', 'policy_rate', 'rbi_repo'],
  },
  {
    key: 'overnight_rate',
    label: 'Overnight / TREPS Rate',
    type: 'number',
    required: false,
    unit: '% p.a.',
    description: 'Weighted average overnight money market rate',
    aliases: ['overnight_rate', 'treps_rate', 'call_rate', 'overnight_treps'],
  },
  {
    key: 'banking_liquidity',
    label: 'Banking System Liquidity',
    type: 'number',
    required: false,
    unit: '₹ Crores',
    description: 'Net LAF liquidity balance (+ = surplus, - = deficit)',
    aliases: ['banking_liquidity', 'system_liquidity', 'laf_balance', 'net_laf_cr'],
  },
  {
    key: 'T_bill_yield',
    label: '91-Day T-Bill Yield',
    type: 'number',
    required: false,
    unit: '% p.a.',
    description: 'FBIL/CCIL 91-day Treasury Bill cut-off yield',
    aliases: ['t_bill_yield', 'tbill_yield', '91d_tbill', 't_bill_91d'],
  },
  {
    key: 'commercial_paper_yield',
    label: '3-Month CP Yield',
    type: 'number',
    required: false,
    unit: '% p.a.',
    description: '3-month primary / secondary Commercial Paper yield',
    aliases: ['commercial_paper_yield', 'cp_yield', '3m_cp', 'cp_rate'],
  },
  {
    key: 'equity_market_return',
    label: 'Nifty 50 Monthly Return',
    type: 'number',
    required: false,
    unit: '%',
    description: 'Monthly percentage change in NSE Nifty 50 index',
    aliases: ['equity_market_return', 'nifty_return', 'equity_return', 'nifty50_pct'],
  },
  {
    key: 'advance_tax_flag',
    label: 'Advance Tax Period',
    type: 'number',
    required: false,
    unit: '0 or 1',
    description: '1 for advance-tax due dates (Mar, Jun, Sep, Dec)',
    aliases: ['advance_tax_flag', 'advance_tax', 'tax_date_flag', 'is_advance_tax'],
  },
  {
    key: 'quarter_end_flag',
    label: 'Quarter End Flag',
    type: 'number',
    required: false,
    unit: '0 or 1',
    description: '1 for calendar quarter end months (Mar, Jun, Sep, Dec)',
    aliases: ['quarter_end_flag', 'quarter_end', 'is_quarter_end'],
  },
  {
    key: 'fiscal_year_end_flag',
    label: 'Fiscal Year End Flag',
    type: 'number',
    required: false,
    unit: '0 or 1',
    description: '1 for Indian fiscal year end (March)',
    aliases: ['fiscal_year_end_flag', 'fiscal_year_end', 'year_end_march', 'is_fy_end'],
  },
];

/**
 * Robust CSV parser handles double quotes, trimming, and multiple line breaks
 */
export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r\n|\n/);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    rows.push(parseLine(line));
  }

  return { headers, rows };
}

/**
 * Map raw uploaded CSV columns to our canonical schema
 */
export function autoMapColumns(uploadedHeaders: string[]): Record<keyof DataRecord, string | null> {
  const mapping = {} as Record<keyof DataRecord, string | null>;
  const cleanHeader = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  STANDARD_SCHEMA.forEach(field => {
    const matched = uploadedHeaders.find(h => {
      const cleanH = cleanHeader(h);
      return field.aliases.some(alias => cleanHeader(alias) === cleanH);
    });
    mapping[field.key] = matched || null;
  });

  return mapping;
}

/**
 * Standardize dates to YYYY-MM
 */
export function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/\//g, '-');
  
  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(clean)) return clean;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean.substring(0, 7);
  // DD-MM-YYYY
  const ddmmyyyy = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyy) {
    const y = ddmmyyyy[3];
    const m = ddmmyyyy[2].padStart(2, '0');
    return `${y}-${m}`;
  }
  // Month-Year string like "Mar-2024" or "March 2024"
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const parts = clean.toLowerCase().split(/[\s-]+/);
  if (parts.length === 2) {
    const mStr = parts[0].substring(0, 3);
    const yStr = parts[1];
    if (monthMap[mStr] && yStr.length === 4) {
      return `${yStr}-${monthMap[mStr]}`;
    }
  }
  return null;
}

/**
 * Normalize Category
 */
export function normalizeCategory(raw: string): FundCategory | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s.includes('liquid')) return 'Liquid Fund';
  if (s.includes('overnight')) return 'Overnight Fund';
  return null;
}

/**
 * Process and validate uploaded rows with mapped schema
 */
export function processRawDataset(
  headers: string[],
  rows: string[][],
  columnMapping: Record<keyof DataRecord, string | null>,
  isDemo: boolean = false
): { records: DataRecord[]; report: DataQualityReport } {
  const records: DataRecord[] = [];
  const missingCounts: Record<string, number> = {};
  const seenKeys = new Set<string>();
  let duplicateCount = 0;

  STANDARD_SCHEMA.forEach(f => {
    missingCounts[f.key] = 0;
  });

  const getColIndex = (fieldKey: keyof DataRecord): number => {
    const mappedCol = columnMapping[fieldKey];
    if (!mappedCol) return -1;
    return headers.indexOf(mappedCol);
  };

  rows.forEach((row, rowIndex) => {
    const dateIdx = getColIndex('date');
    const catIdx = getColIndex('fund_category');
    const flowIdx = getColIndex('net_flow');
    const aumIdx = getColIndex('AUM');

    const rawDate = dateIdx >= 0 ? row[dateIdx] : '';
    const rawCat = catIdx >= 0 ? row[catIdx] : '';
    const rawFlow = flowIdx >= 0 ? row[flowIdx] : '';
    const rawAum = aumIdx >= 0 ? row[aumIdx] : '';

    const normDate = normalizeDate(rawDate);
    const normCat = normalizeCategory(rawCat);

    if (!normDate || !normCat) {
      return; // Skip invalid header/summary rows
    }

    const recKey = `${normDate}_${normCat}`;
    if (seenKeys.has(recKey)) {
      duplicateCount++;
      return; // Deduplicate
    }
    seenKeys.add(recKey);

    const parseNum = (val: string | undefined, fieldKey: string, fallback: number = 0): number => {
      if (val === undefined || val === null || val.trim() === '') {
        missingCounts[fieldKey] = (missingCounts[fieldKey] || 0) + 1;
        return fallback;
      }
      const cleaned = val.replace(/,/g, '').trim();
      const n = parseFloat(cleaned);
      if (isNaN(n)) {
        missingCounts[fieldKey] = (missingCounts[fieldKey] || 0) + 1;
        return fallback;
      }
      return n;
    };

    const monthNum = parseInt(normDate.split('-')[1], 10);
    const isQuarterEnd = [3, 6, 9, 12].includes(monthNum) ? 1 : 0;
    const isAdvanceTax = isQuarterEnd;
    const isFYEnd = monthNum === 3 ? 1 : 0;

    const netFlow = parseNum(rawFlow, 'net_flow');
    const aum = parseNum(rawAum, 'AUM', 10000);

    const repoIdx = getColIndex('repo_rate');
    const overnightIdx = getColIndex('overnight_rate');
    const bankLiqIdx = getColIndex('banking_liquidity');
    const tbillIdx = getColIndex('T_bill_yield');
    const cpIdx = getColIndex('commercial_paper_yield');
    const equityIdx = getColIndex('equity_market_return');

    const repoRate = repoIdx >= 0 ? parseNum(row[repoIdx], 'repo_rate', 6.50) : 6.50;
    const overnightRate = overnightIdx >= 0 ? parseNum(row[overnightIdx], 'overnight_rate', repoRate - 0.05) : repoRate - 0.05;
    const bankingLiq = bankLiqIdx >= 0 ? parseNum(row[bankLiqIdx], 'banking_liquidity', 0) : 0;
    const tbillYield = tbillIdx >= 0 ? parseNum(row[tbillIdx], 'T_bill_yield', repoRate + 0.3) : repoRate + 0.3;
    const cpYield = cpIdx >= 0 ? parseNum(row[cpIdx], 'commercial_paper_yield', repoRate + 0.9) : repoRate + 0.9;
    const equityReturn = equityIdx >= 0 ? parseNum(row[equityIdx], 'equity_market_return', 1.0) : 1.0;

    records.push({
      date: normDate,
      fund_category: normCat,
      net_flow: netFlow,
      AUM: aum,
      repo_rate: repoRate,
      overnight_rate: overnightRate,
      banking_liquidity: bankingLiq,
      T_bill_yield: tbillYield,
      commercial_paper_yield: cpYield,
      equity_market_return: equityReturn,
      advance_tax_flag: isAdvanceTax,
      quarter_end_flag: isQuarterEnd,
      fiscal_year_end_flag: isFYEnd,
      is_demo: isDemo,
    });
  });

  // Chronological sort
  records.sort((a, b) => a.date.localeCompare(b.date));

  // Determine coverage and quality metrics
  const dates = Array.from(new Set(records.map(r => r.date))).sort();
  const startDate = dates.length > 0 ? dates[0] : 'N/A';
  const endDate = dates.length > 0 ? dates[dates.length - 1] : 'N/A';

  // Check gaps
  const dateGaps: string[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const cur = dates[i].split('-').map(Number);
    const next = dates[i + 1].split('-').map(Number);
    const expectedMonth = cur[1] === 12 ? 1 : cur[1] + 1;
    const expectedYear = cur[1] === 12 ? cur[0] + 1 : cur[0];
    const expectedStr = `${expectedYear}-${String(expectedMonth).padStart(2, '0')}`;
    if (dates[i + 1] !== expectedStr) {
      dateGaps.push(`Gap between ${dates[i]} and ${dates[i + 1]}`);
    }
  }

  const liquidCount = records.filter(r => r.fund_category === 'Liquid Fund').length;
  const overnightCount = records.filter(r => r.fund_category === 'Overnight Fund').length;

  const minAUM = records.reduce((acc, r) => Math.min(acc, r.AUM), Infinity);
  let unitCheck: 'Valid (₹ Crores)' | 'Suspected Mismatch' | 'Unknown' = 'Valid (₹ Crores)';
  if (minAUM < 50) {
    unitCheck = 'Suspected Mismatch'; // Might be in Billions or Lakhs
  }

  const totalRecords = records.length;
  let status: 'Ready' | 'Incomplete History' | 'Critical Errors' = 'Ready';
  if (totalRecords < 12) {
    status = 'Incomplete History';
  } else if (liquidCount === 0 && overnightCount === 0) {
    status = 'Critical Errors';
  }

  const report: DataQualityReport = {
    totalRecords,
    uniqueMonths: dates.length,
    startDate,
    endDate,
    liquidCount,
    overnightCount,
    missingValues: missingCounts,
    duplicateRows: duplicateCount,
    dateGaps,
    unitCheck,
    status,
    isDemo,
    provenance: {
      source: isDemo ? 'Synthetic AMFI & RBI Benchmark Series' : 'Uploaded Custom Financial CSV Dataset',
      retrievalDate: new Date().toISOString().split('T')[0],
      description: isDemo
        ? 'Pre-seeded 48-month benchmark (Oct 2022 - Sep 2026) capturing authentic Indian market seasonalities (advance taxes, FY-end, RBI rate cycles).'
        : 'User uploaded dataset ingested via official schema parser.',
    },
  };

  return { records, report };
}

/**
 * Export records to standard CSV for user download
 */
export function exportToCSV(records: DataRecord[]): string {
  const headers = [
    'date',
    'fund_category',
    'net_flow',
    'AUM',
    'repo_rate',
    'overnight_rate',
    'banking_liquidity',
    'T_bill_yield',
    'commercial_paper_yield',
    'equity_market_return',
    'advance_tax_flag',
    'quarter_end_flag',
    'fiscal_year_end_flag',
  ];

  const lines = [headers.join(',')];
  records.forEach(r => {
    lines.push([
      r.date,
      `"${r.fund_category}"`,
      r.net_flow.toFixed(2),
      r.AUM.toFixed(2),
      r.repo_rate.toFixed(2),
      r.overnight_rate.toFixed(2),
      r.banking_liquidity.toFixed(2),
      r.T_bill_yield.toFixed(2),
      r.commercial_paper_yield.toFixed(2),
      r.equity_market_return.toFixed(2),
      r.advance_tax_flag,
      r.quarter_end_flag,
      r.fiscal_year_end_flag,
    ].join(','));
  });

  return lines.join('\n');
}
