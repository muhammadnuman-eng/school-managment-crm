/**
 * Communication Types
 * TypeScript types for communication-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Announcement Category
 */
export type AnnouncementCategory = 'GENERAL' | 'ACADEMIC' | 'EVENT' | 'EMERGENCY' | 'HOLIDAY';

/**
 * Priority Level
 */
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Target Audience
 */
export type TargetAudience = 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS' | 'SPECIFIC_CLASS' | 'SPECIFIC_SECTION';

/**
 * Announcement
 */
export interface Announcement {
  id: string;
  schoolId: string;
  createdBy: string;
  createdByName?: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority?: PriorityLevel;
  targetAudience: TargetAudience;
  scheduledAt?: string;
  targets?: Array<{
    classId?: string;
    sectionId?: string;
  }>;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Announcement Request
 */
export interface CreateAnnouncementRequest {
  schoolId: string;
  createdBy: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority?: PriorityLevel;
  targetAudience: TargetAudience;
  scheduledAt?: string;
  targets?: Array<{
    classId?: string;
    sectionId?: string;
  }>;
}

/**
 * Update Announcement Request
 */
export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  category?: AnnouncementCategory;
  priority?: PriorityLevel;
  targetAudience?: TargetAudience;
  scheduledAt?: string;
  targets?: Array<{
    classId?: string;
    sectionId?: string;
  }>;
}

/**
 * Get Announcements Request
 */
export interface GetAnnouncementsRequest {
  search?: string;
  category?: AnnouncementCategory;
  priority?: PriorityLevel;
  targetAudience?: TargetAudience;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Announcements Response
 */
export interface AnnouncementsResponse {
  announcements: Announcement[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Message
 */
export interface Message {
  id: string;
  schoolId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  subject?: string;
  content: string;
  priority?: PriorityLevel;
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Message Request
 */
export interface CreateMessageRequest {
  schoolId: string;
  senderId: string;
  recipientId: string;
  subject?: string;
  content: string;
  priority?: PriorityLevel;
}

/**
 * Bulk Message Request
 */
export interface BulkMessageRequest {
  schoolId: string;
  senderId: string;
  recipientIds: string[];
  subject?: string;
  content: string;
  priority?: PriorityLevel;
}

/**
 * Get Messages Request
 */
export interface GetMessagesRequest {
  search?: string;
  senderId?: string;
  recipientId?: string;
  priority?: PriorityLevel;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Messages Response
 */
export interface MessagesResponse {
  messages: Message[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Unread Count Response
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * Communication Template
 */
export interface CommunicationTemplate {
  id: string;
  schoolId: string;
  templateName: string;
  templateType: string;
  subject?: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Template Request
 */
export interface CreateTemplateRequest {
  schoolId: string;
  templateName: string;
  templateType: string;
  subject?: string;
  content: string;
}

/**
 * Update Template Request
 */
export interface UpdateTemplateRequest {
  templateName?: string;
  templateType?: string;
  subject?: string;
  content?: string;
}

/**
 * Get Templates Request
 */
export interface GetTemplatesRequest {
  templateType?: string;
}

/**
 * Templates Response
 */
export interface TemplatesResponse {
  templates: CommunicationTemplate[];
  total?: number;
}

/**
 * Get Recipients Request
 */
export interface GetRecipientsRequest {
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  classId?: string;
  sectionId?: string;
}

/**
 * Recipient
 */
export interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

/**
 * Recipients Response
 */
export interface RecipientsResponse {
  recipients: Recipient[];
  total?: number;
}

/**
 * Communication Summary
 */
export interface CommunicationSummary {
  totalMessages: number;
  unreadMessages: number;
  totalAnnouncements: number;
  recentAnnouncements: number;
  totalTemplates: number;
  recentActivity?: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}


