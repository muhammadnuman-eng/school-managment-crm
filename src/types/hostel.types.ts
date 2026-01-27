/**
 * Hostel Types
 * TypeScript types for hostel-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Building Type
 */
export type BuildingType = 'BOYS' | 'GIRLS' | 'MIXED';

/**
 * Room Type
 */
export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY';

/**
 * Room Status
 */
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

/**
 * Allocation Status
 */
export type AllocationStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/**
 * Complaint Status
 */
export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/**
 * Hostel Building
 */
export interface HostelBuilding {
  id: string;
  schoolId: string;
  buildingName: string;
  buildingType: BuildingType;
  numberOfFloors?: number;
  facilities?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Hostel Building Request
 */
export interface CreateHostelBuildingRequest {
  schoolId: string;
  buildingName: string;
  buildingType: BuildingType;
  numberOfFloors?: number;
  facilities?: Record<string, any>;
}

/**
 * Hostel Buildings Response
 */
export interface HostelBuildingsResponse {
  buildings: HostelBuilding[];
  total?: number;
}

/**
 * Hostel Room
 */
export interface HostelRoom {
  id: string;
  buildingId: string;
  buildingName?: string;
  roomNumber: string;
  floorNumber?: number;
  capacity: number;
  roomType: RoomType;
  facilities?: Record<string, any>;
  status?: RoomStatus;
  occupiedBeds?: number;
  availableBeds?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Hostel Room Request
 */
export interface CreateHostelRoomRequest {
  buildingId: string;
  roomNumber: string;
  floorNumber?: number;
  capacity: number;
  roomType: RoomType;
  facilities?: Record<string, any>;
}

/**
 * Update Hostel Room Request
 */
export interface UpdateHostelRoomRequest {
  roomNumber?: string;
  floorNumber?: number;
  capacity?: number;
  roomType?: RoomType;
  facilities?: Record<string, any>;
  status?: RoomStatus;
}

/**
 * Get Hostel Rooms Request
 */
export interface GetHostelRoomsRequest {
  buildingId?: string;
  status?: RoomStatus;
}

/**
 * Hostel Rooms Response
 */
export interface HostelRoomsResponse {
  rooms: HostelRoom[];
  total?: number;
}

/**
 * Hostel Allocation
 */
export interface HostelAllocation {
  id: string;
  studentId: string;
  studentName?: string;
  rollNo?: string;
  roomId: string;
  roomNumber?: string;
  buildingName?: string;
  bedNumber: string;
  wardenId?: string;
  wardenName?: string;
  checkInDate: string;
  checkOutDate?: string;
  status?: AllocationStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Hostel Allocation Request
 */
export interface CreateHostelAllocationRequest {
  studentId: string;
  roomId: string;
  bedNumber: string;
  wardenId?: string;
  checkInDate: string;
  checkOutDate?: string;
  status?: AllocationStatus;
}

/**
 * Update Hostel Allocation Request
 */
export interface UpdateHostelAllocationRequest {
  roomId?: string;
  bedNumber?: string;
  wardenId?: string;
  checkOutDate?: string;
  status?: AllocationStatus;
}

/**
 * Get Hostel Allocations Request
 */
export interface GetHostelAllocationsRequest {
  buildingId?: string;
  roomId?: string;
  studentId?: string;
  status?: AllocationStatus;
}

/**
 * Hostel Allocations Response
 */
export interface HostelAllocationsResponse {
  allocations: HostelAllocation[];
  total?: number;
}

/**
 * Hostel Complaint
 */
export interface HostelComplaint {
  id: string;
  studentId: string;
  studentName?: string;
  rollNo?: string;
  category: string;
  description: string;
  status?: ComplaintStatus;
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Hostel Complaint Request
 */
export interface CreateHostelComplaintRequest {
  studentId: string;
  category: string;
  description: string;
}

/**
 * Update Hostel Complaint Request
 */
export interface UpdateHostelComplaintRequest {
  status?: ComplaintStatus;
  resolvedBy?: string;
  resolutionNotes?: string;
}

/**
 * Get Hostel Complaints Request
 */
export interface GetHostelComplaintsRequest {
  studentId?: string;
  status?: ComplaintStatus;
}

/**
 * Hostel Complaints Response
 */
export interface HostelComplaintsResponse {
  complaints: HostelComplaint[];
  total?: number;
}

/**
 * Hostel Overview
 */
export interface HostelOverview {
  totalBuildings: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  totalStudents: number;
  pendingComplaints: number;
  maintenanceRooms: number;
}


