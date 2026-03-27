export interface User {
  id: number;
  username: string;
  email?: string;
  realName?: string;
  role: 'admin' | 'manager' | 'user';
  departmentId?: number;
  department?: Department;
  dataScope?: 'self' | 'department' | 'all';
  status: number;
  createdAt?: string;
}

export interface Department {
  id: number;
  name: string;
  parentId?: number;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Customer {
  id: number;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  source?: string;
  ownerId?: number;
  owner?: User;
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  leads?: Lead[];
  opportunities?: Opportunity[];
  contracts?: Contract[];
}

export interface Lead {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  source?: string;
  ownerId?: number;
  owner?: User;
  status: number;
  customerId?: number;
  customer?: Customer;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: number;
  name: string;
  customerId: number;
  customer?: Customer;
  amount: number;
  stage: string;
  probability: number;
  expectedDate?: string;
  ownerId?: number;
  owner?: User;
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  contracts?: Contract[];
}

export interface Contract {
  id: number;
  contractNo: string;
  customerId: number;
  customer?: Customer;
  opportunityId?: number;
  opportunity?: Opportunity;
  amount: number;
  signDate?: string;
  startDate?: string;
  endDate?: string;
  status: number;
  fileUrl?: string;
  remark?: string;
  createdBy?: number;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  content?: string;
  type: string;
  priority: number;
  dueDate?: string;
  assigneeId?: number;
  assignee?: User;
  ownerId?: number;
  creator?: User;
  relatedType?: string;
  relatedId?: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  userId: number;
  user?: User;
  type: string;
  action: string;
  targetType?: string;
  targetId?: number;
  content?: string;
  createdAt: string;
}

export interface DashboardStats {
  customers: { total: number };
  leads: { total: number; new: number; converted: number };
  opportunities: { total: number; amount: number };
  contracts: { total: number; amount: number };
  tasks: { total: number; pending: number; completed: number };
  activities: { today: number };
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  amount: number;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
}