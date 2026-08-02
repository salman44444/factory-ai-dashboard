import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Cpu,
  ExternalLink,
  GitBranch,
  Radio,
  Shield,
  Sparkles,
  Zap,
  BarChart3,
  BrainCircuit,
  Server,
  AlertTriangle,
  ChevronRight,
  Database,
  Layers,
  Play,
} from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

const TECH_STACK = [
  { label: 'Python', color: '#3B82F6' },
  { label: 'FastAPI', color: '#10B981' },
  { label: 'React', color: '#61DAFB' },
  { label: 'TypeScript', color: '#3178C6' },
  { label: 'LangGraph', color: '#BF5AF2' },
  { label: 'Pinecone', color: '#00C4B4' },
  { label: 'PostgreSQL', color: '#336791' },
  { label: 'WebSockets', color: '#F59E0B' },
  { label: 'Recharts', color: '#FF6B6B' },
  { label: 'Docker', color: '#2496ED' },
];

const FEATURES = [
  {
    icon: Radio,
    accent: '#0A84FF',
    accentSubtle: 'rgba(10, 132, 255, 0.12)',
    title: 'Real-Time Telemetry',
    description: 'Persistent WebSocket stream delivers sensor data every second — temperature, RPM, torque, and tool wear — visualised live on Recharts time-series charts.',
    bullets: ['Sub-second latency', 'Multi-machine fleet view', 'CSV export'],
  },
  {
    icon: BrainCircuit,
    accent: '#BF5AF2',
    accentSubtle: 'rgba(191, 90, 242, 0.12)',
    title: 'LangGraph RAG Copilot',
    description: 'LangGraph orchestrates a 3-node workflow: retrieve live SQL metrics → query Pinecone PDF manual embeddings → synthesise root-cause diagnosis.',
    bullets: ['Pinecone vector search', 'Manual PDF grounding', 'Structured JSON output'],
  },
  {
    icon: AlertTriangle,
    accent: '#FF9F0A',
    accentSubtle: 'rgba(255, 159, 10, 0.12)',
    title: 'Anomaly Detection',
    description: 'Rule-based threshold engine flags Heat Dissipation, Power, Tool Wear, and Overstrain failures the moment they appear in the telemetry stream.',
    bullets: ['4 failure categories', 'Alert resolution workflow', 'Failure context replay'],
  },
  {
    icon: BarChart3,
    accent: '#30D158',
    accentSubtle: 'rgba(48, 209, 88, 0.12)',
    title: 'Fleet Management',
    description: 'Manage an entire factory floor from one dashboard. Search, filter by grade, and drill into any machine with a single click.',
    bullets: ['Grade L / M / H filter', 'Per-machine history', 'Status-aware UI'],
  },
  {
    icon: Database,
    accent: '#64D2FF',
    accentSubtle: 'rgba(100, 210, 255, 0.12)',
    title: 'Simulator Engine',
    description: 'Built-in machine simulator lets you trigger any failure mode on demand — great for demoing AI diagnosis without physical hardware.',
    bullets: ['On-demand failure modes', 'Real-time state injection', 'Persistent telemetry history'],
  },
  {
    icon: Shield,
    accent: '#FF453A',
    accentSubtle: 'rgba(255, 69, 58, 0.12)',
    title: 'Apple HIG UI',
    description: 'Pixel-perfect Apple Human Interface Guidelines design with glassmorphism, dark/light/system themes, SF Pro typography, and smooth spring animations.',
    bullets: ['System-aware theming', 'Glassmorphism cards', 'Micro-animations'],
  },
];

const STEPS = [
  {
    number: '01',
    icon: Server,
    accent: '#0A84FF',
    title: 'Stream Sensor Data',
    description: 'Machine telemetry is streamed live via WebSocket and stored in PostgreSQL.',
  },
  {
    number: '02',
    icon: AlertTriangle,
    accent: '#FF9F0A',
    title: 'Detect Anomalies',
    description: 'Threshold rules flag failures in real time and surface alerts to the operator.',
  },
  {
    number: '03',
    icon: Sparkles,
    accent: '#BF5AF2',
    title: 'AI Root-Cause Diagnosis',
    description: 'LangGraph RAG copilot cross-references live metrics with PDF manuals to generate a detailed explanation.',
  },
];

export default function LandingPage({ onLaunch }: LandingPageProps) {
  const machineCounter  = useCounter(500);
  const readingsCounter = useCounter(2000);
  const uptimeCounter   = useCounter(99);

  const revealRefs = useRef<HTMLElement[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => {
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(32px)';
        el.style.transition = 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  const heroBarHeights = [45, 52, 48, 62, 55, 70, 65, 58, 72, 68, 80, 75, 85, 78, 90, 82, 95, 88, 72, 65, 78, 85, 92, 88, 75, 68, 80, 85, 90, 95, 88, 72, 78, 85, 92, 88, 75, 82, 90, 85];

  return (
    <div className="landing-gradient-bg text-white font-sans antialiased overflow-x-hidden">

      {/* NAV */}
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:50,padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',background:'rgba(10,10,15,0.72)',borderBottom:'1px solid rgba(255,255,255,0.06)' }} className="animate-fade-in">
        <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
          <div style={{ background:'linear-gradient(135deg,#0A84FF 0%,#5E5CE6 100%)',borderRadius:'10px',padding:'7px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 12px rgba(10,132,255,0.4)' }}>
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontWeight:800,fontSize:'16px',letterSpacing:'-0.02em',background:'linear-gradient(135deg,#fff 0%,#64D2FF 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>AeroForge AI</span>
            <div style={{ fontSize:'10px',color:'rgba(255,255,255,0.45)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginTop:'1px' }}>Factory Monitoring</div>
          </div>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
          <a href="https://github.com/salman44444/factory-ai-dashboard" target="_blank" rel="noopener noreferrer" className="landing-secondary-btn" style={{ padding:'8px 16px',fontSize:'13px' }}>
            <GitBranch size={14} />GitHub
          </a>
          <button onClick={onLaunch} className="landing-cta-btn" style={{ padding:'9px 20px',fontSize:'13px' }} id="nav-launch-btn">
            Launch Dashboard<ChevronRight size={14} />
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position:'relative',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 24px 80px',overflow:'hidden' }}>
        <div className="hero-glow hero-glow-blue" />
        <div className="hero-glow hero-glow-purple" />
        <div className="hero-glow hero-glow-cyan" />
        <div className="hero-noise" />
        <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none' }} />

        {/* Live pill */}
        <div className="animate-fade-up" style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',borderRadius:'9999px',background:'rgba(48,209,88,0.10)',border:'1px solid rgba(48,209,88,0.25)',marginBottom:'28px',animationDelay:'0.1s' }}>
          <span style={{ position:'relative',display:'inline-flex' }}>
            <span style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#30D158',display:'block' }} />
            <span className="animate-ping-slow" style={{ position:'absolute',inset:0,borderRadius:'50%',background:'#30D158',opacity:0.4 }} />
          </span>
          <span style={{ fontSize:'11px',fontWeight:700,color:'#30D158',letterSpacing:'0.06em',textTransform:'uppercase' }}>Portfolio Project · AI Showcase</span>
        </div>

        {/* Heading */}
        <h1 className="animate-fade-up" style={{ fontSize:'clamp(2.8rem,7vw,5.5rem)',fontWeight:900,letterSpacing:'-0.04em',lineHeight:1.05,maxWidth:'900px',marginBottom:'24px',animationDelay:'0.2s' }}>
          <span className="gradient-text">AI-Powered</span><br />
          <span style={{ color:'rgba(255,255,255,0.95)' }}>Factory Monitoring</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up" style={{ fontSize:'clamp(1rem,2vw,1.2rem)',color:'rgba(255,255,255,0.55)',maxWidth:'600px',lineHeight:1.7,marginBottom:'44px',animationDelay:'0.3s' }}>
          Real-time industrial telemetry streaming via WebSockets, anomaly detection, and a{' '}
          <span style={{ color:'#64D2FF',fontWeight:600 }}>LangGraph RAG copilot</span> that
          cross-references live sensor data with PDF equipment manuals for instant root-cause diagnosis.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up" style={{ display:'flex',gap:'16px',flexWrap:'wrap',justifyContent:'center',animationDelay:'0.4s' }}>
          <button onClick={onLaunch} className="landing-cta-btn" id="hero-launch-btn">
            <Play size={16} fill="white" strokeWidth={0} />Launch Dashboard<ArrowRight size={16} />
          </button>
          <a href="https://github.com/salman44444/factory-ai-dashboard" target="_blank" rel="noopener noreferrer" className="landing-secondary-btn">
            <GitBranch size={16} />View on GitHub<ExternalLink size={14} style={{ opacity:0.6 }} />
          </a>
        </div>

        {/* Dashboard mockup */}
        <div className="animate-fade-up" style={{ marginTop:'72px',position:'relative',maxWidth:'900px',width:'100%',animationDelay:'0.55s' }}>
          <div style={{ position:'absolute',inset:'-20px',background:'radial-gradient(ellipse at center,rgba(10,132,255,0.15) 0%,transparent 70%)',borderRadius:'32px',filter:'blur(20px)' }} />
          <div style={{ position:'relative',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:'24px',padding:'24px',backdropFilter:'blur(20px)',overflow:'hidden' }}>
            {/* Title bar */}
            <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'20px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width:'10px',height:'10px',borderRadius:'50%',background:'#FF453A' }} />
              <div style={{ width:'10px',height:'10px',borderRadius:'50%',background:'#FF9F0A' }} />
              <div style={{ width:'10px',height:'10px',borderRadius:'50%',background:'#30D158' }} />
              <span style={{ fontSize:'12px',color:'rgba(255,255,255,0.35)',marginLeft:'8px',fontFamily:'monospace' }}>AeroForge AI — Factory Monitoring &amp; Anomaly Center</span>
            </div>
            {/* Metric cards */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'16px' }}>
              {[
                { label:'Total Assets',value:'500',color:'#BF5AF2' },
                { label:'Operational',value:'487',color:'#30D158' },
                { label:'Warnings',value:'8',color:'#FF9F0A' },
                { label:'Failures',value:'5',color:'#FF453A' },
                { label:'Active Incidents',value:'13',color:'#64D2FF' },
              ].map((m) => (
                <div key={m.label} style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'12px',textAlign:'center' }}>
                  <div style={{ fontSize:'20px',fontWeight:800,color:m.color }}>{m.value}</div>
                  <div style={{ fontSize:'10px',color:'rgba(255,255,255,0.40)',marginTop:'4px' }}>{m.label}</div>
                </div>
              ))}
            </div>
            {/* Fake chart */}
            <div style={{ background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',height:'120px',display:'flex',alignItems:'flex-end',padding:'12px 16px 16px',gap:'4px',overflow:'hidden' }}>
              {heroBarHeights.map((h, i) => (
                <div key={i} style={{ flex:1,height:`${h}%`,borderRadius:'3px 3px 0 0',background:h > 88 ? 'rgba(255,69,58,0.7)' : `rgba(10,132,255,${0.3+(h/100)*0.5})` }} />
              ))}
            </div>
            {/* AI badge */}
            <div style={{ display:'flex',justifyContent:'flex-end',marginTop:'12px' }}>
              <div style={{ display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'9999px',background:'rgba(191,90,242,0.15)',border:'1px solid rgba(191,90,242,0.3)',fontSize:'11px',fontWeight:700,color:'#BF5AF2' }}>
                <Sparkles size={11} />LangGraph RAG Copilot Active
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="animate-float" style={{ marginTop:'48px',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',color:'rgba(255,255,255,0.25)',fontSize:'11px',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase' }}>
          <span>Scroll to explore</span>
          <div style={{ width:'1px',height:'32px',background:'linear-gradient(to bottom,rgba(255,255,255,0.25),transparent)' }} />
        </div>
      </section>

      {/* STATS BAR */}
      <div className="divider-glow" />
      <section style={{ padding:'64px 24px',maxWidth:'900px',margin:'0 auto' }}>
        <div ref={machineCounter.ref} style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'32px',textAlign:'center' }}>
          {[
            { countRef: machineCounter, suffix:'+', label:'Machines Monitored', sublabel:'Simulated factory floor' },
            { countRef: readingsCounter, suffix:'/s', label:'Sensor Readings', sublabel:'Via persistent WebSocket' },
            { countRef: uptimeCounter, suffix:'%', label:'AI Diagnosis Accuracy', sublabel:'On labeled test dataset' },
          ].map(({ countRef, suffix, label, sublabel }) => (
            <div key={label}>
              <div className="stats-number">{countRef.count}{suffix}</div>
              <div style={{ fontSize:'14px',fontWeight:600,color:'rgba(255,255,255,0.70)',marginTop:'8px' }}>{label}</div>
              <div style={{ fontSize:'12px',color:'rgba(255,255,255,0.35)',marginTop:'4px' }}>{sublabel}</div>
            </div>
          ))}
        </div>
      </section>
      <div className="divider-glow" />

      {/* HOW IT WORKS */}
      <section style={{ padding:'100px 24px',maxWidth:'1100px',margin:'0 auto' }} ref={addRevealRef}>
        <div style={{ textAlign:'center',marginBottom:'64px' }}>
          <div className="section-label" style={{ justifyContent:'center' }}><Zap size={10} />How It Works</div>
          <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.95)' }}>
            From raw sensor data to <span className="gradient-text-blue">AI diagnosis</span><br />in seconds
          </h2>
        </div>
        <div style={{ display:'flex',alignItems:'flex-start',flexWrap:'wrap',justifyContent:'center' }}>
          {STEPS.map((step, idx) => (
            <div key={step.number} style={{ display:'flex',alignItems:'flex-start',flex:1,minWidth:'200px',maxWidth:'340px' }}>
              <div style={{ flex:1,textAlign:'center',padding:'0 16px' }} ref={addRevealRef}>
                <div style={{ width:'72px',height:'72px',borderRadius:'20px',background:`rgba(${step.accent==='#0A84FF'?'10,132,255':step.accent==='#FF9F0A'?'255,159,10':'191,90,242'},0.12)`,border:`1px solid ${step.accent}40`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',position:'relative' }}>
                  <step.icon size={28} color={step.accent} strokeWidth={1.5} />
                  <div style={{ position:'absolute',top:'-10px',right:'-10px',width:'24px',height:'24px',borderRadius:'50%',background:step.accent,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:800,color:'white' }}>{idx+1}</div>
                </div>
                <h3 style={{ fontSize:'17px',fontWeight:700,color:'rgba(255,255,255,0.92)',marginBottom:'10px' }}>{step.title}</h3>
                <p style={{ fontSize:'13px',color:'rgba(255,255,255,0.50)',lineHeight:1.7 }}>{step.description}</p>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{ paddingTop:'36px',display:'flex',alignItems:'center',color:'rgba(255,255,255,0.15)',flexShrink:0 }}>
                  <ChevronRight size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="divider-glow" />

      {/* FEATURES */}
      <section style={{ padding:'100px 24px',maxWidth:'1200px',margin:'0 auto' }}>
        <div style={{ textAlign:'center',marginBottom:'64px' }} ref={addRevealRef}>
          <div className="section-label" style={{ justifyContent:'center' }}><Layers size={10} />Core Features</div>
          <h2 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.95)' }}>
            Everything you need to showcase<br /><span className="gradient-text">full-stack AI engineering</span>
          </h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:'20px' }}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="landing-card" ref={addRevealRef} style={{ padding:'28px' }}>
              <div style={{ width:'48px',height:'48px',borderRadius:'14px',background:feature.accentSubtle,border:`1px solid ${feature.accent}30`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'20px' }}>
                <feature.icon size={22} color={feature.accent} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize:'17px',fontWeight:700,color:'rgba(255,255,255,0.92)',marginBottom:'10px' }}>{feature.title}</h3>
              <p style={{ fontSize:'13px',color:'rgba(255,255,255,0.50)',lineHeight:1.7,marginBottom:'20px' }}>{feature.description}</p>
              <ul style={{ listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'6px' }}>
                {feature.bullets.map((b) => (
                  <li key={b} style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'rgba(255,255,255,0.55)' }}>
                    <span style={{ width:'5px',height:'5px',borderRadius:'50%',background:feature.accent,flexShrink:0 }} />{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="divider-glow" />

      {/* TECH STACK */}
      <section style={{ padding:'80px 24px',maxWidth:'900px',margin:'0 auto',textAlign:'center' }} ref={addRevealRef}>
        <div className="section-label" style={{ justifyContent:'center' }}><Cpu size={10} />Tech Stack</div>
        <h2 style={{ fontSize:'clamp(1.5rem,3vw,2.2rem)',fontWeight:800,letterSpacing:'-0.03em',color:'rgba(255,255,255,0.90)',marginBottom:'40px' }}>Built with production-grade tools</h2>
        <div style={{ display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center' }}>
          {TECH_STACK.map((tech) => (
            <span key={tech.label} className="tech-badge">
              <span style={{ width:'6px',height:'6px',borderRadius:'50%',background:tech.color,flexShrink:0 }} />{tech.label}
            </span>
          ))}
        </div>
      </section>

      <div className="divider-glow" />

      {/* BOTTOM CTA */}
      <section style={{ padding:'100px 24px',textAlign:'center',position:'relative',overflow:'hidden' }} ref={addRevealRef}>
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'600px',height:'400px',background:'radial-gradient(ellipse at center,rgba(10,132,255,0.12) 0%,transparent 70%)',pointerEvents:'none' }} />
        <div className="section-label" style={{ justifyContent:'center' }}><Sparkles size={10} />Ready to Explore?</div>
        <h2 style={{ fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:900,letterSpacing:'-0.04em',color:'rgba(255,255,255,0.95)',marginBottom:'20px',lineHeight:1.1 }}>
          See the AI copilot<br /><span className="gradient-text">diagnose a failure live</span>
        </h2>
        <p style={{ fontSize:'16px',color:'rgba(255,255,255,0.50)',maxWidth:'480px',margin:'0 auto 44px',lineHeight:1.7 }}>
          Use the simulator to trigger a failure, watch it surface in real-time, then let the LangGraph RAG copilot explain exactly why it happened.
        </p>
        <div style={{ display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={onLaunch} className="landing-cta-btn" id="bottom-launch-btn" style={{ padding:'16px 36px',fontSize:'16px' }}>
            <Play size={18} fill="white" strokeWidth={0} />Launch Dashboard<ArrowRight size={18} />
          </button>
          <a href="https://github.com/salman44444/factory-ai-dashboard" target="_blank" rel="noopener noreferrer" className="landing-secondary-btn" style={{ padding:'15px 28px',fontSize:'16px' }}>
            <GitBranch size={18} />Source Code
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)',padding:'32px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px',maxWidth:'1200px',margin:'0 auto' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
          <div style={{ background:'linear-gradient(135deg,#0A84FF 0%,#5E5CE6 100%)',borderRadius:'8px',padding:'5px',display:'flex' }}><Activity size={14} /></div>
          <span style={{ fontSize:'13px',fontWeight:600,color:'rgba(255,255,255,0.50)' }}>AeroForge AI · Factory Monitoring Dashboard</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'20px',fontSize:'12px',color:'rgba(255,255,255,0.35)' }}>
          <span>© 2026 · Portfolio Project</span>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
          <span>Built with FastAPI, LangGraph, React</span>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
          <a href="https://github.com/salman44444/factory-ai-dashboard" target="_blank" rel="noopener noreferrer" style={{ display:'flex',alignItems:'center',gap:'4px',color:'rgba(255,255,255,0.45)',textDecoration:'none',transition:'color 180ms ease' }} onMouseOver={(e)=>(e.currentTarget.style.color='rgba(255,255,255,0.80)')} onMouseOut={(e)=>(e.currentTarget.style.color='rgba(255,255,255,0.45)')}>
            <GitBranch size={12} />GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
