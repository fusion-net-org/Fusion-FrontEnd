// src/pages/admin/UserDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Spin } from 'antd';
import { getUserById } from '@/services/userService.js';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await getUserById(id);
        if (res?.succeeded) setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin />
      </div>
    );
  if (!user) return <div className="text-center text-gray-500">User not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <Card title={`User Detail: ${user.userName}`} bordered className="shadow-md">
        <p>
          <b>Email:</b> {user.email}
        </p>
        <p>
          <b>Status:</b> {user.status ? 'Active' : 'Inactive'}
        </p>
        <p>
          <b>Created At:</b> {user.createdAt}
        </p>
      </Card>
    </div>
  );
}
