import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Search, 
  Info, 
  Phone, 
  Globe, 
  MapPin, 
  ChevronRight, 
  LayoutDashboard, 
  BookOpen, 
  AlertCircle,
  Volume2,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Scheme, PortalStatus, Language, LANGUAGES, STATES } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ 
  currentLanguage, 
  onLanguageChange 
}: { 
  currentLanguage: Language, 
  onLanguageChange: (lang: Language) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
          <Volume2 size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none text-zinc-900">Voice for Bharat</h1>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">Swar Se Sashaktikaran</p>
        </div>
      </div>

      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-sm font-medium"
        >
          <Globe size={16} className="text-zinc-500" />
          {LANGUAGES.find(l => l.name === currentLanguage)?.native}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/5 z-20 overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto py-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.name);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 transition-colors",
                        currentLanguage === lang.name ? "text-emerald-600 font-semibold bg-emerald-50" : "text-zinc-600"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>{lang.name}</span>
                        <span className="text-xs opacity-50">{lang.native}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

const SchemeCard = ({ scheme, onClick }: { scheme: Scheme; onClick: () => void }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-3">
      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
        {scheme.category}
      </span>
      <span className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
        <MapPin size={10} />
        {scheme.state}
      </span>
    </div>
    <h3 className="font-bold text-zinc-900 mb-2 group-hover:text-emerald-700 transition-colors">
      {scheme.name}
    </h3>
    <p className="text-sm text-zinc-500 line-clamp-2 mb-4">
      {scheme.description}
    </p>
    <div className="flex items-center text-emerald-600 text-xs font-semibold">
      View Details <ChevronRight size={14} />
    </div>
  </motion.div>
);

const VoiceAssistant = ({ 
  language, 
  onClose 
}: { 
  language: Language; 
  onClose: () => void 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      const langCode = LANGUAGES.find(l => l.name === language)?.code || 'en';
      recognitionRef.current.lang = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          handleProcessVoice(transcript);
        }
      };
    }
  }, [language, transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setResponse("");
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleProcessVoice = async (text: string) => {
    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user is asking about government welfare schemes in India. 
        Language: ${language}.
        User Query: "${text}"
        Provide a helpful, concise response in ${language}. If they ask about eligibility or benefits, be specific.
        Keep it simple and empathetic.`,
      });
      
      const resText = model.text || "I'm sorry, I couldn't process that. Please try again.";
      setResponse(resText);
      
      // Basic TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(resText);
        const langCode = LANGUAGES.find(l => l.name === language)?.code || 'en';
        utterance.lang = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error(error);
      setResponse("I encountered an error. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-x-0 bottom-0 z-[60] p-4"
    >
      <div className="max-w-lg mx-auto bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">AI Assistant</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="min-h-[120px] mb-8 flex flex-col justify-center items-center text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-zinc-400 text-sm italic">Thinking...</p>
              </div>
            ) : response ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-lg font-medium leading-relaxed"
              >
                {response}
              </motion.div>
            ) : transcript ? (
              <p className="text-xl font-semibold text-emerald-400">"{transcript}"</p>
            ) : (
              <p className="text-zinc-500 text-lg">Tap the mic and ask about any government scheme...</p>
            )}
          </div>

          <div className="flex justify-center">
            <button 
              onClick={toggleListening}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl",
                isListening 
                  ? "bg-red-500 scale-110 shadow-red-500/20" 
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
              )}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>
          
          <p className="text-center mt-4 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
            {isListening ? "Listening..." : "Tap to speak"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const SchemeDetailModal = ({ scheme, onClose }: { scheme: Scheme; onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
    >
      <div className="p-8 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider rounded-full">
            {scheme.category}
          </span>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} className="text-zinc-400" />
          </button>
        </div>

        <h2 className="text-3xl font-bold text-zinc-900 mb-4 leading-tight">{scheme.name}</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">State</p>
            <p className="font-semibold text-zinc-900">{scheme.state}</p>
          </div>
          <div className="bg-zinc-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Language</p>
            <p className="font-semibold text-zinc-900">{scheme.language}</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h4 className="flex items-center gap-2 text-lg font-bold text-zinc-900 mb-3">
              <Info size={20} className="text-emerald-600" />
              Description
            </h4>
            <p className="text-zinc-600 leading-relaxed">{scheme.description}</p>
          </section>

          <section>
            <h4 className="flex items-center gap-2 text-lg font-bold text-zinc-900 mb-3">
              <CheckCircle2 size={20} className="text-emerald-600" />
              Eligibility
            </h4>
            <p className="text-zinc-600 leading-relaxed">{scheme.eligibility}</p>
          </section>

          <section>
            <h4 className="flex items-center gap-2 text-lg font-bold text-zinc-900 mb-3">
              <Volume2 size={20} className="text-emerald-600" />
              Benefits
            </h4>
            <p className="text-zinc-600 leading-relaxed">{scheme.benefits}</p>
          </section>
        </div>
      </div>
      
      <div className="p-6 bg-zinc-50 border-t border-black/5 flex gap-3">
        <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200">
          Apply Now
        </button>
        <button className="px-6 bg-white border border-black/5 hover:bg-zinc-100 text-zinc-900 font-bold py-4 rounded-2xl transition-all">
          <Phone size={20} />
        </button>
      </div>
    </motion.div>
  </div>
);

// --- Main App ---

export default function App() {
  const [language, setLanguage] = useState<Language>('English');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [portals, setPortals] = useState<PortalStatus[]>([]);
  const [selectedState, setSelectedState] = useState('Central');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [schemesRes, portalsRes] = await Promise.all([
          fetch(`/api/schemes?state=${selectedState}`),
          fetch('/api/portals')
        ]);
        const schemesData = await schemesRes.json();
        const portalsData = await portalsRes.json();
        setSchemes(schemesData);
        setPortals(portalsData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedState]);

  const filteredSchemes = schemes.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar currentLanguage={language} onLanguageChange={setLanguage} />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* Hero Section */}
        <section className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
              Empowering Bharat through <span className="text-emerald-600">Voice & Vision</span>
            </h2>
            <p className="text-lg text-zinc-500 leading-relaxed">
              Discover government welfare schemes easily. Speak in your language, get instant guidance, and navigate your rights with confidence.
            </p>
          </motion.div>
        </section>

        {/* Search & Filters */}
        <section className="mb-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search schemes, categories, or benefits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <select 
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-4 bg-white border border-black/5 rounded-2xl focus:outline-none focus:border-emerald-500 shadow-sm font-medium min-w-[160px]"
            >
              {STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Schemes Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={24} className="text-emerald-600" />
                Available Schemes
              </h3>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {filteredSchemes.length} Results
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-zinc-100 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : filteredSchemes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSchemes.map(scheme => (
                  <SchemeCard 
                    key={scheme.id} 
                    scheme={scheme} 
                    onClick={() => setSelectedScheme(scheme)} 
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-zinc-200 text-center">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-zinc-300" />
                </div>
                <h4 className="text-lg font-bold text-zinc-900 mb-2">No schemes found</h4>
                <p className="text-zinc-500">Try adjusting your search or state filter.</p>
              </div>
            )}
          </div>

          {/* Sidebar: Status & Helplines */}
          <div className="space-y-8">
            {/* Portal Status */}
            <section className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <LayoutDashboard size={20} className="text-emerald-600" />
                Portal Status
              </h3>
              <div className="space-y-4">
                {portals.map(portal => (
                  <div key={portal.id} className="flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{portal.name}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{new URL(portal.url).hostname}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        portal.status === 'Online' ? "bg-emerald-500" : "bg-red-500"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{portal.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Emergency Helplines */}
            <section className="bg-emerald-900 text-white p-6 rounded-[2.5rem] shadow-xl shadow-emerald-900/10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-emerald-400" />
                Quick Helplines
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">National Emergency</p>
                    <p className="text-xl font-bold">112</p>
                  </div>
                  <Phone size={20} className="text-emerald-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Women Helpline</p>
                    <p className="text-xl font-bold">1091</p>
                  </div>
                  <Phone size={20} className="text-emerald-400" />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Child Helpline</p>
                    <p className="text-xl font-bold">1098</p>
                  </div>
                  <Phone size={20} className="text-emerald-400" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Voice Trigger */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowVoiceAssistant(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 z-50 group"
      >
        <Mic size={28} />
        <span className="absolute right-full mr-4 px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ask Bharat AI
        </span>
      </motion.button>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {showVoiceAssistant && (
          <VoiceAssistant 
            language={language} 
            onClose={() => setShowVoiceAssistant(false)} 
          />
        )}
        {selectedScheme && (
          <SchemeDetailModal 
            scheme={selectedScheme} 
            onClose={() => setSelectedScheme(null)} 
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t border-black/5 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-500">
              <Volume2 size={18} />
            </div>
            <h4 className="font-bold text-zinc-900">Voice for Bharat</h4>
          </div>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
            Advancing inclusive governance through AI. Making information a right, not a privilege.
          </p>
          <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
