import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom'; 
import { 
  MessageSquare, X, Send, AlertCircle, FilePlus, 
  Sparkles, Shield, Scale, Info, Zap, 
  ArrowUpRight, Bot, User as UserIcon
} from 'lucide-react'; 

interface ChatbotMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  bnsSection?: string;
  caseCategory?: string;
  requiredEvidence?: string[];
  originalQuery?: string;
  draftedDescription?: string;
  extractedEntities?: {
    title?: string;
    location?: string;
    incidentDate?: string;
  };
}

export const Chatbot: React.FC = () => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate(); 
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      const userId = user.userId || user._id || user.id || 'default'; 
      const savedChat = localStorage.getItem(`chat_history_${userId}`);
      
      if (savedChat) {
        try {
          setMessages(JSON.parse(savedChat));
        } catch (e) {
          console.error("Could not load chat history", e);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
      setIsOpen(false);
    }
  }, [user]);

  const saveMessagesToStorage = (updatedMessages: ChatbotMessage[]) => {
    if (user) {
      const userId = user.userId || user._id || user.id || 'default';
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(updatedMessages));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentQuery = input; 

    const userMessage: ChatbotMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
    };

    const newMessagesWithUser = [...messages, userMessage];
    setMessages(newMessagesWithUser);
    saveMessagesToStorage(newMessagesWithUser);

    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: currentQuery }), 
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      let displayText = data.message || data.response || '';
      let extractedBns = data.bnsSection;
      let extractedCategory = data.caseCategory;
      let extractedEvidence = data.requiredEvidence;
      let extractedDraft = data.draftedDescription; 
      let extractedEntities = data.extractedEntities;

      const botMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: displayText, 
        bnsSection: extractedBns, 
        caseCategory: extractedCategory,
        requiredEvidence: extractedEvidence,
        draftedDescription: extractedDraft,
        extractedEntities: extractedEntities,
        originalQuery: currentQuery
      };

      setMessages((prev) => {
        const finalMessages = [...prev, botMessage];
        saveMessagesToStorage(finalMessages); 
        return finalMessages;
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error getting response');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 z-40 w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group animate-in zoom-in-50 duration-500 ${
          theme === 'light' ? 'bg-indigo-600 text-white' : 
          theme === 'high-contrast' ? 'bg-white text-black border-2 border-white' :
          'bg-indigo-600 text-white shadow-indigo-500/20 border border-white/10'
        }`}
        title="Open Neural Assistant"
      >
        <div className="absolute inset-0 bg-indigo-400 rounded-[2rem] animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <Bot size={28} className="relative z-10" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 w-[400px] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col h-[650px] z-50 border transition-all duration-500 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 ${
      theme === 'light' ? 'bg-white border-slate-200' : 
      theme === 'high-contrast' ? 'bg-black border-white' : 
      'bg-[#0a0f1d]/95 backdrop-blur-2xl border-white/10'
    }`}>
      
      {/* HEADER */}
      <div className={`p-6 flex items-center justify-between border-b transition-colors duration-500 ${
        theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className={`font-black uppercase tracking-tighter text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Neural Legal AI</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Uplink</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className={`p-3 rounded-2xl transition-all ${
            theme === 'light' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-slate-500'
          }`}
        >
          <X size={20} />
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border transition-colors ${
              theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white/5 border-white/10 text-slate-700'
            }`}>
              <Sparkles size={40} />
            </div>
            <div className="space-y-2">
              <p className={`font-black uppercase tracking-widest text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Initialized Neural Assistant</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                Query the BNS/BNSS database for real-time statutory mapping.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex items-center gap-2 mb-1 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                   <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                     msg.type === 'user' ? 'bg-indigo-600 text-white' : (theme === 'light' ? 'bg-slate-100 text-slate-400' : 'bg-white/10 text-slate-500')
                   }`}>
                     {msg.type === 'user' ? <UserIcon size={12}/> : <Bot size={12}/>}
                   </div>
                   <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{msg.type}</span>
                </div>

                <div
                  className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm transition-all ${
                    msg.type === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : (theme === 'light' ? 'bg-slate-50 text-slate-900 border border-slate-100 rounded-tl-none' : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none')
                  }`}
                >
                  {msg.text}
                </div>

                {/* Structured Bot Output */}
                {msg.type === 'bot' && (msg.bnsSection || msg.caseCategory) && (
                  <div className={`w-[85%] p-5 rounded-[1.5rem] border space-y-4 animate-in zoom-in-95 duration-500 ${
                    theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-600/5 border border-indigo-500/20'
                  }`}>
                    <div className="flex flex-wrap gap-2">
                      {msg.bnsSection && (
                        <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Scale size={10} /> BNS {msg.bnsSection}
                        </div>
                      )}
                      {msg.caseCategory && (
                        <div className="px-3 py-1 bg-white/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Zap size={10} /> {msg.caseCategory}
                        </div>
                      )}
                    </div>

                    {msg.requiredEvidence && msg.requiredEvidence.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                          <Info size={10} /> Evidence Node Requirements
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.requiredEvidence.map((ev, i) => (
                            <span key={i} className="text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">{ev}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user?.role === 'citizen' && msg.draftedDescription && (
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          navigate('/file-case', { 
                            state: { 
                              bnsSection: msg.bnsSection, 
                              type: msg.caseCategory, 
                              requiredEvidence: msg.requiredEvidence,
                              description: msg.draftedDescription || msg.originalQuery,
                              title: msg.extractedEntities?.title || '',
                              location: msg.extractedEntities?.location || '',
                              incidentDate: msg.extractedEntities?.incidentDate || ''
                            } 
                          });
                        }}
                        className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl ${
                          theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'
                        }`}
                      >
                        <FilePlus size={14} /> Initialize Draft <ArrowUpRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex flex-col items-start space-y-2">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-slate-100 text-slate-400' : 'bg-white/10 text-slate-500'}`}>
                  <Bot size={12}/>
                </div>
                <div className={`px-5 py-4 rounded-[1.5rem] rounded-tl-none border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* INPUT */}
      <div className={`p-6 border-t transition-colors duration-500 ${
        theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'
      }`}>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wide rounded-xl flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query Node..."
            className={`w-full pl-6 pr-14 py-4 rounded-2xl border transition-all outline-none font-bold text-sm uppercase tracking-wider ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600' : 
              theme === 'high-contrast' ? 'bg-black border-white text-white focus:bg-zinc-900' :
              'bg-[#070b14] border-white/10 text-white focus:border-indigo-500'
            }`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${
              loading || !input.trim() 
                ? 'opacity-20 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20'
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};