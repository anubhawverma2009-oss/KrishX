/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { Opportunity } from '../types';

enum OperationType {
  LIST = 'list',
  GET = 'get',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  ArrowUpRight, 
  Filter, 
  Compass, 
  Info,
  Award
} from 'lucide-react';

export const Opportunities: React.FC = () => {
  const { userProfile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showAiMatchedOnly, setShowAiMatchedOnly] = useState(false);

  // Load opportunities from Firestore
  useEffect(() => {
    const qOpps = query(collection(db, 'opportunities'));
    const unsubscribe = onSnapshot(qOpps, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Opportunity[];
      setOpportunities(loaded);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'opportunities');
    });

    return unsubscribe;
  }, []);

  const types = ['All', 'Scheme', 'Grant', 'Training', 'Scholarship', 'Startup'];

  // Smart AI-Matching Recommendation Logic (ADD element)
  const isAiRecommended = (opp: Opportunity) => {
    if (!userProfile) return false;
    
    const cropsText = userProfile.crops?.join(' ').toLowerCase() || '';
    const skillsText = userProfile.skills?.join(' ').toLowerCase() || '';
    const locationText = userProfile.location?.toLowerCase() || '';
    const educationText = userProfile.education?.toLowerCase() || '';
    
    const oppText = `${opp.title} ${opp.description} ${opp.eligibility}`.toLowerCase();
    
    // Matched criteria:
    // 1. Schemes for farmers/agriculture in the region
    // 2. Training/Startup for students (based on B.Sc or student profile)
    // 3. Grants for clusters/organic farming if they do organic farming
    if (opp.type === 'Scheme' && (cropsText.includes('wheat') || cropsText.includes('गन्ना') || oppText.includes('किसान'))) {
      return true;
    }
    if (opp.type === 'Training' && (skillsText.includes('ड्रोन') || oppText.includes('ड्रोन') || educationText.includes('student') || educationText.includes('छात्र'))) {
      return true;
    }
    if (opp.type === 'Grant' && (skillsText.includes('प्राकृतिक') || cropsText.includes('जैविक') || oppText.includes('जैविक') || oppText.includes('organic'))) {
      return true;
    }
    if (opp.type === 'Startup' && (educationText.includes('b.sc') || educationText.includes('student') || educationText.includes('छात्र') || oppText.includes('नवाचार'))) {
      return true;
    }
    return false;
  };

  const filteredOpps = opportunities.filter(opp => {
    const matchesType = selectedType === 'All' || opp.type === selectedType;
    const matchesAi = !showAiMatchedOnly || isAiRecommended(opp);
    return matchesType && matchesAi;
  });

  return (
    <div className="space-y-6">
      
      {/* Smart Personalized Feed / AI Opportunities Banner (ADD element) */}
      {userProfile && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-krishx-earth-50/50 border border-krishx-earth-200/50 rounded-[1.25rem] p-5 shadow-sm flex items-start gap-4"
        >
          <div className="p-3 bg-white text-krishx-green-600 rounded-xl border border-krishx-earth-200/50 shadow-sm shrink-0">
            <Sparkles className="w-5 h-5 fill-krishx-green-600/20" strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-[12px] font-bold text-krishx-dark-900 uppercase tracking-[0.1em]">
              स्मार्ट एआई अवसर मैचिंग (AI Opportunity Engine)
            </h3>
            <p className="text-[13px] text-krishx-dark-700/80 leading-relaxed font-medium">
              नमस्ते {userProfile.name}, हमने आपके प्रोफाइल (फसलें: {userProfile.crops?.join(', ')}, स्थान: {userProfile.location}) के अनुसार 2 विशेष सरकारी सहायता योजनाओं और कौशल विकास प्रशिक्षण अवसरों की पहचान की है।
            </p>
          </div>
        </motion.div>
      )}

      {/* Control Filters Bar */}
      <div className="premium-card p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Type pills */}
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`text-[10px] font-bold px-4 py-2 rounded-xl transition-all uppercase tracking-[0.1em] ${
                selectedType === t
                  ? 'bg-krishx-dark-900 text-white shadow-sm shadow-krishx-dark-900/10'
                  : 'bg-krishx-earth-50 text-krishx-dark-700 hover:bg-krishx-earth-100 hover:text-krishx-dark-900'
              }`}
            >
              {t === 'All' && 'सभी अवसर'}
              {t === 'Scheme' && 'सरकारी योजनाएं'}
              {t === 'Grant' && 'कृषि अनुदान (Grants)'}
              {t === 'Training' && 'ट्रेनिंग प्रोग्राम'}
              {t === 'Scholarship' && 'छात्रवृत्ति'}
              {t === 'Startup' && 'स्टार्टअप सपोर्ट'}
            </button>
          ))}
        </div>

        {/* AI Toggle Match Switch */}
        {userProfile && (
          <button
            onClick={() => setShowAiMatchedOnly(!showAiMatchedOnly)}
            className={`text-[10px] font-bold px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-[0.1em] ${
              showAiMatchedOnly
                ? 'bg-krishx-green-50 text-krishx-green-700 border-krishx-green-200 shadow-sm'
                : 'bg-white text-krishx-dark-700 border-krishx-earth-200 hover:border-krishx-earth-300'
            }`}
          >
            <Compass className={`w-4 h-4 ${showAiMatchedOnly ? 'text-krishx-green-600 animate-spin-slow' : 'text-krishx-dark-700/60'}`} strokeWidth={1.5} />
            <span>केवल मेरे लिए अनुशंसित (AI Matched)</span>
          </button>
        )}
      </div>

      {/* Opportunities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredOpps.map((opp) => {
            const recommended = isAiRecommended(opp);
            return (
              <motion.div
                key={opp.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`premium-card p-6 flex flex-col justify-between hover:shadow-lg transition-all relative overflow-hidden ${
                  recommended ? 'ring-1 ring-krishx-green-400/50 shadow-krishx-green-900/5' : ''
                }`}
              >
                {/* Visual indicator corner badge for AI Recommended opportunity */}
                {recommended && (
                  <div className="absolute top-0 right-0 bg-krishx-dark-900 text-white text-[9px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase rounded-bl-xl border-l border-b border-krishx-dark-800 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 fill-white/20" strokeWidth={1.5} /> AI Matched
                  </div>
                )}

                <div className="space-y-3">
                  {/* Category Pill */}
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider inline-block ${
                    opp.type === 'Scheme' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    opp.type === 'Grant' ? 'bg-krishx-earth-50 text-krishx-green-700 border-krishx-earth-300' :
                    opp.type === 'Training' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                    opp.type === 'Scholarship' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {opp.type === 'Scheme' && 'सरकारी योजना'}
                    {opp.type === 'Grant' && 'कृषि अनुदान'}
                    {opp.type === 'Training' && 'प्रशिक्षण सत्र'}
                    {opp.type === 'Scholarship' && 'छात्रवृत्ति'}
                    {opp.type === 'Startup' && 'स्टार्टअप सहायता'}
                  </span>

                  <div>
                    <h4 className="text-[14px] font-bold text-krishx-dark-900 pr-12 leading-tight">
                      {opp.title}
                    </h4>
                    <p className="text-[10px] font-semibold text-krishx-dark-700/60 mt-1 uppercase tracking-[0.1em]">
                      {opp.organization}
                    </p>
                  </div>

                  <p className="text-[13px] text-krishx-dark-700/80 leading-relaxed font-medium">
                    {opp.description}
                  </p>

                  {/* Eligibility and benefits details inside visual drawer */}
                  <div className="bg-krishx-earth-50/50 p-3.5 rounded-[1rem] border border-krishx-earth-200/50 space-y-2 text-[12px]">
                    <div className="flex gap-2 items-start">
                      <CheckCircle className="w-4 h-4 text-krishx-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-krishx-dark-900 font-medium"><span className="font-bold text-krishx-dark-700">पात्रता:</span> {opp.eligibility}</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Award className="w-4 h-4 text-krishx-green-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <p className="text-krishx-dark-900 font-medium"><span className="font-bold text-krishx-dark-700">लाभ:</span> {opp.benefits}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-krishx-earth-200/50 flex items-center justify-between text-xs font-bold">
                  <span className="text-[10px] text-krishx-dark-700/40 uppercase tracking-[0.1em]">
                    पंजीकरण खुला है
                  </span>
                  
                  <a
                    href={opp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-krishx-dark-900 hover:text-krishx-green-700 cursor-pointer transition-colors"
                  >
                    <span className="uppercase tracking-widest text-[9px] font-bold">आधिकारिक लिंक</span>
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredOpps.length === 0 && (
        <div className="premium-card p-12 text-center space-y-3">
          <span className="text-4xl opacity-50 block">🔍</span>
          <h4 className="text-[14px] font-bold text-krishx-dark-900">कोई अवसर नहीं मिला</h4>
          <p className="text-[13px] text-krishx-dark-700/60 max-w-sm mx-auto font-medium leading-relaxed">
            इस श्रेणी के अंतर्गत वर्तमान में कोई अवसर उपलब्ध नहीं है। कृपया कोई अन्य फ़िल्टर चुनें।
          </p>
        </div>
      )}
    </div>
  );
};
export default Opportunities;
