export type UserRole = 'member' | 'moderator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: any;
  updatedAt?: any;
}

export type ResourceType = 'pdf' | 'video' | 'website' | 'doc';
export type ResourceStatus = 'active' | 'hidden';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string;
  resourceType: ResourceType;
  externalUrl?: string;
  fileUrl?: string;
  fileName?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: ResourceStatus;
  viewCount: number;
  favoriteCount: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Favorite {
  id: string;
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory: string;
  resourceType: ResourceType;
  createdAt: any;
}

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reason: string;
  details: string;
  status: ReportStatus;
  createdAt: any;
  resolvedAt?: any;
}

export interface ModerationLog {
  id: string;
  moderatorId: string;
  moderatorEmail: string;
  action: string;
  targetId: string;
  targetType: 'resource' | 'user' | 'settings';
  details: string;
  timestamp: any;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  announcement: string;
  announcementActive: boolean;
  categories: string[];
  gradeLevels: string[];
  updatedAt?: any;
  updatedBy?: string;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
