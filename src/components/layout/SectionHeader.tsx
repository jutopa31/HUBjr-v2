import React from 'react';

type SectionHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className = ''
}) => {
  return (
    <div className={`banner rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {icon ? <div className="shrink-0 mt-0.5">{icon}</div> : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div> : null}
      </div>
    </div>
  );
};

export default SectionHeader;
