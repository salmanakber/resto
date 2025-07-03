'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ITAccess {
  id: string;
  userId: string;
  expiryDate: string;
  isActive: boolean;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function ITAccessManagement() {
  const [itAccess, setItAccess] = useState<ITAccess[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    expiryDate: '',
  });

  useEffect(() => {
    fetchITAccess();
    fetchUsers();
  }, []);

  const fetchITAccess = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/restaurants/employee/it-access');
      if (!response.ok) {
        throw new Error('Failed to fetch IT access');
      }
      const data = await response.json();
      setItAccess(data || []);
    } catch (error) {
      console.error('Error fetching IT access:', error);
      setItAccess([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/restaurants/employee');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch('/api/restaurants/employee/it-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create IT access');
      }

      setIsDialogOpen(false);
      fetchITAccess();
      setFormData({
        userId: '',
        expiryDate: '',
      });
    } catch (error) {
      console.error('Error creating IT access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/restaurants/employee/it-access?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke IT access');
      }

      fetchITAccess();
    } catch (error) {
      console.error('Error revoking IT access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Grant IT Access</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant IT Department Access</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="userId">Employee</Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) => setFormData({ ...formData, userId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {`${user.firstName} ${user.lastName} (${user.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Granting Access...' : 'Grant Access'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          ) : itAccess.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No IT access records found
              </TableCell>
            </TableRow>
          ) : (
            itAccess.map((access) => (
              <TableRow key={access.id}>
                <TableCell>
                  {access.user ? `${access.user.firstName} ${access.user.lastName}` : 'Unknown User'}
                </TableCell>
                <TableCell>{access.user?.email || 'N/A'}</TableCell>
                <TableCell>{new Date(access.expiryDate).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    access.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {access.isActive ? 'Active' : 'Expired'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => handleRevokeAccess(access.id)}
                    disabled={isLoading}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 