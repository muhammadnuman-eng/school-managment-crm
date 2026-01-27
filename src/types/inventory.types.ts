/**
 * Inventory Types
 * TypeScript types for inventory-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Item Status
 */
export type ItemStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/**
 * Transaction Type
 */
export type TransactionType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

/**
 * Inventory Category
 */
export interface InventoryCategory {
  id: string;
  schoolId: string;
  categoryName: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Inventory Category Request
 */
export interface CreateInventoryCategoryRequest {
  schoolId: string;
  categoryName: string;
  description?: string;
}

/**
 * Update Inventory Category Request
 */
export interface UpdateInventoryCategoryRequest {
  categoryName?: string;
  description?: string;
}

/**
 * Inventory Categories Response
 */
export interface InventoryCategoriesResponse {
  categories: InventoryCategory[];
  total?: number;
}

/**
 * Supplier
 */
export interface Supplier {
  id: string;
  schoolId: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Supplier Request
 */
export interface CreateSupplierRequest {
  schoolId: string;
  supplierName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Update Supplier Request
 */
export interface UpdateSupplierRequest {
  supplierName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Suppliers Response
 */
export interface SuppliersResponse {
  suppliers: Supplier[];
  total?: number;
}

/**
 * Inventory Item
 */
export interface InventoryItem {
  id: string;
  schoolId: string;
  categoryId: string;
  categoryName?: string;
  itemName: string;
  description?: string;
  unitOfMeasurement: string;
  quantity: number;
  minQuantity?: number;
  location?: string;
  purchasePrice?: number;
  supplierId?: string;
  supplierName?: string;
  status?: ItemStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Inventory Item Request
 */
export interface CreateInventoryItemRequest {
  schoolId: string;
  categoryId: string;
  itemName: string;
  description?: string;
  unitOfMeasurement: string;
  quantity: number;
  minQuantity?: number;
  location?: string;
  purchasePrice?: number;
  supplierId?: string;
}

/**
 * Update Inventory Item Request
 */
export interface UpdateInventoryItemRequest {
  itemName?: string;
  description?: string;
  categoryId?: string;
  unitOfMeasurement?: string;
  quantity?: number;
  minQuantity?: number;
  location?: string;
  purchasePrice?: number;
  supplierId?: string;
  status?: ItemStatus;
}

/**
 * Get Inventory Items Request
 */
export interface GetInventoryItemsRequest {
  categoryId?: string;
  status?: ItemStatus;
}

/**
 * Inventory Items Response
 */
export interface InventoryItemsResponse {
  items: InventoryItem[];
  total?: number;
}

/**
 * Inventory Transaction
 */
export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName?: string;
  transactionType: TransactionType;
  quantity: number;
  issuedTo?: string;
  receivedFrom?: string;
  purpose?: string;
  transactionDate: string;
  performedBy: string;
  performedByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Inventory Transaction Request
 */
export interface CreateInventoryTransactionRequest {
  itemId: string;
  transactionType: TransactionType;
  quantity: number;
  issuedTo?: string;
  receivedFrom?: string;
  purpose?: string;
  transactionDate: string;
  performedBy: string;
}

/**
 * Get Inventory Transactions Request
 */
export interface GetInventoryTransactionsRequest {
  itemId?: string;
  transactionType?: TransactionType;
}

/**
 * Inventory Transactions Response
 */
export interface InventoryTransactionsResponse {
  transactions: InventoryTransaction[];
  total?: number;
}

/**
 * Inventory Overview
 */
export interface InventoryOverview {
  totalItems: number;
  totalCategories: number;
  totalSuppliers: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentTransactions: number;
}


