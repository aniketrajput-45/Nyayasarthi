import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, Shield, FileText, Scale, MessageCircle, ChevronDown } from 'lucide-react';

export const FAQ: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      category: "General",
      questions: [
        { q: "What is Nyayasarthi?", a: "Nyayasarthi is a comprehensive digital legal platform designed to simplify case management, legal notice generation, and communication between citizens, lawyers, and law enforcement." },
        { q: "How do I get started?", a: "Simply sign up as a Citizen, Lawyer, or Police officer. Once your account is verified, you can access your personalized dashboard and start using our legal tools." }
      ]
    },
    {
      category: "Legal & Cases",
      questions: [
        { q: "Is the legal notice generator legally binding?", a: "Our generator provides professionally drafted templates based on Indian legal standards. However, we recommend having them reviewed by a verified lawyer on our platform before sending." },
        { q: "How can I track my case status?", a: "Your dashboard provides real-time updates and notifications for every case you are involved in. You can see the stage of the case, upcoming hearings, and recent filings." }
      ]
    },
    {
      category: "Security",
      questions: [
        { q: "Is my data secure?", a: "We use enterprise-grade encryption and secure cloud storage to ensure your legal documents and communications remain private and protected at all times." },
        { q: "Who can see my case details?", a: "Only authorized parties (you, your lawyer, and the assigned judge/police officer) have access to specific case details, maintaining strict confidentiality." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <nav className="border-b border-white/5 bg-[#070b14]/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition group"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap w-[24px] h-[24px] gap-[2px]">
              <div className="w-[11px] h-[11px] bg-orange-600 rounded-sm"></div>
              <div className="w-[11px] h-[11px] bg-orange-500 rounded-sm"></div>
              <div className="w-[11px] h-[11px] bg-orange-400 rounded-sm"></div>
              <div className="w-[11px] h-[11px] bg-transparent rounded-sm"></div>
            </div>
            <span className="text-lg font-bold text-white tracking-tight uppercase">Nyayasarthi</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6">
            <HelpCircle size={14} /> Help Center
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-6 uppercase">
            Frequently Asked <span className="text-slate-500">Questions</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about Nyayasarthi services and our digital legal ecosystem.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="pb-32 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-16">
          {faqs.map((category, idx) => (
            <div key={idx} className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3 border-l-4 border-orange-600 pl-4 uppercase tracking-wider">
                {category.category}
              </h2>
              <div className="grid gap-4">
                {category.questions.map((item, qIdx) => (
                  <div 
                    key={qIdx}
                    className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-white font-bold mb-3 tracking-wide">{item.q}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{item.a}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-slate-900/50 flex items-center justify-center text-slate-500 group-hover:text-orange-500 transition-colors">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 border-t border-white/5 bg-[#050810]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Still have questions?</h2>
          <p className="text-slate-400 mb-10">We're here to help you navigate your legal journey with confidence.</p>
          <button className="bg-white text-slate-950 px-8 py-4 rounded-xl font-bold hover:bg-slate-200 transition shadow-xl">
            Contact Support
          </button>
        </div>
      </section>
    </div>
  );
};
