import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Gavel, Users, MessageSquare, ChevronRight, LucideIcon, ArrowUpRight, Globe, ChevronDown, Instagram, Facebook, Twitter } from 'lucide-react';

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
  const [activePillar, setActivePillar] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActivePillar((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="min-h-screen bg-[#e8e9eb] font-sans overflow-x-hidden selection:bg-orange-500/30">
      {/* Hero Container */}
      <div className="relative min-h-screen flex flex-col">
        {/* Lady Justice Background Image */}
        <div className="absolute top-0 right-[-10%] sm:right-0 w-[120%] sm:w-full lg:w-[65%] h-[60%] sm:h-[80%] lg:h-[110%] bottom-[-10%] z-0 pointer-events-none opacity-90 lg:opacity-100 animate-float">
          <div
            className="absolute inset-0 bg-contain bg-no-repeat bg-[center_top] lg:bg-[center_right] lg:mr-10"
            style={{
              backgroundImage: "url('/futuristic-classic.png')",
              mixBlendMode: 'multiply',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
              maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
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
            <span className="text-xl font-bold text-slate-900 tracking-tight">Nyayasarthi Law</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-700 bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-white/50 shadow-sm">
            <a href="#" className="hover:text-black transition">Home</a>
            <a href="#" className="hover:text-black transition">About</a>
            <div className="flex items-center gap-1 cursor-pointer hover:text-black transition">
              Services <ChevronDown size={14} />
            </div>
            <a href="#" className="hover:text-black transition">Solution</a>
            <div className="flex items-center gap-1 cursor-pointer hover:text-black transition ml-2 pl-4 border-l border-slate-300">
              <Globe size={16} className="text-slate-500" /> English <ChevronDown size={14} />
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="bg-[#0a0a0a] text-white px-7 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 transition shadow-xl"
          >
            Login / Register
          </button>
        </nav>

        {/* Hero Content */}
        <main className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-12 pt-12 pb-24 flex flex-col justify-center">
          <div className="max-w-3xl">
            <h1 className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.5rem] leading-[0.95] font-black text-slate-800 tracking-tighter uppercase relative z-20 mix-blend-color-burn">
              <span className="text-slate-600/90">Solving Legal</span> <br />
              <span className="text-slate-700/90">Matters With</span> <br />
              <span className="text-slate-900">Confidence</span>
            </h1>
            <p className="mt-8 text-slate-600 text-lg sm:text-xl max-w-sm leading-relaxed font-medium relative z-20">
              A Dedicated Legal Team Committed to Protecting Your Rights and Securing Your Future
            </p>


          </div>

          {/* Desktop Overlay Elements */}
          <div className="hidden lg:block">
            {/* Top Right: 28K */}
            {/* <div className="absolute top-16 right-16 text-right">
              <div className="text-[4rem] leading-none font-light text-slate-800 mb-2">28K</div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <div className="flex -space-x-4">
                  <img className="w-12 h-12 rounded-full border-2 border-[#e8e9eb] object-cover relative z-30" src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
                  <img className="w-12 h-12 rounded-full border-2 border-[#e8e9eb] object-cover relative z-20" src="https://i.pravatar.cc/100?img=5" alt="Avatar" />
                  <img className="w-12 h-12 rounded-full border-2 border-[#e8e9eb] object-cover relative z-10" src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
                </div>
                <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition border border-white/80 relative z-0">
                  <ArrowUpRight size={20} className="text-slate-800" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mt-4 max-w-[180px] ml-auto leading-snug font-medium">
                Partner with us as we protect your rights
              </p>
            </div> */}

            {/* Bottom Left Card */}
            <div className="absolute bottom-12 left-12 w-[340px] bg-white/40 backdrop-blur-2xl border border-white/60 p-4 rounded-3xl flex items-center gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden relative shrink-0">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" alt="Lawyer" className="w-full h-full object-cover" />
                <div className="absolute top-1.5 right-1.5 bg-white p-1 rounded-full text-slate-800 shadow-md">
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-[15px] leading-tight tracking-wide">PROTECTING EVERY <br /> DEAL YOU MAKE</h4>
                <a href="#" className="text-xs font-bold text-slate-900 tracking-wider underline mt-4 inline-block hover:text-orange-600 transition uppercase">Get Started</a>
              </div>
            </div>



            {/* Bottom Right Chart Card */}
            <div className="absolute bottom-12 right-16 w-[360px] bg-white/60 backdrop-blur-2xl border border-white/70 p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] animate-float z-30 pointer-events-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-medium text-slate-800 text-[15px]">Case Closure Statistics</h3>
                <button className="bg-white px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50 transition">
                  Yearly <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex items-end gap-[10px] h-32">
                {[30, 40, 60, 50, 40, 55, 80].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group cursor-pointer relative h-full justify-end">
                    {/* Floating Tooltip */}
                    <div className="absolute bottom-[calc(100%-10px)] mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-[11px] font-bold text-orange-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm z-10 whitespace-nowrap">
                      {val}k
                    </div>
                    <div className="w-full bg-[#cbd5e1] rounded-t-sm rounded-b-[4px] relative grow-0 transition-all duration-300 group-hover:bg-[#4a4a4a] group-hover:shadow-lg" style={{ height: `${val}%` }}></div>
                    <span className="text-[11px] text-slate-500 font-medium tracking-wide transition-colors group-hover:text-slate-900">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Stakeholder Roles */}
      <section className="bg-slate-900 py-32 relative z-20 overflow-hidden">
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
              { role: 'Citizens', icon: Users, desc: 'File cases, generate legal notices, and track progress effortlessly.' },
              { role: 'Police', icon: Shield, desc: 'Digital FIR management and evidence tracking for law enforcement.' },
              { role: 'Lawyers', icon: MessageSquare, desc: 'Seamless communication with clients and case file management.' },
              { role: 'Judges', icon: Gavel, desc: 'Advanced analytics and organized case review for faster verdicts.' },
            ].map((item, index) => {
              const isActive = activePillar === index;
              return (
                <div
                  key={item.role}
                  className={`w-[320px] mx-[16px] shrink-0 p-10 rounded-[2rem] border transition-all duration-1000 transform cursor-pointer relative group ${isActive
                      ? 'bg-gradient-to-b from-indigo-900/80 to-slate-900 shadow-[0_0_60px_rgba(79,70,229,0.4)] border-indigo-500 scale-110 z-10 opacity-100'
                      : 'bg-slate-800/40 border-slate-700/50 scale-90 z-0 opacity-40 hover:opacity-70'
                    }`}
                  onClick={() => setActivePillar(index)}
                >
                  {/* Background glow effect for active item */}
                  <div className={`absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2rem] blur-xl transition-opacity duration-1000 -z-10 ${isActive ? 'opacity-30' : 'opacity-0'}`}></div>

                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-1000 ${isActive ? 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.6)]' : 'bg-slate-800 text-slate-400'}`}>
                    <item.icon size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 transition-colors duration-1000 ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.role}</h3>
                  <p className={`text-sm leading-relaxed transition-colors duration-1000 ${isActive ? 'text-indigo-100/80' : 'text-slate-500'}`}>{item.desc}</p>
                </div>
              )
            })}
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