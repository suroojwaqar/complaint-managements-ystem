export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'client' | 'employee' | 'manager' | 'admin';
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  managerId?: User | string; // Can be populated User object or just ID string
  defaultAssigneeId?: User | string; // Can be populated User object or just ID string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NatureType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  natureType: NatureType;
  remark?: string;
  attachments: Attachment[];
  clientId: User;
  status: 'New' | 'Assigned' | 'In Progress' | 'Completed' | 'Done' | 'Closed';
  department: Department;
  currentAssigneeId: User;
  firstAssigneeId: User;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintHistory {
  _id: string;
  complaintId: string;
  status: string;
  assignedTo?: string;
  comment?: string;
  notes?: string;
  changedBy?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  complaintId: string;
  message: string;
  type: 'email' | 'whatsapp' | 'system';
  isRead: boolean;
  createdAt: string;
}

// Form types
export interface ComplaintFormData {
  title: string;
  description: string;
  errorType: string;
  errorScreen: string;
  natureType: string;
  remark?: string;
  department?: string; // Optional for clients, can be set by admins
  attachments?: Attachment[];
}

export interface NatureTypeFormData {
  name: string;
  description: string;
  isActive?: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'client' | 'employee' | 'manager' | 'admin';
  department?: string;
  isActive?: boolean;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  managerId: string;
  defaultAssigneeId: string;
  isActive?: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// Session types (extending NextAuth)
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      department?: string;
    }
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    department?: string;
  }
}
