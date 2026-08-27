import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error('Could not load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [rRes, dRes, pRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/departments'),
        fetch('/api/positions')
      ]);
      if (rRes.ok) setRoles(await rRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (pRes.ok) setPositions(await pRes.json());
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchReferenceData();
  }, [fetchUsers, fetchReferenceData]);

  const createUser = async (payload: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      toast.success('User created successfully');
      setUsers(prev => [...prev, data]);
      return { success: true, data };
    } catch (error: any) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (id: string, payload: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      
      toast.success('User updated successfully');
      setUsers(prev => prev.map(u => u.id === id ? data : u));
      return { success: true, data };
    } catch (error: any) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  return {
    users,
    roles,
    departments,
    positions,
    isLoading,
    fetchUsers,
    createUser,
    updateUser
  };
}
