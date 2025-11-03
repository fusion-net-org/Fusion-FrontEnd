import React, { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import UserOverviewCharts from './UserOverviewCharts';

interface User {
  id: string;
  userName: string;
  status: boolean;
}

const OverviewUserPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setTimeout(() => {
      const mockUsers: User[] = [
        { id: '1', userName: 'John Doe', status: true },
        { id: '2', userName: 'Jane Smith', status: false },
        { id: '3', userName: 'Alex Nguyen', status: true },
        { id: '4', userName: 'Linh Tran', status: true },
        { id: '5', userName: 'David Pham', status: false },
      ];
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card title="User Overview" bordered className="shadow-md">
        <p className="text-gray-600 mb-4">
          Overview statistics of system users, including growth charts and activity status.
        </p>
        <UserOverviewCharts items={users} />
      </Card>
    </div>
  );
};

export default OverviewUserPage;
