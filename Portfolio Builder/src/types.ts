export interface SkillItem {
  name: string;
  category: string;
  level: number; // 0 - 100
}

export interface Portfolio {
  userId: string;
  name: string;
  bio: string;
  profilePhoto?: string;
  email: string;
  phone?: string;
  location?: string;
  socialGithub?: string;
  socialLinkedin?: string;
  socialTwitter?: string;
  templateId: 'modern' | 'creative' | 'professional';
  sectionsOrder: string[]; // e.g. ['hero', 'about', 'skills', 'projects', 'contact']
  seoTitle?: string;
  seoDescription?: string;
  skills: SkillItem[];
  isPublished: boolean;
  updatedAt: any; // Firestore Timestamp
}

export interface Project {
  projectId: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  order: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type TemplateId = 'modern' | 'creative' | 'professional';
