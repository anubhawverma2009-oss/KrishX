/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatMessage } from '../types';
import { getTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  User as UserIcon, 
  X,
  FileText,
  Search,
  BookOpen,
  Sprout,
  ShieldAlert,
  HeartHandshake,
  Droplet,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Award,
  Loader2, Mic, MicOff } from 'lucide-react';

// Render bold text parts
const parseBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-krishx-dark-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

// Render custom formatted text with rich agronomy styling
const renderFormattedText = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, index) => {
    // Empty line spacer
    if (!line.trim()) {
      return <div key={index} className="h-2" />;
    }

    // Headings
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} className="text-[11px] font-bold text-krishx-dark-900 mt-4 mb-2 flex items-center gap-1.5 border-b border-krishx-earth-200/50 pb-1.5 uppercase tracking-widest">
          <Sprout className="w-3.5 h-3.5 text-krishx-green-600" />
          {line.substring(4)}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} className="text-[13px] font-bold text-krishx-dark-900 mt-5 mb-3 flex items-center gap-2 border-l-[3px] border-krishx-green-600 pl-3">
          {line.substring(3)}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} className="text-[15px] font-bold text-krishx-dark-900 mt-5 mb-3 bg-krishx-earth-50 p-2.5 rounded-xl border border-krishx-earth-200/50">
          {line.substring(2)}
        </h1>
      );
    }
    
    // Bullet points
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const content = line.trim().substring(2);
      return (
        <div key={index} className="flex items-start gap-3 my-2.5 pl-2 text-[15px] font-medium text-krishx-dark-900/90">
          <span className="text-krishx-green-600 shrink-0 mt-2 text-[8px]">•</span>
          <span className="flex-1 leading-relaxed">{parseBoldText(content)}</span>
        </div>
      );
    }
    
    // Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      const num = numMatch[1];
      const content = numMatch[2];
      return (
        <div key={index} className="flex items-start gap-3 my-2.5 pl-2 text-[15px] font-medium text-krishx-dark-900/90">
          <span className="text-krishx-green-700 font-bold shrink-0 mt-0.5">{num}.</span>
          <span className="flex-1 leading-relaxed">{parseBoldText(content)}</span>
        </div>
      );
    }
    
    // Confidence and warning special styles
    if (line.includes('Confidence') || line.includes('विश्वास') || line.includes('Confidence Level')) {
      return (
        <div key={index} className="my-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-xs font-bold text-amber-900 flex items-center gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <div className="flex-1 leading-relaxed">{parseBoldText(line)}</div>
        </div>
      );
    }

    if (line.includes('Expert') || line.includes('सलाह') || line.includes('सलाहकार') || line.includes('KVK')) {
      return (
        <div key={index} className="my-3 p-4 bg-krishx-earth-50 rounded-[1.25rem] border border-krishx-earth-200/50 text-[13px] font-medium text-krishx-dark-900 flex items-center gap-3">
          <Bot className="w-5 h-5 text-krishx-green-600 shrink-0" strokeWidth={1.5} />
          <div className="flex-1 leading-relaxed">{parseBoldText(line)}</div>
        </div>
      );
    }
    
    // Default paragraph
    return (
      <p key={index} className="my-2 text-[15px] font-medium leading-relaxed text-krishx-dark-900/90">
        {parseBoldText(line)}
      </p>
    );
  });
};

const QUICK_ACTIONS = [
  { 
    id: 'diagnose', 
    icon: Sprout, 
    label: { hi: 'फसल रोग जांच', en: 'Diagnose Crop', hinglish: 'Fasal Rog Check' }, 
    desc: { hi: 'पत्ती या तने की फोटो से बीमारी पहचानें', en: 'Identify disease from leaf/soil photo', hinglish: 'Photo se bimari pehchanein' }, 
    prompt: 'कृपया मेरी फसल के रोग की जांच करें और जैविक व रासायनिक उपचार बताएं।' 
  },
  { 
    id: 'schemes', 
    icon: FileText, 
    label: { hi: 'सरकारी योजनाएं', en: 'Govt Schemes', hinglish: 'Govt Schemes' }, 
    desc: { hi: 'पीएम-किसान, पीएम-कुसुम व अन्य योजनाएं', en: 'Learn about PM-KISAN, PM-KUSUM etc', hinglish: 'PM-Kisan aur anya schemes' }, 
    prompt: 'मुझे मुख्य सरकारी कृषि योजनाओं (पीएम-किसान, कुसुम योजना, फसल बीमा) के बारे में विस्तार से बताएं।' 
  },
  { 
    id: 'organic', 
    icon: HeartHandshake, 
    label: { hi: 'जैविक खेती', en: 'Organic Farming', hinglish: 'Organic Farming' }, 
    desc: { hi: 'प्राकृतिक खाद व कीटनाशक बनाने की विधि', en: 'Compost and bio-pesticide guide', hinglish: 'Natural khad aur keetnashak' }, 
    prompt: 'जैविक खेती शुरू करने के तरीके, प्राकृतिक खाद और जैविक कीटनाशक बनाने की उत्तम विधि समझाएं।' 
  },
  { 
    id: 'fertilizer', 
    icon: Award, 
    label: { hi: 'उर्वरक गाइड', en: 'Fertilizer Guide', hinglish: 'Fertilizer Guide' }, 
    desc: { hi: 'फसल अनुसार एनपीके और पोषक तत्वों की सलाह', en: 'NPK ratios and nutrient schedules', hinglish: 'Sahi khad aur fertilizer dose' }, 
    prompt: 'फसलों के लिए सही उर्वरक, एनपीके अनुपात और सूक्ष्म पोषक तत्वों की मात्रा का वैज्ञानिक मार्गदर्शन करें।' 
  },
  { 
    id: 'market', 
    icon: TrendingUp, 
    label: { hi: 'बाज़ार सलाह', en: 'Market Advice', hinglish: 'Mandi Advice' }, 
    desc: { hi: 'मंडी भाव व उपज बिक्री की सही सलाह', en: 'Current mandi price and sales guide', hinglish: 'Mandi bhav aur crop sales help' }, 
    prompt: 'मुझे मुख्य फसलों के वर्तमान मंडी भाव और उपज को सही समय पर बेचने के लिए बाज़ार सलाह दें।' 
  },
  { 
    id: 'planning', 
    icon: BookOpen, 
    label: { hi: 'फसल नियोजन', en: 'Crop Planning', hinglish: 'Crop Planning' }, 
    desc: { hi: 'मौसम अनुसार फसलों का सही चुनाव', en: 'Choose crops based on weather and season', hinglish: 'Mausam ke hisab se crop planning' }, 
    prompt: 'इस मौसम और क्षेत्र के अनुसार सही फसल नियोजन, मिट्टी की तैयारी और रोपाई के चरणों का मार्गदर्शन करें।' 
  }
];

const IMAGE_TYPES = [
  { id: 'crop', emoji: '🌾', label: { hi: 'पूरी फसल', en: 'Whole Crop', hinglish: 'Puri Fasal' } },
  { id: 'leaf', emoji: '🌱', label: { hi: 'पत्ती / पत्ता', en: 'Leaf Photo', hinglish: 'Pattiyan' } },
  { id: 'soil', emoji: '🪱', label: { hi: 'मिट्टी / जड़', en: 'Soil / Root', hinglish: 'Mitti / Jadd' } },
  { id: 'general', emoji: '📷', label: { hi: 'सामान्य फोटो', en: 'General Photo', hinglish: 'General Photo' } }
];

export const AIAssistant: React.FC = () => {
  const { userProfile, language } = useAuth();
  const t = getTranslation(language);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: t.ai.welcome,
      createdAt: new Date().toISOString(),
      followUpQuestions: language === 'hi' 
        ? ["गन्ने के पत्तों में कीड़े का इलाज बताएं।", "पीएम-कुसुम योजना के लिए पात्रता क्या है?", "जैविक खाद बनाने की विधि बताएं।"]
        : language === 'hinglish'
          ? ["Ganne ke patton me keede ka ilaaj.", "PM-Kusum scheme ki eligibility kya hai?", "Jaivik khad kaise banayein?"]
          : ["Sugarcane pest management guide", "PM-KUSUM scheme eligibility criteria", "Step-by-step organic compost prep"]
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<string>('');
  const [selectedImageType, setSelectedImageType] = useState<'crop' | 'leaf' | 'soil' | 'general'>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIntent, setCurrentIntent] = useState<'diagnose' | 'scheme' | 'education' | 'general'>('general');
  
  // To handle retries
  const [lastMessageText, setLastMessageText] = useState<string>('');
  const [lastMessageImage, setLastMessageImage] = useState<string | null>(null);
  const [lastMessageImageType, setLastMessageImageType] = useState<'crop' | 'leaf' | 'soil' | 'general'>('general');

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error("Error stopping speech recognition:", e);
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'hi' ? 'आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है।' : 'Speech recognition is not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'hinglish' ? 'hi-IN' : 'en-US';

      let baseText = inputText;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Real-time continuous translation updates into the text input, exactly as Google AI Studio does!
        const currentText = baseText + (baseText && finalTranscript ? ' ' : '') + finalTranscript;
        setInputText(currentText + (interimTranscript ? (currentText ? ' ' : '') + interimTranscript : ''));
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Error starting SpeechRecognition:", err);
      setIsRecording(false);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
    return () => clearTimeout(timer);
  }, [messages, loading, uploadProgress]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(
          language === 'hi' 
            ? "फ़ाइल का आकार 5MB से कम होना चाहिए। कृपया हल्की फोटो चुनें।" 
            : language === 'hinglish'
              ? "File size 5MB se kam honi chahiye. Please small size photo select karein."
              : "File size should be less than 5MB. Please choose a smaller photo."
        );
        return;
      }
      
      setError(null);
      setUploadProgress(0);
      setUploadPhase(language === 'hi' ? 'फोटो अपलोड हो रही है...' : language === 'hinglish' ? 'Photo upload ho rahi hai...' : 'Uploading photo...');
      
      const reader = new FileReader();
      
      // Simulate agricultural photo scanning progress bar
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          setUploadProgress(progress);
          if (progress === 40) {
            setUploadPhase(language === 'hi' ? 'फसल की बनावट जांची जा रही है...' : language === 'hinglish' ? 'Fasal ki structure check ho rahi hai...' : 'Analyzing crop structural pattern...');
          } else if (progress === 70) {
            setUploadPhase(language === 'hi' ? 'उच्च-गुणवत्ता संपीड़न सक्रिय...' : language === 'hinglish' ? 'High-quality compression active...' : 'Applying optimization filters...');
          }
        }
      }, 70);

      reader.onloadend = () => {
        setTimeout(() => {
          clearInterval(interval);
          setUploadProgress(100);
          setUploadPhase(language === 'hi' ? 'सफलतापूर्वक संलग्न!' : language === 'hinglish' ? 'Upload complete!' : 'Successfully attached!');
          
          setTimeout(() => {
            setImageBase64(reader.result as string);
            setUploadProgress(null);
            setUploadPhase('');
            setCurrentIntent('diagnose');
          }, 300);
        }, 800);
      };
      
      reader.onerror = () => {
        clearInterval(interval);
        setUploadProgress(null);
        setUploadPhase('');
        setError(language === 'hi' ? "फाइल अपलोड करने में विफलता।" : "Failed to load the image file.");
      };

      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImageBase64(null);
    setSelectedImageType('general');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCurrentIntent('general');
  };

  const handleSendMessage = async (textToSend: string, overrideImage?: string | null, overrideImageType?: 'crop' | 'leaf' | 'soil' | 'general') => {
    const text = textToSend.trim();
    const image = overrideImage !== undefined ? overrideImage : imageBase64;
    const imgType = overrideImageType !== undefined ? overrideImageType : selectedImageType;

    if (!text && !image) return;

    setError(null);
    setLastMessageText(text);
    setLastMessageImage(image);
    setLastMessageImageType(imgType);

    // Build polite agronomist placeholder queries if text is empty but image is present
    let finalQueryText = text;
    if (!text && image) {
      if (imgType === 'leaf') {
        finalQueryText = language === 'hi' 
          ? "कृपया इस पत्ती की फोटो की जांच करें और इस पर दिखने वाले कीट या बीमारी के लक्षण व उपचार बताएं।" 
          : language === 'hinglish'
            ? "Please is patti ki photo check karein, bimari ya keet ke lakshan aur ilaaj batayein."
            : "Please analyze this leaf photo. Identify any visible pests or disease symptoms and suggest treatments.";
      } else if (imgType === 'soil') {
        finalQueryText = language === 'hi' 
          ? "कृपया इस मिट्टी/जड़ की फोटो की जांच करें और पोषक तत्वों की स्थिति व मिट्टी स्वास्थ्य की सलाह दें।" 
          : language === 'hinglish'
            ? "Please is mitti/root ki photo check karein aur nutrients status ya soil health ki advice dein."
            : "Please inspect this soil/root photo. Advise on nutrient status and overall soil health.";
      } else {
        finalQueryText = language === 'hi' 
          ? "कृपया इस फसल की फोटो का वैज्ञानिक निदान करें और बीमारी का विवरण व निदान बताएं।" 
          : language === 'hinglish'
            ? "Please is crop photo ka scientific diagnosis karein aur bimari ke baare me batayein."
            : "Please perform a scientific diagnosis of this crop photo. Describe any disease and recommend actions.";
      }
    }
    

    if (image) {
      const formatStr = `\n\nPlease analyze the image for crop diseases, leaf damage, pest attacks, nutrient deficiencies, and general crop health. Present your response EXACTLY in this structured format, using simple and easy-to-understand language for farmers:\n\n🌿 Problem Detected\n[Your findings here]\n\n📖 Possible Reason\n[Reasons here]\n\n✅ Recommended Solution\n[Solutions here]\n\n⚠ Prevention Tips\n[Tips here]`;
      if (!text) {
        finalQueryText += formatStr;
      } else {
        finalQueryText = text + formatStr;
      }
    }

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      sender: 'user',
      text: finalQueryText,
      imageUrl: image || undefined,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setImageBase64(null);
    setSelectedImageType('general');
    if (fileInputRef.current) fileInputRef.current.value = '';

    setLoading(true);
    const aiThinkingId = 'thinking-' + Math.random().toString(36).substring(2, 11);
    
    // Friendly, reassuring custom agronomist loader
    setMessages(prev => [...prev, {
      id: aiThinkingId,
      sender: 'ai',
      text: t.ai.thinking,
      createdAt: new Date().toISOString(),
      isThinking: true
    }]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          currentProfile: userProfile,
          customImageBase64: image,
          language: language,
          imageType: imgType
        })
      });

      if (!response.ok) {
        throw new Error('AI Server responded with an error');
      }
      
      const data = await response.json();

      if (data.intent) {
        setCurrentIntent(data.intent);
      }

      setMessages(prev => prev.filter(m => m.id !== aiThinkingId).concat({
        id: Math.random().toString(36).substring(2, 11),
        sender: 'ai',
        text: data.text || (language === 'hi' ? "क्षमा करें, प्रतिक्रिया खाली थी।" : "Sorry, received empty response."),
        followUpQuestions: data.followUpQuestions || [],
        createdAt: new Date().toISOString()
      }));

    } catch (err) {
      console.error(err);
      setError(
        language === 'hi' 
          ? "कृषि एआई सहायक अभी उपलब्ध नहीं है। कृपया 'पुनः प्रयास करें' बटन दबाएं।" 
          : language === 'hinglish'
            ? "Agriculture AI Assistant abhi available nahi hai. Please 'Retry' button dabayein."
            : "The expert agricultural assistant is currently unavailable. Please click the 'Retry' button."
      );
      setMessages(prev => prev.filter(m => m.id !== aiThinkingId));
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLastMessage = () => {
    if (lastMessageText || lastMessageImage) {
      handleSendMessage(lastMessageText, lastMessageImage, lastMessageImageType);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto px-2 md:px-4 relative pb-2 min-h-0">
      
      {/* KrishX AI Premium Header - Styled with transparent glass & refined hierarchy */}
      <div className="mb-4 shrink-0 flex items-center justify-between bg-white/70 backdrop-blur-xl border border-krishx-earth-200/60 p-4 md:py-3.5 md:px-5 rounded-[2rem] shadow-premium-soft">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-krishx-green-50 rounded-2xl text-krishx-green-600 border border-krishx-green-100 shadow-sm">
            <Bot className="w-5.5 h-5.5 animate-pulse" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-display font-bold tracking-tight flex items-center gap-2 leading-none text-krishx-dark-900">
              KrishX <span className="text-krishx-green-600 font-extrabold">AI</span>
              <span className="bg-krishx-green-100 text-krishx-green-800 border border-krishx-green-200/60 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider ml-1">Agronomist</span>
            </h2>
            <p className="text-[9px] md:text-[10px] font-bold text-krishx-dark-700/60 mt-1 uppercase tracking-widest">
              {language === 'hi' ? 'विशेषज्ञ कृषि और रोग निदान सहायक' : language === 'hinglish' ? 'Expert Agriculture & Disease Guide' : 'Expert Agriculture & Disease Assistant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-krishx-green-50/50 border border-krishx-green-100 px-2.5 py-1 rounded-full">
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-krishx-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-krishx-green-500"></span>
          </span>
          <span className="text-[9px] font-extrabold text-krishx-green-700 uppercase tracking-widest hidden sm:block">Active</span>
        </div>
      </div>

      {/* Main Chat Container - Open Airy Workspace */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-1 py-4 md:px-2 md:py-6 space-y-6 relative scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-krishx-earth-200/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-krishx-earth-300">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className={`flex gap-4 max-w-[92%] md:max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${
                    isAi 
                      ? 'bg-white text-krishx-green-600 border border-krishx-earth-200/50 shadow-sm' 
                      : 'bg-krishx-dark-900 text-white shadow-md'
                  }`}>
                    {isAi ? <Bot className="w-5 h-5" strokeWidth={1.5} /> : <UserIcon className="w-5 h-5" strokeWidth={1.5} />}
                  </div>

                  {/* Message Bubble Column */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className={`p-5 md:p-6 rounded-[2rem] text-[15px] leading-relaxed border transition-all duration-300 ${
                      isAi 
                        ? 'bg-white border-krishx-earth-200/60 text-krishx-dark-900 rounded-tl-sm shadow-premium-soft hover:shadow-md hover:border-krishx-earth-300' 
                        : 'bg-krishx-green-50/90 border border-krishx-green-200/60 text-krishx-dark-900 rounded-tr-sm shadow-sm'
                    }`}>
                      {msg.isThinking ? (
                        <div className="flex items-center gap-3 py-1 text-krishx-dark-700/60 font-semibold uppercase tracking-wider text-[11px]">
                          <Loader2 className="w-4 h-4 animate-spin text-krishx-green-600" />
                          <span>{msg.text}</span>
                        </div>
                      ) : (
                        <div className="space-y-2 break-words">
                          {renderFormattedText(msg.text)}
                        </div>
                      )}
                      
                      {msg.imageUrl && (
                        <div className="mt-4 rounded-2xl overflow-hidden border border-krishx-earth-200/50 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] max-w-sm">
                          <img src={msg.imageUrl} alt="Uploaded agricultural evidence" className="w-full object-cover max-h-64 hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                    </div>

                    {/* Follow-up Chips (Only show if not currently loading) */}
                    {isAi && msg.followUpQuestions && msg.followUpQuestions.length > 0 && !loading && (
                      <div className="flex flex-wrap gap-2 pt-2 mt-3">
                        {msg.followUpQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="bg-white hover:bg-krishx-green-600 hover:text-white border border-krishx-earth-200 text-krishx-dark-900 hover:border-krishx-green-600 px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Quick Actions Panel - displayed only when starting a conversation */}
          {messages.length === 1 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="pt-10 max-w-2xl mx-auto w-full mt-6 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-transparent px-4 text-xs font-bold text-krishx-dark-700/50 uppercase tracking-widest">
                Start a Conversation
              </div>
              <div className="flex items-center gap-2 mb-6 px-1">
                <Bot className="w-4 h-4 text-krishx-green-600" strokeWidth={1.5} />
                <p className="text-[11px] font-bold uppercase text-krishx-dark-700/60 tracking-[0.15em]">
                  {language === 'hi' ? 'विशेषज्ञ कृषि त्वरित क्रियाएं' : language === 'hinglish' ? 'Expert Agri Quick Actions' : 'Expert Agri Quick Actions'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="bg-white border border-krishx-earth-200/60 rounded-[2rem] p-5 hover:shadow-premium-soft hover:-translate-y-1 hover:border-krishx-green-500/20 text-left cursor-pointer transition-all duration-300 group flex items-start gap-4"
                  >
                    <div className="p-3 bg-krishx-green-50 rounded-2xl text-krishx-green-600 shrink-0 group-hover:bg-krishx-green-100 group-hover:text-krishx-green-700 transition-all duration-300 shadow-sm">
                      <action.icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-bold text-krishx-dark-900 group-hover:text-krishx-green-700 transition-colors">
                        {action.label[language] || action.label.hi}
                      </h4>
                      <p className="text-[11px] font-medium text-krishx-dark-700/60 line-clamp-2 mt-1 leading-relaxed">
                        {action.desc[language] || action.desc.hi}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Floating Bottom Input & Upload Controls Bar */}
        <div className="mt-4 shrink-0 bg-white/80 backdrop-blur-xl border border-krishx-earth-200/60 rounded-[2.5rem] p-4 md:p-5 shadow-premium-soft space-y-4 relative z-10">
          
          {/* Photo Category Selection (Always visible if image is loaded or uploading) */}
          {(imageBase64 || uploadProgress !== null) && (
            <div className="bg-white/95 p-4 rounded-[2rem] border border-krishx-earth-200/50 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-krishx-dark-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-krishx-green-600" />
                  {language === 'hi' ? 'संलग्न फोटो का प्रकार' : language === 'hinglish' ? 'Select Photo Type' : 'Select Photo Type'}
                </span>
                {imageBase64 && (
                  <button 
                    onClick={handleClearImage}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    {language === 'hi' ? 'हटाएं' : language === 'hinglish' ? 'Hataein' : 'Remove'}
                  </button>
                )}
              </div>

              {/* Progress bar overlay */}
              {uploadProgress !== null ? (
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-krishx-earth-200/50 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-krishx-green-600 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-krishx-dark-700/80 font-bold uppercase tracking-widest mt-1.5">
                    <span>{uploadPhase}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {IMAGE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedImageType(type.id as any)}
                      className={`py-2 px-1 rounded-xl text-center border transition-all duration-200 cursor-pointer ${
                        selectedImageType === type.id 
                          ? 'bg-krishx-dark-900 border-krishx-dark-900 text-white font-bold scale-[1.02] shadow-sm shadow-krishx-dark-900/10' 
                          : 'bg-krishx-earth-50 border-krishx-earth-200 text-krishx-dark-700/80 hover:bg-krishx-earth-100 hover:text-krishx-dark-900'
                      }`}
                    >
                      <span className="text-xs block">{type.emoji}</span>
                      <span className="text-[8px] font-bold block truncate mt-0.5">
                        {type.label[language] || type.label.hi}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat text input and send trigger buttons */}
          <div className="flex items-center gap-3 relative">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadProgress !== null}
              className="p-4 bg-white text-krishx-dark-700/60 rounded-2xl border border-krishx-earth-200 shadow-sm hover:shadow-md hover:bg-krishx-earth-50 hover:text-krishx-dark-900 hover:scale-105 transition-all duration-300 shrink-0 flex items-center justify-center disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-sm"
              title="Upload crop disease, leaf, or soil picture"
            >
              <Camera className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <div className="relative flex-1">
              {isRecording && (
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-[3px] h-4 z-10 pointer-events-none">
                  <span className="w-[3px] h-2 bg-krishx-green-600 rounded-full animate-[bounce_0.8s_infinite_ease-in-out]" style={{ animationDelay: '0ms' }} />
                  <span className="w-[3px] h-4 bg-krishx-green-500 rounded-full animate-[bounce_0.8s_infinite_ease-in-out]" style={{ animationDelay: '150ms' }} />
                  <span className="w-[3px] h-3 bg-krishx-green-600 rounded-full animate-[bounce_0.8s_infinite_ease-in-out]" style={{ animationDelay: '300ms' }} />
                  <span className="w-[3px] h-5 bg-krishx-green-500 rounded-full animate-[bounce_0.8s_infinite_ease-in-out]" style={{ animationDelay: '450ms' }} />
                  <span className="w-[3px] h-2 bg-krishx-green-600 rounded-full animate-[bounce_0.8s_infinite_ease-in-out]" style={{ animationDelay: '600ms' }} />
                </div>
              )}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage(inputText)}
                placeholder={isRecording ? (language === 'hi' ? 'सुन रहा हूँ...' : language === 'hinglish' ? 'Sun raha hoon...' : 'Listening...') : t.ai.inputPlaceholder}
                disabled={loading}
                className={`premium-input w-full py-4 pr-14 text-[15px] rounded-2xl shadow-sm transition-all duration-300 ${
                  isRecording 
                    ? 'pl-16 border-krishx-green-400 ring-4 ring-krishx-green-100/50 bg-krishx-green-50/20' 
                    : 'pl-6 focus:border-krishx-green-500 focus:ring-4 focus:ring-krishx-green-500/10'
                }`}
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                  isRecording 
                    ? 'bg-krishx-green-100 text-krishx-green-700 ring-4 ring-krishx-green-200' 
                    : 'text-krishx-dark-700/60 hover:text-krishx-green-600 hover:bg-krishx-earth-100'
                }`}
                title="Voice Input"
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'scale-110' : ''}`} strokeWidth={1.5} />
              </button>
            </div>

            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={loading || (!inputText.trim() && !imageBase64) || uploadProgress !== null}
              className="p-4 bg-krishx-green-600 text-white rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-krishx-green-700 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all duration-300 shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Global Errors and Retry mechanism */}
          {error && (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200/50 rounded-2xl text-xs text-amber-900 font-bold shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
              <button 
                onClick={handleRetryLastMessage}
                className="bg-amber-900 text-white hover:bg-amber-950 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {language === 'hi' ? 'पुनः प्रयास करें' : language === 'hinglish' ? 'Retry' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
