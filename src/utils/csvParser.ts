import Papa, { type ParseError, type ParseMeta, type ParseResult } from 'papaparse';
import { type HospitalContext } from '../types';

export interface CSVRow {
  CAMA?: string;
  DNI?: string;
  NOMBRE?: string;
  EDAD?: string;
  ANT?: string;
  MC?: string;
  'EF/NIHSS/ABCD2'?: string;
  EC?: string;
  SEV?: string;
  DX?: string;
  PLAN?: string;
  [key: string]: string | undefined;
}

export interface CSVParseResult {
  rows: CSVRow[];
  errors: ParseError[];
  meta: ParseMeta;
}

const BASE_PARSE_CONFIG: Papa.ParseConfig<CSVRow> = {
  header: true,
  skipEmptyLines: 'greedy',
  transform: (value) => (typeof value === 'string' ? value.trim() : value),
  beforeFirstChunk: (chunk) => {
    // Skip the first 3 header rows so the 4th row becomes the header row
    const lines = chunk.split(/\r\n|\n|\r/);
    return lines.slice(3).join('\n');
  }
};

const GOOGLE_SHEETS_REGEX = /https?:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]+)\/.*?(?:[#?]gid=)?(\d+)?/;

export const convertToCSVExportURL = (url: string): string => {
  const match = url.match(GOOGLE_SHEETS_REGEX);
  if (!match) return url;

  const [, docId, gid] = match;
  const gidParam = gid ? `&gid=${gid}` : '';
  return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv${gidParam}`;
};

export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  const parseConfig: Papa.ParseConfig<CSVRow> = {
    ...BASE_PARSE_CONFIG,
    complete: (results) => results
  };

  const results = await new Promise<ParseResult<CSVRow>>((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      ...parseConfig,
      complete: (res) => resolve(res),
      error: (error: Error) => reject(error)
    });
  });

  return {
    rows: (results.data || []).filter(Boolean),
    errors: results.errors,
    meta: results.meta
  };
}

export async function parseCSVFromURL(url: string): Promise<CSVParseResult> {
  const exportUrl = convertToCSVExportURL(url);
  const response = await fetch(exportUrl);

  if (!response.ok) {
    throw new Error(`No se pudo obtener el CSV (${response.status})`);
  }

  const content = await response.text();
  return parseCSVContent(content);
}

function parseCSVContent(content: string): Promise<CSVParseResult> {
  return new Promise<CSVParseResult>((resolve, reject) => {
    Papa.parse<CSVRow>(content, {
      ...BASE_PARSE_CONFIG,
      complete: (results) => {
        resolve({
          rows: (results.data || []).filter(Boolean),
          errors: results.errors,
          meta: results.meta
        });
      },
      error: (error: Error) => reject(error)
    });
  });
}

export const normalizeDateInput = (value: string, fallback: string): string => {
  if (!value) return fallback;
  // Ensure YYYY-MM-DD to avoid timezone shifts
  const parts = value.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return value;
  }
  return fallback;
};

export const getHospitalContext = (context?: HospitalContext): HospitalContext => {
  return context || 'Posadas';
};
