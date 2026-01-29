/**
 * Fee Types
 * TypeScript types for fee-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Fee Type
 */
export interface FeeType {
  id: string;
  name: string;
  amount: number;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Student Fee Record
 */
export interface StudentFee {
  id: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  class: string;
  section?: string;
  feeTypeId: string;
  feeTypeName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partial' | 'Pending';
  dueDate?: string;
  paidDate?: string;
  paidTime?: string;
  createdAt?: string;
  createdTime?: string;
  paymentMethod?: string;
  notes?: string;
}

/**
 * Fee Types Response
 */
export interface FeeTypesResponse {
  feeTypes: FeeType[];
  total?: number;
}

/**
 * Student Fees Response
 */
export interface StudentFeesResponse {
  studentFees: StudentFee[];
  total?: number;
  totalAmount?: number;
  totalPaid?: number;
  totalDue?: number;
}

/**
 * Get Student Fees Request (optional filters)
 */
export interface GetStudentFeesRequest {
  class?: string;
  status?: 'Paid' | 'Partial' | 'Pending';
  studentId?: string;
  feeTypeId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Create Invoice Request
 */
export interface CreateInvoiceRequest {
  studentId: string;
  feeTypeId: string;
  totalAmount: number; // Backend expects totalAmount, not amount
  issueDate?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * Expense Record
 */
export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  time?: string;
  status: 'Paid' | 'Pending' | 'Approved';
  paymentMethod?: string;
  approvedBy?: string;
  createdAt?: string;
  createdTime?: string;
}

/**
 * Create Expense Request
 */
export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  date: string;
  time?: string;
  paymentMethod?: string;
  status?: 'Paid' | 'Pending' | 'Approved';
  approvedBy?: string;
}

/**
 * Expenses Response
 */
export interface ExpensesResponse {
  expenses: Expense[];
  total?: number;
  totalPaid?: number;
  totalPending?: number;
}

