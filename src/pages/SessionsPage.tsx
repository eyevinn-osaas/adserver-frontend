import React from 'react';
import { List } from 'lucide-react';
import SessionList from '../components/SessionList';
import PageHeader from '../components/PageHeader';

const SessionsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Sessions"
        description="Manage and monitor all AdServer sessions."
        icon={List}
        iconColor="text-green-600"
      />

      {/* Sessions List */}
      <SessionList />
    </div>
  );
};

export default SessionsPage;