export type Priority = 'low' | 'medium' | 'high' | 'small' | 'mediume' | 'large';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  category: string;
  priority: Priority;
  deadline: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
}
