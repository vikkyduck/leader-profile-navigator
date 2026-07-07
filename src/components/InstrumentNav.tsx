import { useLocation, Link, useSearchParams } from 'react-router-dom';
import { Waves, Compass, Target, Battery, ShieldAlert } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const instruments = [
  { path: '/', altPath: '/blue-ocean', label: 'Blue Ocean', icon: Waves },
  { path: '/leadership-radar', label: 'Leadership', icon: Compass },
  { path: '/indicator-radar', label: 'Индикаторы', icon: Target },
  { path: '/resource-radar', label: 'Тонус', icon: Battery },
  { path: '/edtech-risk', label: 'EdTech-риски', icon: ShieldAlert },
];

const ADMIN_KEY = 'instrument_nav_visible';

export const useAdminNav = () => {
  const [searchParams] = useSearchParams();
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_KEY) === '1';
    }
    return false;
  });

  // Activate via ?nav=1
  useEffect(() => {
    if (searchParams.get('nav') === '1') {
      localStorage.setItem(ADMIN_KEY, '1');
      setVisible(true);
    }
  }, [searchParams]);

  // Toggle via Ctrl+Shift+N
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      setVisible(prev => {
        const next = !prev;
        localStorage.setItem(ADMIN_KEY, next ? '1' : '0');
        return next;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return visible;
};

const InstrumentNav = () => {
  const { pathname } = useLocation();
  const visible = useAdminNav();

  if (!visible) return null;

  const isActive = (item: typeof instruments[0]) =>
    pathname === item.path || (item.altPath && pathname === item.altPath);

  return (
    <nav className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/50 w-fit">
      {instruments.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              active
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default InstrumentNav;
