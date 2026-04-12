import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Gavel, Users, MessageSquare, ChevronRight, LucideIcon, ArrowUpRight, Globe, ChevronDown, Instagram, Facebook, Twitter, HelpCircle, LifeBuoy, User, Mail } from 'lucide-react';


export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [activePillar, setActivePillar] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActivePillar((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="min-h-screen bg-[#070b14] font-sans overflow-x-hidden selection:bg-orange-500/30 text-slate-300">
      {/* Hero Container */}
      <div className="relative min-h-screen flex flex-col">
        {/* Lady Justice Background Image */}
        <div className="absolute top-0 right-0 w-[120%] sm:w-full lg:w-[65%] h-full z-0 pointer-events-none opacity-90 animate-float overflow-hidden">
          <div
            className="absolute inset-0 bg-contain bg-no-repeat bg-right-bottom sm:bg-right"
            style={{
              backgroundImage: "url('/intense-cyber-justice.png')",
              mixBlendMode: 'lighten',
              WebkitMaskImage: 'radial-gradient(ellipse at 80% 50%, black 0%, transparent 75%)',
              maskImage: 'radial-gradient(ellipse at 80% 50%, black 0%, transparent 75%)'
            }}
          ></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap w-[28px] h-[28px] gap-[3px]">
              <div className="w-[12px] h-[12px] bg-orange-600 rounded-sm"></div>
              <div className="w-[12px] h-[12px] bg-orange-500 rounded-sm"></div>
              <div className="w-[12px] h-[12px] bg-orange-400 rounded-sm"></div>
              <div className="w-[12px] h-[12px] bg-transparent rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Nyayasarthi</span>
          </div>


          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition border border-white/10"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Sign Up
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-12 pb-24 flex flex-col justify-center">
          <div className="max-w-3xl">
            <h1 className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.5rem] leading-[0.95] font-black tracking-tighter uppercase relative z-20">
              <span className="text-slate-400/90">Solving Legal</span> <br />
              <span className="text-slate-600/90">Matters With</span> <br />
              <span className="text-white shadow-sm">Confidence</span>
            </h1>
            <p className="mt-8 text-slate-400 text-lg sm:text-xl max-w-sm leading-relaxed font-medium relative z-20 mb-14">
              A Dedicated Legal Team Committed to Protecting Your Rights and Securing Your Future
            </p>

            {/* Repositioned Bottom Left Card - Now in Flow for better spacing */}
            <div className="hidden lg:block w-[400px] bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] relative z-20 shadow-[0_20px_50px_rgb(0,0,0,0.3)] hover:border-white/20 transition-all duration-500 group">
              <div className="flex items-center gap-8">
                <div className="w-28 h-28 bg-slate-800 rounded-3xl overflow-hidden relative shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" alt="Lawyer" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-full text-white shadow-xl">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-white text-[16px] leading-tight tracking-wider uppercase mb-4">PROTECTING EVERY <br /> DEAL YOU MAKE</h4>
                  <a href="#" className="text-xs font-bold text-slate-400 tracking-widest underline hover:text-white transition-colors uppercase">Get Started</a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Stakeholder Roles */}
      <section className="bg-[#070b14] py-32 relative z-20 overflow-hidden">
        {/* Subtle IT-standard dark background image */}
        <div
          className="absolute inset-0 z-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: "url('/ecosystem-dark-bg.png')" }}
        ></div>
        <div className="max-w-7xl mx-auto px-8 mb-20 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">A Unified Ecosystem</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Tailored professional experiences for every pillar of the digital legal system.</p>
          </div>
        </div>

        <div
          className="w-full relative h-[400px] flex items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Edge gradients to mask the sliding elements elegantly */}
          <div className="absolute inset-y-0 left-0 w-[15%] lg:w-1/4 bg-gradient-to-r from-slate-900 to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-[15%] lg:w-1/4 bg-gradient-to-l from-slate-900 to-transparent z-20 pointer-events-none"></div>

          <div
            className="absolute left-0 w-full flex items-center transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(calc(50% - ${160 + activePillar * 352}px))` }}
          >
            {[
              { role: 'Citizens', icon: Users, desc: 'File cases, generate legal notices, and track progress effortlessly.', image: '/citizen-role-v2.png' },
              { role: 'Police', icon: Shield, desc: 'Digital FIR management and evidence tracking for law enforcement.', image: '/police-role-v2.png' },
              { role: 'Lawyers', icon: MessageSquare, desc: 'Seamless communication with clients and case file management.', image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=800' },
              { role: 'Judges', icon: Gavel, desc: 'Advanced analytics and organized case review for faster verdicts.', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800' },
            ].map((item, index) => {
              const isActive = activePillar === index;
              return (
                <div
                  key={item.role}
                  className={`w-[320px] mx-[16px] shrink-0 p-10 rounded-[2rem] border transition-all duration-1000 transform cursor-pointer relative group overflow-hidden ${isActive
                    ? 'shadow-[0_0_60px_rgba(79,70,229,0.4)] border-indigo-500 scale-110 z-10 opacity-100'
                    : 'bg-slate-800/40 border-slate-700/50 scale-90 z-0 opacity-80 hover:opacity-100'
                    }`}
                  onClick={() => setActivePillar(index)}
                >
                  {/* Background Image Layer (Permanent) */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={item.image}
                      alt={item.role}
                      className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-slate-900/60 to-slate-900/90"></div>
                  </div>

                  {/* Content Layer */}
                  <div className="relative z-10">
                    {/* Background glow effect for active item */}
                    <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur-xl transition-opacity duration-1000 -z-10 ${isActive ? 'opacity-30' : 'opacity-0'}`}></div>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-1000 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.6)]' : 'bg-slate-800/90 text-slate-400 border border-white/10'}`}>
                      <item.icon size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-4 transition-colors duration-1000 ${isActive ? 'text-white' : 'text-slate-200'}`}>{item.role}</h3>
                    <p className={`text-sm leading-relaxed transition-colors duration-1000 ${isActive ? 'text-indigo-100/90' : 'text-slate-400 font-medium'}`}>{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-[#050810] text-slate-400 py-24 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col gap-16">
          {/* Quick Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'FAQ', icon: HelpCircle, desc: 'Common legal questions', path: '/faq' },
              { label: 'Help Centre', icon: LifeBuoy, desc: 'Technical & legal support', path: '#' },
              { label: 'Account', icon: User, desc: 'Your case dashboard', path: '/login' },
              { label: 'Contact Us', icon: Mail, desc: 'Direct communication', path: '/contact' },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => item.path !== '#' && navigate(item.path)}
                className={`group relative aspect-[2.4/1] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.08] hover:border-orange-500/30 transition-all duration-500 overflow-hidden ${item.path !== '#' ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Accent Glow */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-900/50 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:border-orange-500/20 transition-all duration-500">
                  <item.icon size={20} strokeWidth={1.5} />
                </div>

                <div className="min-w-0">
                  <h4 className="text-white font-bold text-xs tracking-wide uppercase truncate">{item.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium group-hover:text-slate-400 transition-colors uppercase tracking-tight truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-8">
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap w-[24px] h-[24px] gap-[2px]">
                <div className="w-[11px] h-[11px] bg-orange-600 rounded-sm"></div>
                <div className="w-[11px] h-[11px] bg-orange-500 rounded-sm"></div>
                <div className="w-[11px] h-[11px] bg-orange-400 rounded-sm"></div>
                <div className="w-[11px] h-[11px] bg-transparent rounded-sm"></div>
              </div>
              <span className="text-sm font-bold text-white tracking-widest uppercase opacity-60">Nyayasarthi</span>
            </div>

            <p className="text-[13px] font-medium opacity-50">© 2026 Nyayasarthi. Making legal services accessible to every citizen.</p>

            <div className="flex gap-8">
              <a href="#" className="text-[11px] font-bold uppercase tracking-widest hover:text-white transition">Privacy Policy</a>
              <a href="#" className="text-[11px] font-bold uppercase tracking-widest hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};