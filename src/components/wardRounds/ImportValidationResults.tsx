import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { type ImportValidationResult } from '../../services/wardRoundsImportService';

interface ImportValidationResultsProps {
  result: ImportValidationResult;
}

const Badge: React.FC<{ label: string; value: number; color: string; icon?: React.ReactNode }> = ({
  label,
  value,
  color,
  icon
}) => (
  <div
    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium"
    style={{
      backgroundColor: `color-mix(in srgb, ${color} 12%, var(--bg-primary) 88%)`,
      color
    }}
  >
    {icon}
    <span>{label}: {value}</span>
  </div>
);

const IssuesList: React.FC<{
  title: string;
  issues: ImportValidationResult['errors'];
  defaultOpen?: boolean;
  color: string;
  icon: React.ReactNode;
}> = ({ title, issues, defaultOpen = false, color, icon }) => {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  if (!issues.length) return null;

  return (
    <div className="border rounded-lg overflow-hidden" style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 font-semibold"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 10%, var(--bg-primary) 90%)`,
          color
        }}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span>{title} ({issues.length})</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="max-h-[60vh] overflow-auto divide-y" style={{ borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }}>
          {issues.map((issue, idx) => (
            <div key={`${issue.field}-${issue.row}-${idx}`} className="px-4 py-3 space-y-1 text-sm" style={{ color: 'var(--text-primary)' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Fila {issue.row}</span>
                <span className="text-xs uppercase tracking-wide" style={{ color }}>
                  {issue.field}
                </span>
              </div>
              <div className="text-[var(--text-secondary)]">{issue.message}</div>
              {issue.value && (
                <div className="text-xs text-[var(--text-tertiary)] break-all">
                  Valor: {issue.value}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ImportValidationResults: React.FC<ImportValidationResultsProps> = ({ result }) => {
  const { summary, errors, warnings } = result;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge
          label="Nuevos"
          value={summary.newPatients}
          color="var(--state-success)"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <Badge
          label="Actualizaciones"
          value={summary.updates}
          color="var(--state-info)"
          icon={<Info className="h-4 w-4" />}
        />
        <Badge
          label="Errores"
          value={summary.errors}
          color="var(--state-error)"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <Badge
          label="Warnings"
          value={summary.warnings}
          color="var(--state-warning)"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <IssuesList
        title="Errores de validacion"
        issues={errors}
        defaultOpen={errors.length > 0}
        color="var(--state-error)"
        icon={<AlertCircle className="h-4 w-4" />}
      />

      <IssuesList
        title="Warnings"
        issues={warnings}
        defaultOpen={false}
        color="var(--state-warning)"
        icon={<AlertTriangle className="h-4 w-4" />}
      />
    </div>
  );
};

export default ImportValidationResults;
