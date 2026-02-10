import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sun, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Hidden on Home page */}
      {location.pathname !== '/' && (
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-warm py-3'
            : 'bg-transparent py-5'
            }`}
        >
          <div className="w-full px-6 flex items-center justify-center md:justify-start gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-8 group">
              <img src="/logo.jpeg" alt="Aura Companion" className="w-40 h-40 rounded-3xl object-cover shadow-warm group-hover:shadow-glow transition-all" />
              <div className="flex items-center gap-2 text-6xl font-bold font-serif text-text-main tracking-tight">
                <span><span className="text-primary">A</span>ura</span>
                <span><span className="text-primary">C</span>ompanion</span>
              </div>
            </Link>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-orange-100 shadow-warm-lg animate-fade-in-down">
              <div className="px-6 py-6 space-y-4">
                <a href="#features" className="block text-text-main font-semibold py-2">Features</a>
                <a href="#how-it-works" className="block text-text-main font-semibold py-2">How It Works</a>
                <a href="#about" className="block text-text-main font-semibold py-2">About</a>
                <hr className="border-orange-100" />
                <Link to="/login" className="block text-text-main font-semibold py-2">Log In</Link>
                <Link
                  to="/login"
                  className="block text-center bg-gradient-to-r from-primary to-orange-400 text-white px-6 py-3 rounded-full font-bold shadow-warm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-text-main text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.jpeg" alt="Aura Companion" className="w-10 h-10 rounded-2xl object-cover" />
                <span className="text-xl font-extrabold">Aura Companion</span>
              </div>
              <p className="text-orange-100/80 leading-relaxed max-w-sm">
                An AI-powered voice companion for mental well-being. We listen,
                remember, and gently support your daily journey.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2 text-orange-100/80">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-orange-100/80">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <hr className="border-orange-100/20 my-10" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-orange-100/60">
            <p>© 2026 Aura Companion. Designed for support, not medical diagnosis.</p>
            <p>Made with care for mental well-being.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="text-text-main font-semibold hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
    >
      {children}
    </a>
  );
}
