import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, MapPin, MessageSquare, Send, Clock } from 'lucide-react';

export const Contact: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            <MessageSquare size={14} /> Contact Us
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter mb-6 uppercase">
            Let's Start a <span className="text-slate-500">Conversation</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Have questions about our legal services? Our team is here to provide you with expert guidance and support.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="pb-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {[
              { icon: Phone, title: 'Call Us', value: '+91 1800-LAW-ZERO', desc: 'Mon - Fri, 9am - 6pm' },
              { icon: Mail, title: 'Email Us', value: 'support@nyayasarthi.com', desc: 'Response within 24 hours' },
              { icon: MapPin, title: 'Office', value: 'High Court Complex', desc: 'New Delhi, India, 110001' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 group hover:bg-white/[0.08] transition-all">
                <div className="w-12 h-12 rounded-xl bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors mb-6 border border-white/5">
                  <item.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide text-sm">{item.title}</h3>
                <p className="text-white font-bold text-lg mb-1 tracking-tight">{item.value}</p>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Contact Form (Dummy) */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 lg:p-12 relative overflow-hidden group">
             {/* Glow effect */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/10 blur-3xl rounded-full"></div>
             
             <div className="relative z-10">
               <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Send us a message</h2>
               <form className="grid sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                   <input type="text" placeholder="John Doe" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-600" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                   <input type="email" placeholder="john@example.com" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-600" />
                 </div>
                 <div className="sm:col-span-2 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Subject</label>
                   <input type="text" placeholder="Case Inquiry" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-600" />
                 </div>
                 <div className="sm:col-span-2 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Message</label>
                   <textarea rows={4} placeholder="How can we help you?" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-600 resize-none"></textarea>
                 </div>
                 <div className="sm:col-span-2 pt-4">
                   <button type="button" className="w-full bg-white text-slate-950 px-8 py-5 rounded-xl font-black hover:bg-slate-200 transition shadow-xl flex items-center justify-center gap-3 group">
                     SUBMIT ENQUIRY <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </button>
                 </div>
               </form>
             </div>
          </div>
        </div>
      </section>

      {/* Office Hours / Extras */}
      <section className="py-24 border-t border-white/5 bg-[#050810]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Clock className="mx-auto text-orange-500 mb-6" size={48} />
          <h2 className="text-3xl font-bold text-white mb-6 uppercase tracking-tighter">Support Availability</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest">Monday - Friday</p>
              <p className="text-slate-500 text-sm">09:00 AM - 08:00 PM</p>
            </div>
            <div className="space-y-2">
               <p className="text-sm font-bold text-white uppercase tracking-widest">Saturday</p>
               <p className="text-slate-500 text-sm">10:00 AM - 04:00 PM</p>
            </div>
            <div className="space-y-2">
               <p className="text-sm font-bold text-white uppercase tracking-widest">Sunday</p>
               <p className="text-slate-500 text-sm">Emergency Chat Only</p>
            </div>
            <div className="space-y-2">
               <p className="text-sm font-bold text-white uppercase tracking-widest">Live Chat</p>
               <p className="text-slate-500 text-sm">24/7 Availability</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
