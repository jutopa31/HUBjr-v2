import React from 'react';

interface WizardContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const WizardContainer: React.FC<WizardContainerProps> = ({ title, description, children }) => {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5 border-gray-200 bg-white">
        <h2 className="text-gray-900 text-lg font-semibold">{title}</h2>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>
      <div className="rounded-xl border p-6 border-gray-200 bg-white">{children}</div>
    </div>
  );
};

export default React.memo(WizardContainer);
