import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '../types';

/**
 * جلب جميع المستخدمين
 */
export const fetchUsers = async (): Promise<User[]> => {
  const response = await axios.get('/users');
  return response.data;
};

/**
 * جلب مستخدم محدد بواسطة المعرف
 */
export const fetchUserById = async (id: string): Promise<User> => {
  const response = await axios.get(`/users/${id}`);
  return response.data;
};

/**
 * إنشاء مستخدم جديد
 */
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const response = await axios.post('/users', user);
  return response.data;
};

/**
 * تحديث مستخدم موجود
 */
export const updateUser = async (user: User): Promise<User> => {
  const response = await axios.put(`/users/${user.id}`, user);
  return response.data;
};

/**
 * حذف مستخدم
 */
export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete(`/users/${id}`);
};

/**
 * تحديث حالة المستخدم (نشط/غير نشط)
 */
export const updateUserStatus = async ({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}): Promise<User> => {
  const response = await axios.patch(`/users/${id}/status`, { isActive });
  return response.data;
};

/**
 * React Query Hook لجلب كافة المستخدمين
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};

/**
 * React Query Hook لجلب مستخدم محدد بواسطة المعرف
 */
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUserById(id),
    enabled: !!id,
  });
};

/**
 * React Query Hook لإنشاء مستخدم جديد
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * React Query Hook لتحديث مستخدم موجود
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data: User) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', data.id] });
    },
  });
};

/**
 * React Query Hook لحذف مستخدم
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * React Query Hook لتحديث حالة المستخدم
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: (data: User) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', data.id] });
    },
  });
};
