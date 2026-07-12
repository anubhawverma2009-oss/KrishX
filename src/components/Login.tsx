/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Sprout, LogIn, Award, Users, ShieldAlert, Sparkles, UserCheck, Landmark, Leaf, TrendingUp, CloudSun, Coins } from 'lucide-react';

const NODES_DATA = [
  {
    id: 'ai',
    nameEn: 'AI Advisor',
    nameHi: 'AI सलाहकार',
    subEn: 'Smart Farming, Better Decisions',
    subHi: 'स्मार्ट खेती, बेहतर निर्णय',
    x: '50%',
    y: '10%',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    color: 'emerald'
  },
  {
    id: 'community',
    nameEn: 'Farmer Community',
    nameHi: 'किसान समुदाय',
    subEn: 'Connect, Learn & Grow Together',
    subHi: 'जुड़ें, सीखें, बढ़ें साथ मिलकर',
    x: '78%',
    y: '22%',
    icon: <Users className="w-5 h-5 text-amber-400" />,
    color: 'amber'
  },
  {
    id: 'experts',
    nameEn: 'Agri Experts',
    nameHi: 'कृषि विशेषज्ञ',
    subEn: 'Direct Advice from Experts',
    subHi: 'विशेषज्ञों से सीधी सलाह',
    x: '86%',
    y: '48%',
    icon: <UserCheck className="w-5 h-5 text-blue-400" />,
    color: 'blue'
  },
  {
    id: 'marketplace',
    nameEn: 'Market Access',
    nameHi: 'बाज़ार से जुड़ाव',
    subEn: 'Better Prices, Bigger Profits',
    subHi: 'बेहतर दाम, बड़ा मुनाफ़ा',
    x: '78%',
    y: '74%',
    icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
    color: 'cyan'
  },
  {
    id: 'finance',
    nameEn: 'Financial Help',
    nameHi: 'वित्तीय सहायता',
    subEn: 'Loans, Insurance & Support',
    subHi: 'लोन, बीमा और मदद',
    x: '50%',
    y: '88%',
    icon: <Coins className="w-5 h-5 text-teal-400" />,
    color: 'teal'
  },
  {
    id: 'schemes',
    nameEn: 'Govt Schemes',
    nameHi: 'सरकारी योजनाएं',
    subEn: 'Complete Scheme Information',
    subHi: 'योजनाओं की पूरी जानकारी',
    x: '22%',
    y: '74%',
    icon: <Landmark className="w-5 h-5 text-purple-400" />,
    color: 'purple'
  },
  {
    id: 'health',
    nameEn: 'Crop Health',
    nameHi: 'फसल स्वास्थ्य',
    subEn: 'Disease Detection & Solutions',
    subHi: 'रोग पहचान और समाधान',
    x: '14%',
    y: '48%',
    icon: <Leaf className="w-5 h-5 text-green-400" />,
    color: 'green'
  },
  {
    id: 'weather',
    nameEn: 'Weather Forecast',
    nameHi: 'मौसम जानकारी',
    subEn: 'Accurate Weather Updates',
    subHi: 'सटीक मौसम अपडेट',
    x: '22%',
    y: '22%',
    icon: <CloudSun className="w-5 h-5 text-yellow-400" />,
    color: 'yellow'
  }
];

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: `${10 + Math.random() * 80}%`,
  top: `${10 + Math.random() * 80}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${Math.random() * 6 + 5}s`,
  size: `${Math.random() * 3 + 1.5}px`
}));

const LEAVES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  left: `${15 + Math.random() * 70}%`,
  top: `${15 + Math.random() * 70}%`,
  delay: `${Math.random() * 10}s`,
  duration: `${Math.random() * 8 + 8}s`,
  size: `${Math.random() * 10 + 6}px`
}));

export const Login: React.FC = () => {
  const { loginWithGoogle, loginAsDemoUser, language, switchLanguage } = useAuth();
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEn = language === 'en';

  const handleGoogleLogin = async () => {
    setError(null);
    setLoadingType('google');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("[AuthDebug] handleGoogleLogin caught error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        console.log("Login cancelled by user");
      } else if (err.code === 'auth/popup-blocked') {
        setError(isEn ? "The browser blocked the popup. Please allow popups and try again." : "ब्राउज़र ने पॉपअप ब्लॉक कर दिया है। कृपया पॉपअप की अनुमति दें और पुनः प्रयास करें।");
      } else {
        setError(isEn 
          ? `Google login failed: ${err.message || err.code}. Please ensure Firebase is correctly configured.` 
          : `गूगल लॉगिन विफल: ${err.message || err.code}`);
      }
    } finally {
      setLoadingType(null);
    }
  };

  const handleDemoLogin = async (type: 'farmer' | 'expert' | 'student') => {
    setError(null);
    setLoadingType(type);
    try {
      await loginAsDemoUser(type);
    } catch (err: any) {
      console.error(err);
      setError(isEn ? "Demo login failed. Please try again." : "डेमो लॉगिन विफल रहा। कृपया पुनः प्रयास करें।");
    } finally {
      setLoadingType(null);
    }
  };

  const tWelcomeHeader = isEn ? "Welcome, Agri Partner!" : "नमस्ते कृषक साथी!";
  const tWelcomeSub = isEn 
    ? "Sign in to access your digital professional identity card and connect with agri experts"
    : "अपने डिजिटल पेशेवर पहचान पत्र और कृषि विशेषज्ञों से जुड़ने के लिए प्रवेश करें";
  const tGoogleBtn = isEn ? "Sign in with Google Account" : "Google खाते से प्रवेश करें";
  const tGoogleBtnLoading = isEn ? "Signing in..." : "प्रवेश किया जा रहा है...";
  const tDemoSeparator = isEn ? "OR PROFESSIONAL DEMO ACCESS" : "या प्रोफेशनल डेमो प्रवेश (तत्काल)";
  const tRameshSubtitle = isEn ? "Progressive Organic Farmer (Punjab)" : "प्रगतिशील जैविक किसान (पंजाब)";
  const tAartiSubtitle = isEn ? "Agri Scientist & Expert (Delhi)" : "कृषि वैज्ञानिक एवं विशेषज्ञ (दिल्ली)";
  const tShubhamSubtitle = isEn ? "Agriculture Student (Maharashtra)" : "कृषि छात्र (महाराष्ट्र)";
  const tDemoLoading = isEn ? "Loading..." : "लोडिंग...";
  const tDemoBtn = isEn ? "Enter" : "प्रवेश";

  const tBadge1Title = isEn ? "Professional ID" : "प्रोफेशनल आईडी";
  const tBadge1Sub = isEn ? "Create your agricultural identity" : "अपनी कृषि पहचान बनाएं";
  const tBadge2Title = isEn ? "Agri Community" : "कृषि कम्युनिटी";
  const tBadge2Sub = isEn ? "Share knowledge with fellow farmers" : "साथियों संग ज्ञान साझा करें";
  const tBadge3Title = isEn ? "Smart AI Assistant" : "स्मार्ट AI सहायक";
  const tBadge3Sub = isEn ? "Precise treatment for crop diseases" : "फसल रोगों का सटीक इलाज";

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden selection:bg-krishx-green-200/40 font-sans bg-gradient-to-br from-emerald-950 via-[#032015] to-[#01120c] text-white">
      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes float-gentle-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-1deg); }
        }
        @keyframes pulse-glorious {
          0%, 100% { opacity: 0.45; transform: scale(0.96); }
          50% { opacity: 0.75; transform: scale(1.04); }
        }
        @keyframes pulse-node {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0), 0 0 0 0 rgba(16, 185, 129, 0); }
          50% { transform: scale(1.06); box-shadow: 0 0 20px 6px rgba(52, 211, 153, 0.35), 0 0 40px 12px rgba(16, 185, 129, 0.15); }
        }
        @keyframes ray-shimmer {
          0%, 100% { opacity: 0.15; transform: rotate(0deg); }
          50% { opacity: 0.35; transform: rotate(2deg); }
        }
        @keyframes bird-glide {
          0% { transform: translate(-10%, 0) scale(0.5); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translate(110%, -20%) scale(0.5); opacity: 0; }
        }
        @keyframes float-particle {
          0% { transform: translateY(20px) scale(0.8); opacity: 0; }
          50% { opacity: 0.55; }
          100% { transform: translateY(-140px) scale(1.2); opacity: 0; }
        }
        @keyframes leaf-drift {
          0% { transform: translateY(20px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.35; }
          80% { opacity: 0.35; }
          100% { transform: translateY(-160px) rotate(360deg); opacity: 0; }
        }
        @keyframes line-flow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes flap-left {
          0%, 100% { transform: perspective(100px) rotateY(0deg); }
          50% { transform: perspective(100px) rotateY(70deg); }
        }
        @keyframes flap-right {
          0%, 100% { transform: perspective(100px) rotateY(0deg); }
          50% { transform: perspective(100px) rotateY(-70deg); }
        }
        @keyframes butterfly-path-1 {
          0% {
            left: -5%;
            top: 70%;
            transform: scale(0.6) rotate(45deg);
            opacity: 0;
          }
          10% { opacity: 0.9; }
          35% {
            left: 30%;
            top: 40%;
            transform: scale(0.8) rotate(15deg);
          }
          65% {
            left: 60%;
            top: 25%;
            transform: scale(0.7) rotate(55deg);
          }
          90% {
            left: 85%;
            top: 10%;
            transform: scale(0.85) rotate(25deg);
            opacity: 0.9;
          }
          100% {
            left: 105%;
            top: -5%;
            transform: scale(0.5) rotate(45deg);
            opacity: 0;
          }
        }
        @keyframes butterfly-path-2 {
          0% {
            left: 105%;
            top: 80%;
            transform: scale(0.55) rotate(-135deg);
            opacity: 0;
          }
          10% { opacity: 0.95; }
          35% {
            left: 75%;
            top: 55%;
            transform: scale(0.75) rotate(-110deg);
          }
          65% {
            left: 45%;
            top: 40%;
            transform: scale(0.65) rotate(-150deg);
          }
          90% {
            left: 15%;
            top: 25%;
            transform: scale(0.8) rotate(-115deg);
            opacity: 0.95;
          }
          100% {
            left: -10%;
            top: 10%;
            transform: scale(0.5) rotate(-130deg);
            opacity: 0;
          }
        }
        @keyframes butterfly-path-3 {
          0% {
            left: 20%;
            top: 105%;
            transform: scale(0.5) rotate(-45deg);
            opacity: 0;
          }
          10% { opacity: 0.9; }
          40% {
            left: 45%;
            top: 65%;
            transform: scale(0.7) rotate(-20deg);
          }
          75% {
            left: 70%;
            top: 30%;
            transform: scale(0.65) rotate(-55deg);
          }
          90% { opacity: 0.9; }
          100% {
            left: 95%;
            top: -10%;
            transform: scale(0.4) rotate(-35deg);
            opacity: 0;
          }
        }
        @keyframes butterfly-path-4 {
          0% {
            left: 80%;
            top: 105%;
            transform: scale(0.6) rotate(-75deg);
            opacity: 0;
          }
          10% { opacity: 0.9; }
          35% {
            left: 55%;
            top: 70%;
            transform: scale(0.8) rotate(-45deg);
          }
          70% {
            left: 30%;
            top: 35%;
            transform: scale(0.7) rotate(-85deg);
          }
          90% {
            left: 10%;
            top: 10%;
            transform: scale(0.85) rotate(-55deg);
            opacity: 0.9;
          }
          100% {
            left: -10%;
            top: -10%;
            transform: scale(0.5) rotate(-70deg);
            opacity: 0;
          }
        }
        @keyframes butterfly-path-5 {
          0% {
            left: 95%;
            top: 15%;
            transform: scale(0.5) rotate(-120deg);
            opacity: 0;
          }
          10% { opacity: 0.85; }
          30% {
            left: 70%;
            top: 40%;
            transform: scale(0.7) rotate(-140deg);
          }
          60% {
            left: 40%;
            top: 65%;
            transform: scale(0.6) rotate(-110deg);
          }
          85% {
            left: 15%;
            top: 85%;
            transform: scale(0.75) rotate(-150deg);
            opacity: 0.85;
          }
          100% {
            left: -10%;
            top: 105%;
            transform: scale(0.4) rotate(-130deg);
            opacity: 0;
          }
        }
        .animate-float-gentle { animation: float-gentle 6s ease-in-out infinite; }
        .animate-float-gentle-delayed { animation: float-gentle-delayed 7s ease-in-out infinite; }
        .animate-pulse-glorious { animation: pulse-glorious 4s ease-in-out infinite; }
        .animate-pulse-node { animation: pulse-node 3.2s ease-in-out infinite; }
        .animate-ray-shimmer { animation: ray-shimmer 15s ease-in-out infinite; }
        .animate-bird-glide { animation: bird-glide 22s linear infinite; }
        .animate-line-flow { animation: line-flow 1.5s linear infinite; }
        .wing-left { transform-origin: 20px 20px; animation: flap-left 0.14s linear infinite; }
        .wing-right { transform-origin: 20px 20px; animation: flap-right 0.14s linear infinite; }
        .animate-butterfly-1 { animation: butterfly-path-1 22s ease-in-out infinite; }
        .animate-butterfly-2 { animation: butterfly-path-2 26s ease-in-out infinite; animation-delay: 4.5s; }
        .animate-butterfly-3 { animation: butterfly-path-3 20s ease-in-out infinite; animation-delay: 9s; }
        .animate-butterfly-4 { animation: butterfly-path-4 24s ease-in-out infinite; animation-delay: 13.5s; }
        .animate-butterfly-5 { animation: butterfly-path-5 28s ease-in-out infinite; animation-delay: 2s; }
      `}</style>

      {/* Absolute Full-bleed Background Hero Illustration */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Soft, premium radial glows for depth and SaaS aesthetic */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(52,211,153,0.08),transparent_70%)]" />
        
        {/* Floating Glowing Particles & Gentle Moving Leaves for Living Environment */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="absolute bg-amber-200/40 rounded-full blur-[0.5px]"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animation: `float-particle ${p.duration} linear infinite`,
                animationDelay: p.delay,
              }}
            />
          ))}
          {LEAVES.map((l) => (
            <svg
              key={l.id}
              className="absolute text-emerald-300/10"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{
                left: l.left,
                top: l.top,
                width: l.size,
                height: l.size,
                animation: `leaf-drift ${l.duration} ease-in-out infinite`,
                animationDelay: l.delay,
              }}
            >
              <path d="M17 8C17 11.87 11.5 18 11.5 18S6 11.87 6 8c0-3.31 2.69-6 6-6s6 2.69 6 6z" />
            </svg>
          ))}
        </div>

        {/* Animated Flying Butterflies - UX Expert Touch */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
          
          {/* Butterfly 1 (Emerald/Mint glow) */}
          <div className="absolute w-8 h-8 pointer-events-none select-none animate-butterfly-1">
            <svg viewBox="0 0 40 40" className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(52,211,153,0.7)]">
              <defs>
                <linearGradient id="wing-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <ellipse cx="20" cy="20" rx="1.2" ry="7" fill="#022c22" />
              <path d="M19,14 Q17,9 13,9" stroke="#022c22" strokeWidth="0.8" fill="none" />
              <path d="M21,14 Q23,9 27,9" stroke="#022c22" strokeWidth="0.8" fill="none" />
              <g className="wing-left">
                <path d="M20,20 C13,13 5,10 7,16 C9,22 15,22 20,20 Z" fill="url(#wing-emerald)" />
                <path d="M20,20 C14,21 8,25 9,29 C10,33 16,27 20,20 Z" fill="url(#wing-emerald)" opacity="0.8" />
              </g>
              <g className="wing-right">
                <path d="M20,20 C27,13 35,10 33,16 C31,22 25,22 20,20 Z" fill="url(#wing-emerald)" />
                <path d="M20,20 C26,21 32,25 31,29 C30,33 24,27 20,20 Z" fill="url(#wing-emerald)" opacity="0.8" />
              </g>
            </svg>
          </div>

          {/* Butterfly 2 (Amber/Golden glow) */}
          <div className="absolute w-7 h-7 pointer-events-none select-none animate-butterfly-2">
            <svg viewBox="0 0 40 40" className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(251,191,36,0.7)]">
              <defs>
                <linearGradient id="wing-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <ellipse cx="20" cy="20" rx="1" ry="6" fill="#451a03" />
              <path d="M19,14 Q18,9 15,9" stroke="#451a03" strokeWidth="0.8" fill="none" />
              <path d="M21,14 Q22,9 25,9" stroke="#451a03" strokeWidth="0.8" fill="none" />
              <g className="wing-left">
                <path d="M20,20 C14,14 6,11 8,17 C10,23 16,23 20,20 Z" fill="url(#wing-gold)" />
                <path d="M20,20 C15,21 9,25 10,29 C11,33 17,27 20,20 Z" fill="url(#wing-gold)" opacity="0.8" />
              </g>
              <g className="wing-right">
                <path d="M20,20 C26,14 34,11 32,17 C30,23 24,23 20,20 Z" fill="url(#wing-gold)" />
                <path d="M20,20 C25,21 31,25 30,29 C29,33 23,27 20,20 Z" fill="url(#wing-gold)" opacity="0.8" />
              </g>
            </svg>
          </div>

          {/* Butterfly 3 (Cyan/Teal glow) */}
          <div className="absolute w-7 h-7 pointer-events-none select-none animate-butterfly-3">
            <svg viewBox="0 0 40 40" className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(45,212,191,0.7)]">
              <defs>
                <linearGradient id="wing-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
              </defs>
              <ellipse cx="20" cy="20" rx="1" ry="6" fill="#042f2e" />
              <path d="M19,14 Q18,9 15,9" stroke="#042f2e" strokeWidth="0.8" fill="none" />
              <path d="M21,14 Q22,9 25,9" stroke="#042f2e" strokeWidth="0.8" fill="none" />
              <g className="wing-left">
                <path d="M20,20 C14,14 6,11 8,17 C10,23 16,23 20,20 Z" fill="url(#wing-teal)" />
                <path d="M20,20 C15,21 9,25 10,29 C11,33 17,27 20,20 Z" fill="url(#wing-teal)" opacity="0.8" />
              </g>
              <g className="wing-right">
                <path d="M20,20 C26,14 34,11 32,17 C30,23 24,23 20,20 Z" fill="url(#wing-teal)" />
                <path d="M20,20 C25,21 31,25 30,29 C29,33 23,27 20,20 Z" fill="url(#wing-teal)" opacity="0.8" />
              </g>
            </svg>
          </div>

          {/* Butterfly 4 (Sunset Orange/Pink glow) */}
          <div className="absolute w-8 h-8 pointer-events-none select-none animate-butterfly-4">
            <svg viewBox="0 0 40 40" className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(244,63,94,0.7)]">
              <defs>
                <linearGradient id="wing-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
              <ellipse cx="20" cy="20" rx="1.2" ry="7" fill="#4c0519" />
              <path d="M19,14 Q17,9 13,9" stroke="#4c0519" strokeWidth="0.8" fill="none" />
              <path d="M21,14 Q23,9 27,9" stroke="#4c0519" strokeWidth="0.8" fill="none" />
              <g className="wing-left">
                <path d="M20,20 C13,13 5,10 7,16 C9,22 15,22 20,20 Z" fill="url(#wing-pink)" />
                <path d="M20,20 C14,21 8,25 9,29 C10,33 16,27 20,20 Z" fill="url(#wing-pink)" opacity="0.8" />
              </g>
              <g className="wing-right">
                <path d="M20,20 C27,13 35,10 33,16 C31,22 25,22 20,20 Z" fill="url(#wing-pink)" />
                <path d="M20,20 C26,21 32,25 31,29 C30,33 24,27 20,20 Z" fill="url(#wing-pink)" opacity="0.8" />
              </g>
            </svg>
          </div>

          {/* Butterfly 5 (Mint Green/Lime glow) */}
          <div className="absolute w-7 h-7 pointer-events-none select-none animate-butterfly-5">
            <svg viewBox="0 0 40 40" className="w-full h-full filter drop-shadow-[0_2px_10px_rgba(16,185,129,0.7)]">
              <defs>
                <linearGradient id="wing-mint" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a7f3d0" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <ellipse cx="20" cy="20" rx="1" ry="6" fill="#064e3b" />
              <path d="M19,14 Q18,9 15,9" stroke="#064e3b" strokeWidth="0.8" fill="none" />
              <path d="M21,14 Q22,9 25,9" stroke="#064e3b" strokeWidth="0.8" fill="none" />
              <g className="wing-left">
                <path d="M20,20 C14,14 6,11 8,17 C10,23 16,23 20,20 Z" fill="url(#wing-mint)" />
                <path d="M20,20 C15,21 9,25 10,29 C11,33 17,27 20,20 Z" fill="url(#wing-mint)" opacity="0.8" />
              </g>
              <g className="wing-right">
                <path d="M20,20 C26,14 34,11 32,17 C30,23 24,23 20,20 Z" fill="url(#wing-mint)" />
                <path d="M20,20 C25,21 31,25 30,29 C29,33 23,27 20,20 Z" fill="url(#wing-mint)" opacity="0.8" />
              </g>
            </svg>
          </div>

        </div>

        {/* Sunrise rays */}
        <svg className="absolute left-0 bottom-0 w-[800px] h-[800px] opacity-15 animate-ray-shimmer origin-bottom-left" viewBox="0 0 100 100">
          <path d="M0,100 L15,0 L25,0 Z" fill="url(#sunRay)" />
          <path d="M0,100 L40,0 L50,0 Z" fill="url(#sunRay)" />
          <path d="M0,100 L65,0 L75,0 Z" fill="url(#sunRay)" />
          <path d="M0,100 L90,0 L100,10 Z" fill="url(#sunRay)" />
          <path d="M0,100 L100,30 L100,40 Z" fill="url(#sunRay)" />
          <defs>
            <linearGradient id="sunRay" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Gliding Birds */}
        <div className="absolute top-[10%] left-0 w-full h-24 overflow-hidden">
          <svg className="w-10 h-5 text-emerald-200/15 animate-bird-glide" style={{ animationDelay: '1s' }} viewBox="0 0 24 12">
            <path d="M2,10 Q6,2 12,6 Q18,2 22,10 Q18,6 12,8 Q6,6 2,10 Z" fill="currentColor" />
          </svg>
          <svg className="w-7 h-3.5 text-emerald-200/15 animate-bird-glide" style={{ animationDelay: '7s', animationDuration: '28s' }} viewBox="0 0 24 12">
            <path d="M2,10 Q6,2 12,6 Q18,2 22,10 Q18,6 12,8 Q6,6 2,10 Z" fill="currentColor" />
          </svg>
        </div>

      </div>

      {/* Foreground Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col justify-between z-10 relative flex-1 px-4 md:px-8 py-4 lg:py-6 gap-6">
        
        {/* Top Navbar - Only visible on Mobile/Tablet since Brand Logo is in Left Column on Desktop */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="w-full flex items-center justify-between py-2 z-30 select-none lg:hidden"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              <Sprout className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-white leading-none">
                Krish<span className="text-emerald-400">X</span>
              </h1>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-emerald-100/50 mt-0.5">
                {isEn ? "India's Professional Network for Farmers" : "भारत के किसानों का अपना डिजिटल प्रोफेशनल नेटवर्क"}
              </p>
            </div>
          </div>
        </motion.header>

        {/* Hero Grid layout: 3-Column Composition */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-center flex-1 relative py-4 lg:py-6">
          
          {/* Left Column: Brand Logo & Login Panel */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col justify-center items-center lg:items-start z-20 pointer-events-auto order-2 lg:order-1 gap-6">
            {/* Desktop Brand Logo on Left (hidden on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="hidden lg:flex items-center gap-2.5 select-none pl-1"
            >
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                <Sprout className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold tracking-tight text-white leading-none">
                  Krish<span className="text-emerald-400">X</span>
                </h1>
                <p className="text-[8px] uppercase tracking-wider font-semibold text-emerald-100/50 mt-0.5">
                  {isEn ? "India's Professional Network for Farmers" : "भारत के किसानों का अपना डिजिटल प्रोफेशनल नेटवर्क"}
                </p>
              </div>
            </motion.div>

            {/* Login Panel - Open & Highly Professional Structure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[310px] bg-transparent relative mx-auto lg:mx-0"
            >

              {/* Compact Header: Title & Language Selector */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex flex-col">
                  <h3 className="text-[11px] font-bold text-emerald-400 tracking-tight leading-none uppercase">
                    {tWelcomeHeader}
                  </h3>
                  <p className="text-[8px] text-emerald-200/40 mt-1 leading-none">
                    {isEn ? "Select Access" : "प्रवेश चुनें"}
                  </p>
                </div>

                {/* Language Switch */}
                <div className="flex p-0.5 bg-white/[0.04] rounded-lg border border-white/10 shrink-0 select-none">
                  <button
                    onClick={() => switchLanguage('hi')}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                      language === 'hi'
                        ? 'bg-white text-emerald-950 shadow-sm scale-100'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => switchLanguage('en')}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                      language === 'en'
                        ? 'bg-white text-emerald-950 shadow-sm scale-100'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-3 p-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-100 text-[9px] rounded-lg flex items-start gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Google Login Styled after Modern Google Screen */}
              <button
                onClick={handleGoogleLogin}
                disabled={loadingType !== null}
                className="w-full py-2 px-3.5 bg-white hover:bg-neutral-50 hover:shadow-lg active:scale-[0.985] disabled:opacity-50 text-neutral-800 text-xs font-semibold rounded-xl border border-neutral-200/90 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                {loadingType === 'google' ? (
                  <div className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{loadingType === 'google' ? tGoogleBtnLoading : tGoogleBtn}</span>
              </button>

              {/* Separator */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="flex-grow border-t border-white/[0.06]"></div>
                <span className="flex-shrink mx-2 text-[7px] font-bold tracking-widest text-white/30 uppercase text-center">
                  {isEn ? "Demo Accounts" : "डेमो खाते"}
                </span>
                <div className="flex-grow border-t border-white/[0.06]"></div>
              </div>

              {/* Compact Demo List with Reduced Padding and Compact Borders */}
              <div className="space-y-1.5">
                <button
                  onClick={() => handleDemoLogin('farmer')}
                  disabled={loadingType !== null}
                  className="w-full text-left p-1.5 bg-white/[0.01] border border-white/[0.04] hover:border-emerald-400/35 hover:bg-white/[0.04] rounded-lg flex items-center justify-between transition-all duration-200 group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=80" 
                      alt="Farmer" 
                      className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 shadow-sm" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="leading-none">
                      <p className="text-[10px] font-semibold text-white/95 group-hover:text-white transition-colors">{isEn ? "Ramesh Kumar" : "रमेश कुमार"}</p>
                      <p className="text-[7.5px] font-medium text-emerald-400/50 group-hover:text-emerald-400/70 transition-colors mt-0.5">{isEn ? "Farmer (Punjab)" : "किसान (पंजाब)"}</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-white/60 group-hover:bg-white group-hover:text-emerald-950 transition-all duration-200 shrink-0">
                    {loadingType === 'farmer' ? "..." : tDemoBtn}
                  </span>
                </button>

                <button
                  onClick={() => handleDemoLogin('expert')}
                  disabled={loadingType !== null}
                  className="w-full text-left p-1.5 bg-white/[0.01] border border-white/[0.04] hover:border-emerald-400/35 hover:bg-white/[0.04] rounded-lg flex items-center justify-between transition-all duration-200 group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=80" 
                      alt="Expert" 
                      className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 shadow-sm" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="leading-none">
                      <p className="text-[10px] font-semibold text-white/95 group-hover:text-white transition-colors">{isEn ? "Dr. Aarti Singh" : "डॉ. आरती सिंह"}</p>
                      <p className="text-[7.5px] font-medium text-emerald-400/50 group-hover:text-emerald-400/70 transition-colors mt-0.5">{isEn ? "Agri Scientist" : "कृषि वैज्ञानिक"}</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-white/60 group-hover:bg-white group-hover:text-emerald-950 transition-all duration-200 shrink-0">
                    {loadingType === 'expert' ? "..." : tDemoBtn}
                  </span>
                </button>

                <button
                  onClick={() => handleDemoLogin('student')}
                  disabled={loadingType !== null}
                  className="w-full text-left p-1.5 bg-white/[0.01] border border-white/[0.04] hover:border-emerald-400/35 hover:bg-white/[0.04] rounded-lg flex items-center justify-between transition-all duration-200 group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=80" 
                      alt="Student" 
                      className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 shadow-sm" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="leading-none">
                      <p className="text-[10px] font-semibold text-white/95 group-hover:text-white transition-colors">{isEn ? "Shubham" : "शुभम"}</p>
                      <p className="text-[7.5px] font-medium text-emerald-400/50 group-hover:text-emerald-400/70 transition-colors mt-0.5">{isEn ? "Agri Student" : "कृषि छात्र"}</p>
                    </div>
                  </div>
                  <span className="text-[7.5px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-white/60 group-hover:bg-white group-hover:text-emerald-950 transition-all duration-200 shrink-0">
                    {loadingType === 'student' ? "..." : tDemoBtn}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Center Column: SaaS Headline, Description & Features */}
          <div className="md:col-span-2 lg:col-span-4 flex flex-col justify-center text-left lg:text-center z-20 pointer-events-auto order-1 lg:order-2">
            <div className="max-w-[520px] mx-auto flex flex-col lg:items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-400/20 rounded-full text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-4 w-fit"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{isEn ? "India's Professional Network for Farmers" : "भारत के किसानों का अपना डिजिटल प्रोफेशनल नेटवर्क"}</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-white leading-[1.15]"
              >
                {isEn ? (
                  <>
                    Empowering India's <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 font-extrabold drop-shadow-[0_2px_10px_rgba(52,211,153,0.15)]">Agricultural Community</span>
                  </>
                ) : (
                  <>
                    भारतीय कृषि समुदाय को <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 font-extrabold drop-shadow-[0_2px_10px_rgba(52,211,153,0.15)]">सशक्त बनाना</span>
                  </>
                )}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-5 text-sm sm:text-base text-emerald-100/80 leading-relaxed font-medium"
              >
                {isEn ? (
                  "India's Professional Network for Farmers connecting certified farmers, agricultural experts, students and opportunities."
                ) : (
                  "भारत के किसानों का अपना डिजिटल प्रोफेशनल नेटवर्क जो प्रमाणित किसानों, कृषि विशेषज्ञों, छात्रों और अवसरों को जोड़ता है।"
                )}
              </motion.p>

              {/* High-contrast Visual Badges inside SaaS Copy area with increased spacing */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-col items-center p-5 bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/[0.05] shadow-lg hover:border-emerald-400/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group/card"
                >
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl mb-3 transition-transform group-hover/card:scale-110 group-hover/card:bg-emerald-500/20">
                    <Award className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight group-hover/card:text-emerald-300 transition-colors">{tBadge1Title}</span>
                  <p className="text-[9.5px] font-medium text-emerald-200/40 mt-1.5 leading-normal text-center">{tBadge1Sub}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex flex-col items-center p-5 bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/[0.05] shadow-lg hover:border-emerald-400/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group/card"
                >
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl mb-3 transition-transform group-hover/card:scale-110 group-hover/card:bg-emerald-500/20">
                    <Users className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight group-hover/card:text-emerald-300 transition-colors">{tBadge2Title}</span>
                  <p className="text-[9.5px] font-medium text-emerald-200/40 mt-1.5 leading-normal text-center">{tBadge2Sub}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex flex-col items-center p-5 bg-white/[0.02] backdrop-blur-md rounded-xl border border-white/[0.05] shadow-lg hover:border-emerald-400/30 hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group/card"
                >
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/15 rounded-xl mb-3 transition-transform group-hover/card:scale-110 group-hover/card:bg-emerald-500/20">
                    <Sprout className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-bold text-white leading-tight group-hover/card:text-emerald-300 transition-colors">{tBadge3Title}</span>
                  <p className="text-[9.5px] font-medium text-emerald-200/40 mt-1.5 leading-normal text-center">{tBadge3Sub}</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Network Animation & connected feature nodes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -6, 0]
            }}
            transition={{
              opacity: { duration: 0.8, delay: 1.1, ease: "easeOut" },
              scale: { duration: 0.8, delay: 1.1, ease: "easeOut" },
              y: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="md:col-span-1 lg:col-span-4 relative w-full h-[380px] lg:h-[450px] pointer-events-none z-10 flex items-center justify-center order-3"
          >
            
            {/* Soft glowing ambient orb behind the network */}
            <div className="absolute w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            {/* The SVG connections & nodes */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Lines from Central Hub to Nodes */}
                {NODES_DATA.map((node) => {
                  const targetX = parseFloat(node.x);
                  const targetY = parseFloat(node.y);
                  return (
                    <g key={node.id}>
                      {/* Pulsing base line */}
                      <path
                        d={`M50,48 L${targetX},${targetY}`}
                        fill="none"
                        stroke="rgba(16, 185, 129, 0.12)"
                        strokeWidth="0.4"
                      />
                      {/* Animated flow line */}
                      <path
                        d={`M50,48 L${targetX},${targetY}`}
                        fill="none"
                        stroke="url(#lineGrad)"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                        className="animate-line-flow"
                      />
                      {/* Travelling light packets with glow effect */}
                      <circle r="0.8" fill="#34d399" className="opacity-85">
                        <animateMotion
                          dur={`${2.8 + Math.random() * 1.5}s`}
                          repeatCount="indefinite"
                          path={`M50,48 L${targetX},${targetY}`}
                        />
                      </circle>
                      <circle r="0.45" fill="#ffffff">
                        <animateMotion
                          dur={`${2.8 + Math.random() * 1.5}s`}
                          repeatCount="indefinite"
                          path={`M50,48 L${targetX},${targetY}`}
                        />
                      </circle>
                    </g>
                  );
                })}

                {/* Direct line from Phone (28, 58) to Central Hub (50, 48) */}
                <path
                  d="M28,58 L50,48"
                  fill="none"
                  stroke="url(#phoneGrad)"
                  strokeWidth="0.7"
                  strokeDasharray="3 3"
                  className="animate-line-flow"
                />
                <circle r="1.0" fill="#fbbf24" className="opacity-80">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M28,58 L50,48"
                  />
                </circle>
                <circle r="0.5" fill="#ffffff">
                  <animateMotion
                    dur="2.2s"
                    repeatCount="indefinite"
                    path="M28,58 L50,48"
                  />
                </circle>

                {/* Definitions */}
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="phoneGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Central Sprout logo */}
            <div className="absolute" style={{ left: '50%', top: '48%', transform: 'translate(-50%, -50%)' }}>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/20 animate-ping" style={{ animationDuration: '4s' }} />
                <div className="absolute w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 animate-pulse-glorious" />
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-300/30 z-10">
                  <Sprout className="w-5.5 h-5.5 text-white" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Symmetrically Arranged Nodes */}
            {NODES_DATA.map((node) => (
              <div
                key={node.id}
                className="absolute group select-none pointer-events-auto"
                style={{
                  left: node.x,
                  top: node.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="flex flex-col items-center gap-1 transition-all duration-300 hover:scale-105">
                  {/* Glowing Circle */}
                  <div className="relative w-9 h-9 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg animate-pulse-node group-hover:border-emerald-400/60 transition-colors">
                    <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-white/5 to-white/10" />
                    <div className="relative z-10 flex items-center justify-center scale-90">
                      {node.icon}
                    </div>
                  </div>
                  {/* Label Tag */}
                  <div className="flex flex-col items-center bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/15 shadow-sm max-w-[100px] text-center transition-all duration-300 group-hover:bg-emerald-950/95 group-hover:border-emerald-500/40">
                    <span className="text-[8.5px] font-bold text-white tracking-tight leading-tight whitespace-nowrap">
                      {isEn ? node.nameEn : node.nameHi}
                    </span>
                    <span className="text-[7px] text-emerald-300 font-medium leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px] hidden group-hover:block transition-all duration-300">
                      {isEn ? node.subEn : node.subHi}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          </motion.div>

        </div>

      </div>

      {/* Bottom Features Banner & Copyright */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full bg-black/40 backdrop-blur-xl border-t border-white/[0.06] py-4 px-4 md:px-8 z-20"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10 text-[11px] font-bold text-white">
            <div className="flex items-center gap-2.5 group/bottom cursor-pointer">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/15 group-hover/bottom:bg-emerald-500/20 group-hover/bottom:border-emerald-500/30 group-hover/bottom:scale-105 transition-all duration-300">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="group-hover/bottom:text-emerald-300 transition-colors duration-300">{isEn ? "Secure & Trusted" : "आपका डेटा सुरक्षित और गोपनीय"}</span>
            </div>
            <div className="flex items-center gap-2.5 group/bottom cursor-pointer">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/15 group-hover/bottom:bg-emerald-500/20 group-hover/bottom:border-emerald-500/30 group-hover/bottom:scale-105 transition-all duration-300">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="group-hover/bottom:text-emerald-300 transition-colors duration-300">{isEn ? "Built for Farmers" : "किसानों द्वारा, किसानों के लिए"}</span>
            </div>
            <div className="flex items-center gap-2.5 group/bottom cursor-pointer">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/15 group-hover/bottom:bg-emerald-500/20 group-hover/bottom:border-emerald-500/30 group-hover/bottom:scale-105 transition-all duration-300">
                <Leaf className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="group-hover/bottom:text-emerald-300 transition-colors duration-300">{isEn ? "Grow Together" : "सीखें, जुड़ें और साथ मिलकर बढ़ें"}</span>
            </div>
          </div>
          <div className="text-[10px] font-semibold text-emerald-100/50 text-center md:text-right">
            <span>© 2026 KrishX. All rights reserved. | {isEn ? "For India's Farmers, With India's Farmers" : "भारत के किसानों के लिए, किसानों के साथ ❤️"}</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default Login;
