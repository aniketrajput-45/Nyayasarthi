import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Gavel, Users, MessageSquare, ChevronRight, LucideIcon } from 'lucide-react';

function RoleBlock({
  src,
  label,
  alt,
  heightClass,
  Icon,
  gradient,
}: {
  src: string;
  label: string;
  alt: string;
  heightClass: string;
  Icon: LucideIcon;
  gradient: string;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className={`${heightClass} rounded-2xl overflow-hidden shadow-xl border border-slate-200 relative group`}>
      {!imgError ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`w-full h-full ${gradient} flex items-center justify-center`}>
          <Icon className="w-20 h-20 text-white/90" strokeWidth={1.5} />
        </div>
      )}
      <div className="absolute inset-0 bg-slate-900/40 flex items-end p-4">
        <span className="text-white font-bold text-lg tracking-wide">{label}</span>
      </div>
    </div>
  );
}

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/nyayasarthi-logo.png" alt="Nayayasarthi Court of Justice" className="h-24 w-auto object-contain" />
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Nyayasarthi</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-slate-600 hover:text-indigo-600 font-medium transition"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative px-8 py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Digital Legal Revolution
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-tight">
              Justice for All, <br />
              <span className="text-indigo-600 underline decoration-indigo-200">Simplified.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
              Empowering citizens and legal professionals with an AI-driven platform for seamless case management, legal notice generation, and real-time analytics.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition transform hover:-translate-y-1"
              >
                Start Your Journey <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="relative">
             <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
             <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl transform rotate-2 hover:rotate-0 transition duration-500">
                <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                  <div className="flex gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-4 w-full bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-32 w-full bg-indigo-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-sm">
                      Processing Legal Analytics...
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* Stakeholder Roles */}
      <section className="bg-slate-50 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">A Unified Ecosystem</h2>
            <p className="text-slate-600">Tailored experiences for every pillar of the legal system.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { role: 'Citizens', icon: Users, desc: 'File cases, generate legal notices, and track progress effortlessly.' },
              { role: 'Police', icon: Shield, desc: 'Digital FIR management and evidence tracking for law enforcement.' },
              { role: 'Lawyers', icon: MessageSquare, desc: 'Seamless communication with clients and case file management.' },
              { role: 'Judges', icon: Gavel, desc: 'Advanced analytics and organized case review for faster verdicts.' },
            ].map((item) => (
              <div key={item.role} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition group">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.role}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
            {/* Top-Left: Judge | Top-Right: Lawyer | Bottom-Left: Police | Bottom-Right: Citizen */}
            <div className="space-y-4">
              <RoleBlock
                src="https://unsplash.com/photos/e11Oa3kvx4c/download?force=true&w=800"
                label="Judge"
                alt="Judge - Justice"
                heightClass="h-48"
                Icon={Gavel}
                gradient="bg-gradient-to-br from-amber-800 to-slate-800"
              />
              <RoleBlock
                src="/police-role.png"
                label="Police"
                alt="Police - Law enforcement"
                heightClass="h-64"
                Icon={Shield}
                gradient="bg-gradient-to-br from-slate-700 to-slate-900"
              />
            </div>
            <div className="space-y-4 pt-8">
              <RoleBlock
                src="https://unsplash.com/photos/zeH-ljawHtg/download?force=true&w=800"
                label="Lawyer"
                alt="Lawyer - Legal counsel"
                heightClass="h-64"
                Icon={MessageSquare}
                gradient="bg-gradient-to-br from-indigo-800 to-slate-800"
              />
              <RoleBlock
                src="https://unsplash.com/photos/ABGaVhJxwDQ/download?force=true&w=800"
                label="Citizen"
                alt="Citizen - Justice for all"
                heightClass="h-48"
                Icon={Users}
                gradient="bg-gradient-to-br from-teal-800 to-slate-800"
              />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-slate-900 italic">"The power of law, at your fingertips."</h2>
            <p className="text-lg text-slate-600">
              Our platform bridges the gap between technology and the legal system. 
              Whether it's managing complex case details or using our integrated chatbot for guidance, 
              we ensure transparency and efficiency.
            </p>
            <ul className="space-y-4">
              {['Digital Case Filing', 'Real-time Notifications', 'Secure Chat System', 'Legal Notice Generator'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center">✓</div>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          {/* <div className="flex items-center gap-3 text-white">
            <img src="/nyayasarthi-logo.png" alt="Nayayasarthi Court of Justice" className="h-16 w-auto object-contain brightness-0 invert opacity-90" />
            <span className="text-xl font-bold">Nyayasarthi</span>
          </div> */}
          <p className="text-sm">© 2026 Justice Hub. Making legal services accessible to every citizen.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};