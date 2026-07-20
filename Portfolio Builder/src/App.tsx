/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, testConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AuthScreen from './components/AuthScreen';
import PortfolioEditor from './components/PortfolioEditor';
import PublicPortfolio from './components/PublicPortfolio';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publicUserId, setPublicUserId] = useState<string | null>(null);

  // Parse routing parameters on mount and test Firebase connectivity
  useEffect(() => {
    // Run connectivity verification as mandated by security and integration guidelines
    testConnection();

    const params = new URLSearchParams(window.location.search);
    const pParam = params.get('p');
    if (pParam) {
      setPublicUserId(pParam);
    }
  }, []);

  // Monitor firebase authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Render Public portfolio (Read-Only) if param is provided
  if (publicUserId) {
    return <PublicPortfolio userId={publicUserId} />;
  }

  // Render Loader if auth is state syncing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex justify-center items-center text-slate-500 font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-800">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Switch between editor workspace and authentication screen
  if (!user) {
    return <AuthScreen onSuccess={(u) => setUser(u)} />;
  }

  return (
    <PortfolioEditor
      user={user}
      onSignOut={async () => {
        await auth.signOut();
        setUser(null);
      }}
    />
  );
}
