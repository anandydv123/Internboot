import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Portfolio, Project } from '../types';
import TemplateRenderer from './TemplateRenderer';
import { HelpCircle, LayoutGrid } from 'lucide-react';

interface PublicPortfolioProps {
  userId: string;
}

export default function PublicPortfolio({ userId }: PublicPortfolioProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicData() {
      setLoading(true);
      setError(null);
      
      const portfolioPath = `portfolios/${userId}`;
      const projectsPath = `portfolios/${userId}/projects`;

      try {
        // Fetch Portfolio Document
        const portRef = doc(db, 'portfolios', userId);
        const portSnap = await getDoc(portRef);
        
        if (!portSnap.exists()) {
          setError('The requested portfolio does not exist or has been removed.');
          setLoading(false);
          return;
        }

        const portData = portSnap.data() as Portfolio;
        
        // If portfolio is not published, prevent access
        if (!portData.isPublished) {
          setError('This portfolio is currently in draft mode and is not published.');
          setLoading(false);
          return;
        }

        setPortfolio(portData);

        // Fetch Projects subcollection
        try {
          const projectsRef = collection(db, 'portfolios', userId, 'projects');
          const q = query(projectsRef, orderBy('order', 'asc'));
          const projectsSnap = await getDocs(q);
          const projectsList = projectsSnap.docs.map(doc => ({
            projectId: doc.id,
            ...doc.data()
          } as Project));
          setProjects(projectsList);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, projectsPath);
        }

        // DYNAMIC SEO METADATA INJECTION FOR SOCIAL PREVIEWS
        if (portData.seoTitle) {
          document.title = portData.seoTitle;
        } else {
          document.title = `${portData.name} - Portfolio`;
        }

        // Dynamically update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        const descContent = portData.seoDescription || portData.bio || 'Personal professional portfolio website.';
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.setAttribute('name', 'description');
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', descContent);

      } catch (err: any) {
        console.error(err);
        setError('Unable to load portfolio details. Access denied or offline.');
      } finally {
        setLoading(false);
      }
    }

    loadPublicData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center text-slate-500 font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-800">Loading portfolio site...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-6 text-slate-800 font-sans">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2rem] p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <LayoutGrid size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Access Restricted</h2>
            <p className="text-sm text-slate-500 leading-relaxed font-light">
              {error}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">CODE: ACCESS_DENIED</p>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  return <TemplateRenderer portfolio={portfolio} projects={projects} isPreview={false} />;
}
