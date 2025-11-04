// src/pages/admin/UserDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin } from 'antd';
import { getUserFullInfo } from '@/services/userService.js';

export default function UserDetailPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const id = paramId || localStorage.getItem('userDetailId');

  useEffect(() => {
    if (!id) {
      navigate('/admin/users/list');
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await getUserFullInfo(id);
        if (res?.succeeded) setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin />
      </div>
    );

  if (!user) return <div className="text-center text-gray-500 mt-10">User not found.</div>;

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
          <b>Phone:</b> {user.phone}
        </p>
      </Card>
    </div>
  );
}
