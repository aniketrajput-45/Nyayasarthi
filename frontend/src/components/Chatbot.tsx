import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom'; 
import { MessageCircle, X, Send, AlertCircle, FilePlus } from 'lucide-react'; 

interface ChatbotMessage {
  id: string;
  type: 'user' | 'bot';
  text: string;
  bnsSection?: string;
  caseCategory?: string;
  requiredEvidence?: string[];
  originalQuery?: string;
  draftedDescription?: string; 
}

export const Chatbot: React.FC = () => {
  const { token } = useAuth();
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentQuery = input; 

    const userMessage: ChatbotMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
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
      
      // ==========================================
      // --- NEW: SMART JSON PARSER ---
      // ==========================================
      let displayText = data.message || data.response || '';
      let extractedBns = data.bnsSection;
      let extractedCategory = data.caseCategory;
      let extractedEvidence = data.requiredEvidence;
      // CHANGE 1: Extract the drafted description
      let extractedDraft = data.draftedDescription; 

      const stringToParse = typeof data === 'string' ? data : displayText;

      if (typeof stringToParse === 'string' && stringToParse.includes('"bnsSection"')) {
        try {
          const cleanString = stringToParse.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiData = JSON.parse(cleanString);
          
          displayText = aiData.message;
          extractedBns = aiData.bnsSection;
          extractedCategory = aiData.caseCategory;
          extractedEvidence = aiData.requiredEvidence;
          // CHANGE 2: Extract from the parsed string
          extractedDraft = aiData.draftedDescription; 
        } catch (parseError) {
          console.error("Could not parse AI JSON string:", parseError);
        }
      }
      // ==========================================

      const botMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: displayText, 
        bnsSection: extractedBns, 
        caseCategory: extractedCategory,
        requiredEvidence: extractedEvidence,
        // CHANGE 3: Add it to the message object
        draftedDescription: extractedDraft,
        originalQuery: currentQuery
      };

      setMessages((prev) => [...prev, botMessage]);
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
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition flex items-center justify-center z-40"
        title="Open chatbot"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-96 bg-white rounded-lg shadow-2xl flex flex-col h-[600px] z-50">
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between rounded-t-lg">
        <h3 className="font-semibold">Legal Assistant</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-blue-700 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-slate-600">
              <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm">Ask me anything about legal matters</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.type === 'bot' && msg.bnsSection && (
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/file-case', { 
                        state: { 
                          bnsSection: msg.bnsSection, 
                          type: msg.caseCategory, 
                          requiredEvidence: msg.requiredEvidence,
                          // CHANGE 4: Prioritize the AI drafted description, if it fails, use the short query
                          description: msg.draftedDescription || msg.originalQuery 
                        } 
                      });
                    }}
                    className="mt-2 flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition"
                  >
                    <FilePlus size={14} /> Use AI to Draft Case (BNS {msg.bnsSection})
                  </button>
                )}

              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg text-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-2 rounded-lg transition flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};