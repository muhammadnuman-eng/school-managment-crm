/**
 * Role Check Utilities
 * Helper functions to check user roles and permissions
 */

import { userStorage } from './storage';

/**
 * Check if current user is a teacher
 */
export const isTeacher = (): boolean => {
  const user = userStorage.getUser();
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'teacher';
};

/**
 * Check if current user is an admin
 */
export const isAdmin = (): boolean => {
  const user = userStorage.getUser();
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'admin' || role === 'school_admin' || role === 'super_admin';
};

/**
 * Check if current user is a student
 */
export const isStudent = (): boolean => {
  const user = userStorage.getUser();
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'student';
};

/**
 * Get current user role
 */
export const getUserRole = (): string | null => {
  const user = userStorage.getUser();
  return user?.role || null;
};


