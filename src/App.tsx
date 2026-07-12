/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { seedInitialData } from './lib/seeder';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Home as HomeScreen } from './components/Home';
import { Discover } from './components/Discover';
import { NetworkHub } from './components/NetworkHub';
import { Sprout } from 'lucide-react';
import { motion } from 'motion/react';

// Lazy loaded heavy components
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const Profile = lazy(() => import('./components/Profile'));
const Opportunities = lazy(() => import('./components/Opportunities'));

const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center p-12 w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-krishx-green-600"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isInitialLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);

  // Seed default data in Firestore if empty
  useEffect(() => {
    if (user) {
      seedInitialData();
    }
  }, [user]);

  // Loading Screen
  if (isInitialLoading) {
    return (
      <div className="relative min-h-screen bg-premium-gradient flex flex-col items-center justify-center">
        {/* Visual Depth Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Abstract organic pattern (2-4% opacity) */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2315803D' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
          
          {/* Blurred radial light spots */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-krishx-green-200/30 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-krishx-earth-200/50 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-krishx-green-100/40 rounded-full blur-[100px]" />

          {/* Floating organic blobs */}
          <div className="absolute top-1/4 right-1/3 w-[30rem] h-[30rem] bg-krishx-green-300/10 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
          <div className="absolute top-1/3 left-1/4 w-[25rem] h-[25rem] bg-amber-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-[35rem] h-[35rem] bg-krishx-green-200/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
        </div>
        
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative z-10 p-5 bg-white rounded-3xl text-krishx-green-600 shadow-premium-soft"
        >
          <Sprout className="w-10 h-10" strokeWidth={1.5} />
        </motion.div>
        <p className="relative z-10 text-sm font-display font-bold text-krishx-dark-900 mt-6 tracking-wide">
          Krish<span className="text-krishx-green-600">X</span>
        </p>
        <p className="relative z-10 text-xs text-krishx-dark-700/60 font-medium mt-1.5">
          Professional Agriculture Network
        </p>
      </div>
    );
  }

  // Logged in -> Show Layout + Active screen
  const handleSetActiveTab = (tab: string) => {
    if (tab === 'profile') {
      setViewedProfileId(null);
    }
    setActiveTab(tab);
  };

  const handleViewProfile = (uid: string) => {
    setViewedProfileId(uid);
    setActiveTab('profile');
  };

  if (!user) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={handleSetActiveTab}>
      {activeTab === 'home' && (
        <HomeScreen 
          setActiveTab={handleSetActiveTab} 
          onViewProfile={handleViewProfile} 
        />
      )}
      {activeTab === 'ai' && (
        <Suspense fallback={<LazyLoadingSpinner />}>
          <AIAssistant />
        </Suspense>
      )}
      {activeTab === 'discover' && <Discover />}
      {activeTab === 'network' && (
        <NetworkHub onViewProfile={handleViewProfile} />
      )}
      {activeTab === 'profile' && (
        <Suspense fallback={<LazyLoadingSpinner />}>
          <Profile 
            viewedProfileId={viewedProfileId} 
            setViewedProfileId={setViewedProfileId}
            setActiveTab={handleSetActiveTab}
          />
        </Suspense>
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
