"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function ITAccessPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/restaurants/employee?role=it_access');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const cleanup = async () => {
    setLoading(true);
    const res = await fetch('/api/restaurants/it-access/cleanup', { method: 'DELETE' });
    const data = await res.json();
    toast.success(`Deleted ${data.deleted} expired IT access users.`);
    fetchUsers();
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const getExpiry = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiry = new Date(created);
    expiry.setDate(expiry.getDate() + 3);
    return expiry.toLocaleDateString();
  };
  const isExpired = (createdAt: string) => {
    const expiry = new Date(createdAt);
    expiry.setDate(expiry.getDate() + 3);
    return new Date() > expiry;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IT Access Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={cleanup} disabled={loading} className="mb-4">Cleanup Expired Accounts</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getExpiry(user.createdAt)}</TableCell>
                  <TableCell>{isExpired(user.createdAt) ? <span className="text-red-500">Expired</span> : <span className="text-green-600">Active</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 