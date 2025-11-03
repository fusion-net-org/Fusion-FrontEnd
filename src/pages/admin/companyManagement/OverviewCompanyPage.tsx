import React from 'react';
import { Card } from 'antd';
import CompanyOverviewChart from './CompanyOverviewChart';

const OverviewCompanyPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <Card title="Company Overview" bordered className="shadow-md">
        <p className="text-gray-600 mb-4">
          Overview of companies in the system, including the number of new companies created per
          month and the ratio of active to inactive companies.
        </p>
        <CompanyOverviewChart />
      </Card>
    </div>
  );
};

export default OverviewCompanyPage;
