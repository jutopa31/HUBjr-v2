import React from 'react';
import AdminTopicsPanel from './AdminTopicsPanel';

type Props = {
  onTopicsChanged?: () => void;
};

const AdminPanel: React.FC<Props> = ({ onTopicsChanged }) => {
  return <AdminTopicsPanel onTopicsChanged={onTopicsChanged} />;
};

export default AdminPanel;

