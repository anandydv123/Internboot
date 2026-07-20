import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Task, Priority } from '../types';
import { LogOut, Plus, CheckCircle2, Circle, Trash2, Edit2, Filter, AlertCircle, Calendar, Tag, PieChart as PieChartIcon, Search, Sun, Moon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('mediume');
  const [deadline, setDeadline] = useState('');

  // Categories list derived from tasks (or static, let's allow dynamic via an input)
  const allCategories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tasksData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
        } as Task);
      });
      // Order locally since composite indexes might require setup in Firestore
      tasksData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description || '');
      setCategory(task.category || '');
      setPriority(task.priority);
      setDeadline(task.deadline || '');
    } else {
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('mediume');
      setDeadline('');
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    const taskData = {
      userId: user.uid,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      priority,
      deadline,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingTask) {
        await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...taskData,
          completed: false,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error toggling task status:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-800',
    small: 'bg-emerald-100 text-emerald-800',
    medium: 'bg-amber-100 text-amber-800',
    mediume: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
    large: 'bg-red-100 text-red-800',
  };

  const filteredTasks = tasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterStatus === 'active' && t.completed) return false;
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* Sidebar Filters */}
      <aside className="w-[260px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col hidden lg:flex shrink-0 overflow-y-auto">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg mr-3"></div>
          <span className="font-extrabold text-xl tracking-tight">TaskFlow</span>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 mb-8"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>

        <div className="space-y-6">
          <h2 className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold ml-1">
            Filters
          </h2>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block ml-1">STATUS</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block ml-1">PRIORITY</label>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="large">Large</option>
              <option value="mediume">Mediume</option>
              <option value="small">Small</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block ml-1">CATEGORY</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none"
            >
              <option value="all">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-[72px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 lg:hidden">TaskFlow</h1>
            <div className="flex flex-1 items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 w-full max-w-md focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 focus-within:border-blue-500 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search tasks, projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200 w-full placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden md:inline-block">Welcome, {user?.displayName || user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 ml-2"></div>
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Task List */}
        <section className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Today's Focus</h2>
          </div>

          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center">
              <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                Task Status Summary
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: tasks.filter(t => t.completed).length },
                        { name: 'Pending', value: tasks.filter(t => !t.completed).length }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="text-3xl font-extrabold text-blue-600 mb-1">{tasks.length}</div>
                  <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tasks</div>
               </div>
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="text-3xl font-extrabold text-emerald-500 mb-1">{tasks.filter(t => t.completed).length}</div>
                  <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</div>
               </div>
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="text-3xl font-extrabold text-amber-500 mb-1">{tasks.filter(t => !t.completed).length}</div>
                  <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</div>
               </div>
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
                  <div className="text-3xl font-extrabold text-red-500 mb-1">{tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length}</div>
                  <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue</div>
               </div>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
              <p className="mb-2">No tasks found matching your criteria.</p>
              <button onClick={() => handleOpenModal()} className="text-blue-600 hover:underline font-medium">
                Create a new task
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-5xl">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={twMerge(
                    "bg-white dark:bg-slate-800 border rounded-[10px] p-4 flex items-center gap-4 shadow-sm transition-all hover:shadow",
                    task.completed ? "opacity-60 bg-slate-50 dark:bg-slate-900/50" : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className={twMerge(
                      "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                      task.completed ? "bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-700" : "border-slate-300 dark:border-slate-600 hover:border-blue-600 dark:hover:border-blue-500"
                    )}
                  >
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={twMerge(
                          "font-semibold text-slate-800 dark:text-slate-200 text-[15px] mb-0.5",
                          task.completed && "line-through text-slate-500 dark:text-slate-500"
                        )}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      {task.category && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                          {task.category}
                        </span>
                      )}
                      <span className={clsx("text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase", priorityColors[task.priority])}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="text-right min-w-[80px] hidden sm:block">
                      {task.deadline ? (
                        <>
                          <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">Deadline</div>
                        </>
                      ) : (
                        <div className="text-[13px] font-medium text-slate-400 dark:text-slate-500">-</div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                      <button onClick={() => handleOpenModal(task)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-[12px] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add some details..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Work, Personal"
                    list="categories"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                  />
                  <datalist id="categories">
                    {allCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                  >
                    <option value="small">Small</option>
                    <option value="mediume">Mediume</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 text-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
