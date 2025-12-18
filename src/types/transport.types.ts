/**
 * Transport Types
 * TypeScript types for transport-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Bus Type
 */
export type BusType = 'STANDARD' | 'DELUXE' | 'LUXURY';

/**
 * Bus Status
 */
export type BusStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

/**
 * Route Status
 */
export type RouteStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Student Transport Status
 */
export type StudentTransportStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/**
 * Bus
 */
export interface Bus {
  id: string;
  schoolId: string;
  registrationNumber: string;
  capacity: number;
  busType?: BusType;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  status?: BusStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Bus Request
 */
export interface CreateBusRequest {
  schoolId: string;
  registrationNumber: string;
  capacity: number;
  busType?: BusType;
  insuranceNumber?: string;
  insuranceExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

/**
 * Get Buses Request
 */
export interface GetBusesRequest {
  status?: BusStatus;
}

/**
 * Buses Response
 */
export interface BusesResponse {
  buses: Bus[];
  total?: number;
}

/**
 * Driver
 */
export interface Driver {
  id: string;
  schoolId: string;
  name: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  experienceYears?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Driver Request
 */
export interface CreateDriverRequest {
  schoolId: string;
  name: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  experienceYears?: number;
}

/**
 * Drivers Response
 */
export interface DriversResponse {
  drivers: Driver[];
  total?: number;
}

/**
 * Route Stop
 */
export interface RouteStop {
  stopName: string;
  stopAddress?: string;
  pickupTime?: string;
  dropTime?: string;
  stopOrder: number;
  id?: string;
}

/**
 * Transport Route
 */
export interface TransportRoute {
  id: string;
  schoolId: string;
  routeName: string;
  busId: string;
  busRegistrationNumber?: string;
  driverId: string;
  driverName?: string;
  status?: RouteStatus;
  monthlyFee?: number;
  yearlyFee?: number;
  stops?: RouteStop[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Transport Route Request
 */
export interface CreateTransportRouteRequest {
  schoolId: string;
  routeName: string;
  busId: string;
  driverId: string;
  status?: RouteStatus;
  monthlyFee?: number;
  yearlyFee?: number;
  stops?: RouteStop[];
}

/**
 * Get Transport Routes Request
 */
export interface GetTransportRoutesRequest {
  status?: RouteStatus;
}

/**
 * Transport Routes Response
 */
export interface TransportRoutesResponse {
  routes: TransportRoute[];
  total?: number;
}

/**
 * Student Transport
 */
export interface StudentTransport {
  id: string;
  studentId: string;
  studentName?: string;
  rollNo?: string;
  routeId: string;
  routeName?: string;
  pickupStopId?: string;
  pickupStopName?: string;
  dropStopId?: string;
  dropStopName?: string;
  feeStructure?: string;
  status?: StudentTransportStatus;
  assignedDate: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Student Transport Request
 */
export interface CreateStudentTransportRequest {
  studentId: string;
  routeId: string;
  pickupStopId?: string;
  dropStopId?: string;
  feeStructure?: string;
  status?: StudentTransportStatus;
  assignedDate: string;
}

/**
 * Get Student Transports Request
 */
export interface GetStudentTransportsRequest {
  routeId?: string;
  studentId?: string;
}

/**
 * Student Transports Response
 */
export interface StudentTransportsResponse {
  studentTransports: StudentTransport[];
  total?: number;
}


