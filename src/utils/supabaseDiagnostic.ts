import { supabase } from '../supabaseClient';

export interface FlaggedEntry {
  tableName: string;
  rowId: string | number;
  field: string;
  value: string;
  reason: string;
  fullRow: Record<string, any>;
}

export interface DiagnosticReport {
  timestamp: string;
  isConnected: boolean;
  connectionStatusMessage: string;
  supabaseUrl: string;
  tablesScanned: string[];
  totalRowsScanned: number;
  flaggedEntries: FlaggedEntry[];
  summary: {
    cleanRowsCount: number;
    flaggedRowsCount: number;
  };
}

// Common placeholder / suspicious test patterns
const PLACEHOLDER_PATTERNS = [
  /^idk$/i,
  /\bidk\b/i,
  /^test/i,
  /placeholder/i,
  /asdf/i,
  /qwerty/i,
  /^temp/i,
  /foo|bar|baz/i,
  /^xyz/i,
  /sample/i,
  /dummy/i,
  /^1234+/
];

const TABLES_TO_SCAN = [
  'products',
  'orders',
  'customers',
  'profiles',
  'users',
  'items',
  'cart',
  'categories'
];

export async function runSupabaseDiagnostic(): Promise<DiagnosticReport> {
  const timestamp = new Date().toISOString();
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';

  if (!supabaseUrl) {
    return {
      timestamp,
      isConnected: false,
      connectionStatusMessage: 'Supabase URL is not configured in environment variables (VITE_SUPABASE_URL is empty). No active remote database connected.',
      supabaseUrl: 'Not Configured',
      tablesScanned: [],
      totalRowsScanned: 0,
      flaggedEntries: [],
      summary: {
        cleanRowsCount: 0,
        flaggedRowsCount: 0,
      }
    };
  }

  const tablesScanned: string[] = [];
  const flaggedEntries: FlaggedEntry[] = [];
  let totalRows = 0;
  let isConnected = false;
  let connectionMessage = '';

  for (const table of TABLES_TO_SCAN) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(100);

      if (error) {
        // Table might not exist or permission denied
        continue;
      }

      isConnected = true;
      tablesScanned.push(table);

      if (data && Array.isArray(data)) {
        totalRows += data.length;

        data.forEach((row, idx) => {
          const rowId = row.id ?? row.uuid ?? `row-${idx}`;
          
          Object.entries(row).forEach(([field, value]) => {
            if (typeof value === 'string') {
              const matchedPattern = PLACEHOLDER_PATTERNS.find(pattern => pattern.test(value));
              if (matchedPattern) {
                flaggedEntries.push({
                  tableName: table,
                  rowId,
                  field,
                  value,
                  reason: `Contains placeholder pattern matching "${matchedPattern.source}"`,
                  fullRow: row
                });
              }
            }
          });
        });
      }
    } catch (err: any) {
      // Continue checking other tables
    }
  }

  if (!isConnected) {
    connectionMessage = 'Connected to Supabase client, but no accessible tables were found or permission was denied.';
  } else {
    connectionMessage = `Successfully connected to Supabase and scanned ${tablesScanned.length} table(s).`;
  }

  const flaggedRowsCount = new Set(flaggedEntries.map(e => `${e.tableName}:${e.rowId}`)).size;

  return {
    timestamp,
    isConnected,
    connectionStatusMessage: connectionMessage,
    supabaseUrl,
    tablesScanned,
    totalRowsScanned: totalRows,
    flaggedEntries,
    summary: {
      cleanRowsCount: totalRows - flaggedRowsCount,
      flaggedRowsCount,
    }
  };
}
