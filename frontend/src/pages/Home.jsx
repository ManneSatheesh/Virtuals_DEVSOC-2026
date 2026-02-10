import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic,
  Brain,
  Bell,
  Shield,
  ArrowRight,
  MessageCircle,
  Heart,
  Sparkles,
  Users,
  Lock,
  Zap,
  CheckCircle,
} from 'lucide-react';
import './Home.css';

export default function Home() {
  // New Hero Chat State
  const [messages, setMessages] = useState([
    { type: 'user', text: "I don’t know where to share my feelings." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const typingIntervalRef = useRef(null);

  useEffect(() => {
    // Initial greeting animation
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      simulateTyping("I’m here for you.\nIn a world that moves fast, everyone deserves a presence that listens.\nI’m built not just with code — but with compassion.");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Cleanup typing interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const simulateTyping = (fullText) => {
    let index = 0;
    // Add empty message first
    setMessages(prev => [...prev, { type: 'ai', text: '' }]);

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    typingIntervalRef.current = setInterval(() => {
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastMsgIndex = newMsgs.length - 1;
        // Only update if the last message is indeed the one we just added (safety check)
        if (newMsgs[lastMsgIndex].type === 'ai') {
          newMsgs[lastMsgIndex] = {
            ...newMsgs[lastMsgIndex],
            text: fullText.substring(0, index + 1)
          };
        }
        return newMsgs;
      });
      index++;
      if (index === fullText.length) {
        clearInterval(typingIntervalRef.current);
      }
    }, 30); // Typing speed
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text: inputValue }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      simulateTyping("Thank you for sharing. I’m here to listen. Would you like to talk about what you’re feeling right now?");
    }, 1500);
  };

  return (
    <div className="overflow-hidden">
      {/* ─── NEW HERO SECTION ─── */}
      <section className="hero-wrapper">
        <header>
          <div className="brand">
            <img
              src="/logo.jpeg"
              alt="Aura Companion"
              style={{ height: '120px', width: 'auto', borderRadius: '24px', objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 600, letterSpacing: '-0.5px', fontSize: '36px', color: '#3A393C', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span><span style={{ color: '#F46C09' }}>A</span>ura</span>
              <span><span style={{ color: '#F46C09' }}>C</span>ompanion</span>
            </span>
          </div>
          <nav aria-label="main">
            <Link to="/login" className="btn ghost">Log in</Link>
          </nav>
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <h1>A gentle space to share, reflect, and feel understood.</h1>
            <p>No one should ever feel alone — even in a digital world. Through compassionate AI, we create spaces where technology listens, understands, and stands beside every human journey.</p>
            <div className="hero-actions">
              <Link to="/ai-interaction" className="btn primary">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a href="#how-it-works" className="btn ghost">See How It Works</a>
            </div>
          </div>

          <div className="hero-bot-wrap">
            <div className="hero-glow" aria-hidden="true"></div>
            <div className="bot-card" role="region" aria-label="AI assistant chat preview">
              <div className="bot-card-header">
                <div className="flex items-center gap-3">
                  <div className="bot-avatar" aria-hidden="true">
                    <svg viewBox="0 0 48 48">
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F46C09" />
                          <stop offset="100%" stopColor="#F97707" />
                        </linearGradient>
                      </defs>
                      <circle cx="24" cy="24" r="22" fill="url(#g)" />
                      <rect x="14" y="18" width="20" height="14" rx="7" fill="#fff" opacity=".92" />
                      <circle cx="20" cy="25" r="2.2" fill="#3A393C" />
                      <circle cx="28" cy="25" r="2.2" fill="#3A393C" />
                      <rect x="22.6" y="10.5" width="2.8" height="7.2" rx="1.2" fill="#fff" opacity=".98" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-sm">Aura AI</div>
                    <div className="bot-status"><span className="dot"></span> Active</div>
                  </div>
                </div>
              </div>

              <div className="bot-scroll" ref={scrollRef}>
                {messages.map((msg, i) => (
                  <div key={i} className={`bot-msg ${msg.type}`}>
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="bot-msg ai typing">
                    <span></span><span></span><span></span>
                  </div>
                )}
              </div>

              <form className="bot-input" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Share what’s on your mind…"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button className="send" type="submit">➤</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Badges ─── */}
      <section className="py-12 border-y border-orange-100 bg-white/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-text-muted">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <span className="font-semibold">End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold">10K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-semibold">Real-time AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block bg-accent-orange text-primary font-bold text-sm px-4 py-1.5 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-text-main">
              Everything you need for
              <span className="text-gradient"> mental well-being</span>
            </h2>
            <p className="mt-4 text-xl text-text-muted">
              Simple, meaningful support — no complicated controls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="Natural Voice Conversation"
              desc="Speak freely using your voice. Our AI listens attentively and responds with empathy."
              delay="delay-100"
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="Personalized Memory"
              desc="The system remembers your preferences and past conversations for meaningful support."
              delay="delay-200"
            />
            <FeatureCard
              icon={<Bell className="w-8 h-8" />}
              title="Gentle Reminders"
              desc="Receive supportive notifications tailored to your routine and well-being goals."
              delay="delay-300"
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 bg-accent-orange/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block bg-white text-primary font-bold text-sm px-4 py-1.5 rounded-full mb-4 shadow-warm">
              How It Works
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-text-main">
              Get started in <span className="text-gradient">3 easy steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              num="01"
              title="Sign Up Securely"
              desc="Create your account with Google or email. Your data is encrypted and private."
            />
            <StepCard
              num="02"
              title="Personalize Experience"
              desc="Answer a few questions to help us understand your preferences and routine."
            />
            <StepCard
              num="03"
              title="Start Talking"
              desc="Begin a voice conversation anytime. The AI listens, remembers, and adapts."
            />
          </div>
        </div>
      </section>

      {/* ─── About / Ethics ─── */}
      <section id="about" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-accent-orange text-primary font-bold text-sm px-4 py-1.5 rounded-full mb-4">
                About
              </span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-text-main leading-tight">
                Built with <span className="text-gradient">care</span> and responsibility
              </h2>
              <p className="mt-6 text-xl text-text-muted leading-relaxed">
                We believe technology should support mental well-being with empathy,
                privacy, and ethical design at its core.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  'Designed for emotional support only',
                  'No medical diagnosis or emergency decisions',
                  'User data handled with encryption',
                  'Consent-based, transparent interactions',
                  'AI trained on ethical guidelines',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-text-main font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 bg-gradient-to-r from-primary to-orange-400 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Ready to feel heard?
          </h2>
          <p className="mt-4 text-xl text-white/80 max-w-xl mx-auto">
            Start your journey to better mental well-being with your personal AI companion.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white text-primary px-10 py-4 rounded-full font-bold text-lg shadow-warm-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border-2 border-white/50 hover:border-white text-white px-10 py-4 rounded-full font-bold text-lg transition-all"
            >
              Learn More
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Components ─── */

function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div className={`group bg-white border-2 border-orange-100 rounded-[2rem] p-8 shadow-warm hover:shadow-warm-lg hover:-translate-y-2 transition-all animate-fade-in-up ${delay}`}>
      <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-400 rounded-2xl flex items-center justify-center text-white shadow-warm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="mt-6 text-xl font-bold text-text-main">{title}</h3>
      <p className="mt-3 text-text-muted leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="relative bg-white rounded-[2rem] p-8 shadow-warm border-2 border-orange-100 hover:shadow-warm-lg transition-all group">
      <span className="absolute -top-4 -left-2 text-6xl font-extrabold text-primary/10 group-hover:text-primary/20 transition-colors">
        {num}
      </span>
      <div className="relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-warm">
          {num.replace('0', '')}
        </div>
        <h3 className="mt-5 text-xl font-bold text-text-main">{title}</h3>
        <p className="mt-2 text-text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }) {
  return (
    <div className="text-center p-4">
      <p className="text-3xl font-extrabold text-gradient">{value}</p>
      <p className="mt-1 text-text-muted font-medium">{label}</p>
    </div>
  );
}
