import React, { useState, useEffect } from 'react';
import { Portfolio, Project, SkillItem, TemplateId } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { compressImage } from '../lib/image';
import TemplateRenderer from './TemplateRenderer';
import {
  User,
  Sliders,
  Award,
  Briefcase,
  Share2,
  Settings,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  LogOut,
  Upload,
  ExternalLink,
  HelpCircle,
  Copy,
  FolderDot,
  Globe,
} from 'lucide-react';

interface PortfolioEditorProps {
  user: any;
  onSignOut: () => void;
}

export default function PortfolioEditor({ user, onSignOut }: PortfolioEditorProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'sections' | 'skills' | 'projects' | 'design' | 'seo'>('profile');
  
  // App state
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    tags: '',
    demoUrl: '',
    githubUrl: '',
    order: 0,
  });

  // Local form state for skills input
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Frontend', level: 80 });

  // Load user data on startup
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const portfolioRef = doc(db, 'portfolios', user.uid);
        const projectsRef = collection(db, 'portfolios', user.uid, 'projects');

        // Fetch portfolio
        let portData: Portfolio | null = null;
        try {
          const portSnap = await getDoc(portfolioRef);
          if (portSnap.exists()) {
            portData = { id: portSnap.id, ...portSnap.data() } as any;
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `portfolios/${user.uid}`);
        }

        // Fetch projects
        let projList: Project[] = [];
        try {
          const q = query(projectsRef, orderBy('order', 'asc'));
          const projSnap = await getDocs(q);
          projList = projSnap.docs.map(doc => ({ projectId: doc.id, ...doc.data() } as Project));
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, `portfolios/${user.uid}/projects`);
        }

        if (portData) {
          setPortfolio(portData);
        } else {
          // SEED INITIAL BEAUTIFUL STARTER PORTFOLIO
          const defaultPortfolio: Portfolio = {
            userId: user.uid,
            name: user.displayName || 'Professional Creator',
            bio: 'I build clean, fully responsive, interactive applications using modern tech stacks. Focused on delivering premium digital craft with high technical stability.',
            email: user.email || '',
            phone: '',
            location: 'San Francisco, CA',
            socialGithub: '',
            socialLinkedin: '',
            socialTwitter: '',
            templateId: 'modern',
            sectionsOrder: ['hero', 'about', 'skills', 'projects', 'contact'],
            seoTitle: `${user.displayName || 'My'} Portfolio Site`,
            seoDescription: 'A custom portfolio demonstrating technical proficiency and creative works.',
            skills: [
              { name: 'React', category: 'Frontend', level: 90 },
              { name: 'TypeScript', category: 'Frontend', level: 85 },
              { name: 'Tailwind CSS', category: 'Frontend', level: 95 },
              { name: 'Node.js', category: 'Backend', level: 80 },
              { name: 'Firebase', category: 'Database', level: 85 },
            ],
            isPublished: false,
            updatedAt: new Date(),
          };

          const path = `portfolios/${user.uid}`;
          try {
            await setDoc(doc(db, 'portfolios', user.uid), {
              ...defaultPortfolio,
              updatedAt: serverTimestamp(),
            });
            setPortfolio(defaultPortfolio);
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, path);
          }
        }

        setProjects(projList);
      } catch (err: any) {
        console.error(err);
        setError('Failed to sync with database: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.uid, user.displayName, user.email]);

  // Handle general portfolio info saving
  const handleSavePortfolio = async (updatedFields: Partial<Portfolio>) => {
    if (!portfolio) return;
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    const path = `portfolios/${user.uid}`;
    try {
      const merged = {
        ...portfolio,
        ...updatedFields,
        updatedAt: new Date(), // Local update for instant rendering
      };

      await updateDoc(doc(db, 'portfolios', user.uid), {
        ...updatedFields,
        updatedAt: serverTimestamp(),
      });

      setPortfolio(merged);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError('Failed to update portfolio: ' + e);
      handleFirestoreError(e, OperationType.UPDATE, path);
    } finally {
      setSaving(false);
    }
  };

  // Add/Remove Skills
  const handleAddSkill = () => {
    if (!portfolio || !newSkill.name.trim()) return;
    const updatedSkills = [...portfolio.skills, { ...newSkill }];
    handleSavePortfolio({ skills: updatedSkills });
    setNewSkill({ name: '', category: 'Frontend', level: 80 });
  };

  const handleRemoveSkill = (index: number) => {
    if (!portfolio) return;
    const updatedSkills = portfolio.skills.filter((_, i) => i !== index);
    handleSavePortfolio({ skills: updatedSkills });
  };

  // Sections ordering & visibility triggers
  const moveSection = (direction: 'up' | 'down', index: number) => {
    if (!portfolio) return;
    const newOrder = [...portfolio.sectionsOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    handleSavePortfolio({ sectionsOrder: newOrder });
  };

  const toggleSectionVisibility = (section: string) => {
    if (!portfolio) return;
    let newOrder = [...portfolio.sectionsOrder];
    if (newOrder.includes(section)) {
      newOrder = newOrder.filter(s => s !== section);
    } else {
      newOrder.push(section);
    }
    handleSavePortfolio({ sectionsOrder: newOrder });
  };

  // Project managers
  const openNewProjectModal = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      description: '',
      imageUrl: '',
      category: 'Frontend',
      tags: '',
      demoUrl: '',
      githubUrl: '',
      order: projects.length,
    });
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectForm({
      title: proj.title,
      description: proj.description,
      imageUrl: proj.imageUrl || '',
      category: proj.category,
      tags: proj.tags.join(', '),
      demoUrl: proj.demoUrl || '',
      githubUrl: proj.githubUrl || '',
      order: proj.order,
    });
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portfolio) return;
    setSaving(true);
    setError(null);

    const isNew = !editingProject;
    const id = isNew ? `project_${Date.now()}` : editingProject!.projectId;
    const path = `portfolios/${user.uid}/projects/${id}`;

    const tagsArray = projectForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const projectPayload: any = {
      projectId: id,
      userId: user.uid,
      title: projectForm.title,
      description: projectForm.description,
      imageUrl: projectForm.imageUrl,
      category: projectForm.category,
      tags: tagsArray,
      demoUrl: projectForm.demoUrl,
      githubUrl: projectForm.githubUrl,
      order: Number(projectForm.order),
      updatedAt: serverTimestamp(),
    };

    if (isNew) {
      projectPayload.createdAt = serverTimestamp();
    } else {
      projectPayload.createdAt = editingProject!.createdAt;
    }

    try {
      await setDoc(doc(db, 'portfolios', user.uid, 'projects', id), projectPayload);
      
      // Update local state instantly
      const updatedProject: Project = {
        ...projectPayload,
        createdAt: isNew ? new Date() : editingProject!.createdAt,
        updatedAt: new Date(),
      };

      if (isNew) {
        setProjects([...projects, updatedProject].sort((a, b) => a.order - b.order));
      } else {
        setProjects(projects.map(p => p.projectId === id ? updatedProject : p).sort((a, b) => a.order - b.order));
      }

      setIsProjectModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setError('Failed to save project: ' + e);
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setSaving(true);
    setError(null);
    const path = `portfolios/${user.uid}/projects/${id}`;

    try {
      await deleteDoc(doc(db, 'portfolios', user.uid, 'projects', id));
      setProjects(projects.filter(p => p.projectId !== id));
    } catch (e) {
      setError('Failed to delete project: ' + e);
      handleFirestoreError(e, OperationType.DELETE, path);
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Helper for Profile Photo
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      // Compress file using client-side canvas compressor
      const compressedBase64 = await compressImage(file, 400, 400, 0.7);
      await handleSavePortfolio({ profilePhoto: compressedBase64 });
    } catch (err) {
      console.error(err);
      setError('Failed to process image file. Ensure it is a valid format.');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Helper for Project Screenshot
  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      const compressedBase64 = await compressImage(file, 500, 350, 0.7);
      setProjectForm(prev => ({ ...prev, imageUrl: compressedBase64 }));
    } catch (err) {
      console.error(err);
      setError('Failed to compress project image.');
    } finally {
      setSaving(false);
    }
  };

  // Copy share link helper
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?p=${user.uid}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Public Portfolio link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center text-slate-500 font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-800">Initializing Studio Database...</p>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?p=${user.uid}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800">
      
      {/* Dynamic Top Bar */}
      <header className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm mx-6 mt-6 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-100">
            <FolderDot size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight">Studio Builder</h1>
            <p className="text-[10px] text-slate-400 font-mono">ACTIVE_ID: {user.uid.substring(0, 10)}...</p>
          </div>
        </div>

        {/* Sync / Success Flags */}
        <div className="flex items-center gap-3 flex-wrap">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-semibold shadow-xs">
              <Check size={14} /> Synchronized with cloud
            </span>
          )}
          {saving && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-xs">
              <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> Saving changes...
            </span>
          )}

          {/* Published switch directly */}
          {portfolio && (
            <button
              onClick={() => handleSavePortfolio({ isPublished: !portfolio.isPublished })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                portfolio.isPublished
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {portfolio.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{portfolio.isPublished ? 'Published Live' : 'Draft Mode'}</span>
            </button>
          )}

          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-100/50 cursor-pointer transition-all"
          >
            <Share2 size={14} />
            <span>Copy Live URL</span>
          </button>

          <button
            onClick={onSignOut}
            className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 border border-slate-200 rounded-xl cursor-pointer transition-all"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Split Interface */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
        
        {/* SIDEBAR: Configuration Controls */}
        <div className="w-full lg:w-[460px] bg-white border border-slate-200 rounded-[2rem] flex flex-col shrink-0 overflow-hidden shadow-sm">
          
          {/* Quick Submenu Selection */}
          <nav className="flex overflow-x-auto border-b border-slate-100 p-3 scrollbar-none gap-1 shrink-0 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'profile' ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User size={14} /> Profile
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'sections' ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders size={14} /> Layout
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'skills' ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={14} /> Skills
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'projects' ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase size={14} /> Projects
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'design' ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings size={14} /> Themes
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'seo' ? 'bg-white text-indigo-600 border border-slate-200 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe size={14} /> SEO
            </button>
          </nav>

          {/* Interactive forms based on tab */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-none bg-white text-slate-800">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* TAB 1: Profile and contact */}
            {activeTab === 'profile' && portfolio && (
              <div className="space-y-5">
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <User size={18} className="text-indigo-600" />
                  Personal Profile
                </h3>
                
                {/* Profile photo uploader */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avatar Photo</label>
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0 shadow-inner flex items-center justify-center">
                      {portfolio.profilePhoto ? (
                        <img src={portfolio.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-medium">No image</div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                        <Upload size={14} className="text-indigo-600" />
                        <span>Upload photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 font-light">Max size 120KB. Auto-compressed for Firestore.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={portfolio.name}
                    onChange={(e) => handleSavePortfolio({ name: e.target.value })}
                    maxLength={100}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Professional Bio</label>
                  <textarea
                    rows={4}
                    value={portfolio.bio}
                    onChange={(e) => handleSavePortfolio({ bio: e.target.value })}
                    maxLength={1000}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed font-normal"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-mono font-medium">{portfolio.bio.length}/1000 chars</div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide font-mono flex items-center gap-1.5">Contact Coordinates</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                    <input
                      type="email"
                      value={portfolio.email}
                      onChange={(e) => handleSavePortfolio({ email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Line</label>
                    <input
                      type="text"
                      value={portfolio.phone || ''}
                      onChange={(e) => handleSavePortfolio({ phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location</label>
                    <input
                      type="text"
                      value={portfolio.location || ''}
                      onChange={(e) => handleSavePortfolio({ location: e.target.value })}
                      placeholder="e.g. Austin, TX"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wide font-mono">Social Anchors</h4>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GitHub Profile</label>
                    <input
                      type="text"
                      value={portfolio.socialGithub || ''}
                      onChange={(e) => handleSavePortfolio({ socialGithub: e.target.value })}
                      placeholder="username or full URL"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LinkedIn URL</label>
                    <input
                      type="text"
                      value={portfolio.socialLinkedin || ''}
                      onChange={(e) => handleSavePortfolio({ socialLinkedin: e.target.value })}
                      placeholder="e.g. in/username"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Twitter/X URL</label>
                    <input
                      type="text"
                      value={portfolio.socialTwitter || ''}
                      onChange={(e) => handleSavePortfolio({ socialTwitter: e.target.value })}
                      placeholder="e.g. handle or link"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Arrange sections */}
            {activeTab === 'sections' && portfolio && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Sliders size={18} className="text-indigo-600" />
                    Organize Sections
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    Instantly arrange section layout ordering and toggle whether they are enabled on your site.
                  </p>
                </div>

                <div className="space-y-3">
                  {['hero', 'about', 'skills', 'projects', 'contact'].map((sect, idx) => {
                    const isVisible = portfolio.sectionsOrder.includes(sect);
                    const orderIndex = portfolio.sectionsOrder.indexOf(sect);

                    return (
                      <div
                        key={sect}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          isVisible 
                            ? 'border-slate-200 bg-slate-50 text-slate-800 shadow-2xs' 
                            : 'border-slate-100 bg-slate-50/30 opacity-40 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSectionVisibility(sect)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {isVisible ? <Eye size={16} className="text-indigo-600" /> : <EyeOff size={16} />}
                          </button>
                          <div>
                            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-700">{sect}</span>
                            <p className="text-[10px] text-slate-400 font-mono font-medium">
                              {isVisible ? `Render position: #${orderIndex + 1}` : 'Disabled'}
                            </p>
                          </div>
                        </div>

                        {isVisible && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => moveSection('up', orderIndex)}
                              disabled={orderIndex === 0}
                              className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-xl cursor-pointer transition-all shadow-xs"
                              title="Move Up"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => moveSection('down', orderIndex)}
                              disabled={orderIndex === portfolio.sectionsOrder.length - 1}
                              className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-xl cursor-pointer transition-all shadow-xs"
                              title="Move Down"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Skills list */}
            {activeTab === 'skills' && portfolio && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Award size={18} className="text-indigo-600" />
                    Skills Competency
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    Construct skill categorizations representing technical experience.
                  </p>
                </div>

                {/* Add new skill form */}
                <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Add Experience Pill</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Skill Name</label>
                    <input
                      type="text"
                      placeholder="e.g. React"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Category Tag</label>
                    <select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    >
                      <option value="Frontend">Frontend Dev</option>
                      <option value="Backend">Backend / API</option>
                      <option value="Database">Database / Storage</option>
                      <option value="Design">UI/UX Crafting</option>
                      <option value="General">Other / General</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                      <span>Proficiency</span>
                      <span className="text-indigo-600 font-mono font-bold">{newSkill.level}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={newSkill.level}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, level: Number(e.target.value) }))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <button
                    onClick={handleAddSkill}
                    disabled={!newSkill.name.trim() || portfolio.skills.length >= 20}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer disabled:opacity-45 shadow-sm shadow-indigo-100"
                  >
                    Add Skill Pill
                  </button>
                </div>

                {/* Listing of added skills */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-none">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Skills ({portfolio.skills.length}/20)</h4>
                  {portfolio.skills.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No skills listed yet.</p>
                  ) : (
                    portfolio.skills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs shadow-2xs">
                        <div>
                          <span className="font-bold text-slate-800">{skill.name}</span>
                          <span className="ml-2 px-2 py-0.5 bg-white border border-slate-200 text-[9px] font-bold text-indigo-600 rounded-lg shadow-2xs">{skill.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500 font-mono font-medium">{skill.level}%</span>
                          <button
                            onClick={() => handleRemoveSkill(index)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: Projects Center */}
            {activeTab === 'projects' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <Briefcase size={18} className="text-indigo-600" />
                      Project Center
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-light">
                      Represent featured works and build records.
                    </p>
                  </div>
                  <button
                    onClick={openNewProjectModal}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer"
                    title="Add project"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-250 rounded-2xl bg-slate-50/50">
                      <p className="text-xs text-slate-400 italic">No projects found. Create your very first portfolio project!</p>
                    </div>
                  ) : (
                    projects.map((proj) => (
                      <div key={proj.projectId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 items-center shadow-2xs">
                        {proj.imageUrl && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                            <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{proj.title}</h4>
                          <span className="text-[9px] text-indigo-600 font-extrabold uppercase bg-white border border-slate-200 px-2 py-0.5 rounded-lg inline-block mt-1 shadow-2xs">
                            {proj.category}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditProjectModal(proj)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-xl text-xs cursor-pointer transition-all shadow-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.projectId)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-red-500 rounded-xl text-xs cursor-pointer transition-all shadow-xs"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Themes */}
            {activeTab === 'design' && portfolio && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Settings size={18} className="text-indigo-600" />
                    Studio Design Theme
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    Instantly swap prebuilt design presets to fit professional styles.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'modern', name: 'Modern Minimalist', desc: 'Sleek, light layout with high negative space and elegant charcoal typography.', badge: 'LIGHT' },
                    { id: 'creative', name: 'Creative Dark Tech', desc: 'Terminal dark vibe with neon highlights, custom monospace details, and high-tech accents.', badge: 'DARK' },
                    { id: 'professional', name: 'Professional Corporate', desc: 'Trustworthy slate and royal blue accents, clean structure grid aligning components seamlessly.', badge: 'BRANDED' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleSavePortfolio({ templateId: tpl.id as TemplateId })}
                      className={`w-full text-left p-5 rounded-2xl border transition-all flex flex-col gap-2 cursor-pointer ${
                        portfolio.templateId === tpl.id
                          ? 'border-indigo-500 bg-indigo-50/10 shadow-md shadow-indigo-100/20'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-350 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-xs font-bold uppercase tracking-wide ${portfolio.templateId === tpl.id ? 'text-indigo-900' : 'text-slate-800'}`}>{tpl.name}</span>
                        <span className={`px-2 py-0.5 text-[9px] rounded font-semibold ${portfolio.templateId === tpl.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{tpl.badge}</span>
                      </div>
                      <p className={`text-xs font-light leading-relaxed ${portfolio.templateId === tpl.id ? 'text-indigo-950/80' : 'text-slate-500'}`}>{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: SEO */}
            {activeTab === 'seo' && portfolio && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <Globe size={18} className="text-indigo-600" />
                    SEO Settings
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    Assign custom SEO metadata titles and descriptive elements to support social embeds.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SEO Meta Title</label>
                  <input
                    type="text"
                    value={portfolio.seoTitle || ''}
                    onChange={(e) => handleSavePortfolio({ seoTitle: e.target.value })}
                    maxLength={100}
                    placeholder="My Portfolio - Designer & Engineer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-mono font-medium">{portfolio.seoTitle?.length || 0}/100 chars</div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SEO Meta Description</label>
                  <textarea
                    rows={4}
                    value={portfolio.seoDescription || ''}
                    onChange={(e) => handleSavePortfolio({ seoDescription: e.target.value })}
                    maxLength={250}
                    placeholder="Describe your profile, skills, and projects for search engines..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed font-normal"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-mono font-medium">{portfolio.seoDescription?.length || 0}/250 chars</div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Share2 size={14} className="text-indigo-600" />
                    <span>Social Media Preview Embed</span>
                  </h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-light space-y-1 shadow-2xs">
                    <p className="font-bold text-slate-900 truncate">{portfolio.seoTitle || `${portfolio.name} Portfolio`}</p>
                    <p className="text-[10px] font-bold text-indigo-600 truncate">{shareUrl}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 font-light">{portfolio.seoDescription || 'Discover beautiful portfolio project listings.'}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT PREVIEW SCREEN */}
        <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden shadow-sm">
          
          {/* Preview Header Frame */}
          <div className="bg-slate-50/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-bold tracking-tight text-slate-700">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>STUDIO LIVE PREVIEW: {portfolio?.templateId.toUpperCase()} STYLE</span>
            </div>
            
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 font-bold transition-colors"
            >
              Open Live Page <ExternalLink size={12} />
            </a>
          </div>

          {/* Interactive Frame Body */}
          <div className="flex-1 overflow-y-auto">
            {portfolio ? (
              <TemplateRenderer portfolio={portfolio} projects={projects} isPreview={true} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic font-light">
                Preview frame initializing...
              </div>
            )}
          </div>

        </div>

      </main>

      {/* MODAL FOR PROJECTS (CREATE / EDIT) */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-800">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                {editingProject ? 'Modify Project Object' : 'Create Project Object'}
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Project Title</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={projectForm.title}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category / Type</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={projectForm.category}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g. Web Apps, Design"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Order Priority</label>
                  <input
                    type="number"
                    value={projectForm.order}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Project Description</label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none leading-relaxed font-normal"
                />
              </div>

              {/* Screenshot Uploader */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Project Screenshot</label>
                <div className="flex items-center gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="w-16 h-12 rounded bg-white border border-slate-200 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                    {projectForm.imageUrl ? (
                      <img src={projectForm.imageUrl} alt="Project thumb" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[8px] text-slate-400 uppercase font-bold">Empty</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs">
                      <Upload size={12} className="text-indigo-600" />
                      <span>Upload screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProjectImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[9px] text-slate-400 font-light">Max size 120KB. JPEG auto-compression is active.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Technology Tags</label>
                <input
                  type="text"
                  value={projectForm.tags}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="React, Firebase, Tailwind (comma separated)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Live Demo Link</label>
                  <input
                    type="url"
                    value={projectForm.demoUrl}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, demoUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">GitHub Codebase Link</label>
                  <input
                    type="url"
                    value={projectForm.githubUrl}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                    placeholder="https://github.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-pointer font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer font-bold transition-all shadow-md shadow-indigo-100"
                >
                  {saving ? 'Syncing...' : 'Save Project'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
