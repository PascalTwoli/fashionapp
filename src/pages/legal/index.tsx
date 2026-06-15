import { createContext, useCallback, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { LEGAL_TABS } from './legalUtils';

export const LegalHeaderSlotContext = createContext<(node: React.ReactNode) => void>(() => {});

const LegalShell = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [headerSlot, setHeaderSlot] = useState<React.ReactNode>(null);
  const setSlot = useCallback((node: React.ReactNode) => setHeaderSlot(node), []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur">
        {/* Logo row with title */}
        <div className="border-b border-border px-3 sm:px-4">
          <div className="h-14 flex items-center gap-3">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <div className="flex-1" />
            {/* Back button */}
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2 rounded-none"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Tab nav - aligned with content margins */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="border-b border-border">
            <nav className="flex items-end overflow-x-auto -mb-px pt-3" aria-label="Legal sections">
              {LEGAL_TABS.map(tab => {
                const isActive = tab.path === '/legal'
                  ? pathname === '/legal'
                  : pathname.startsWith(tab.path);
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={[
                      'pb-3 px-3 mr-1 text-sm whitespace-nowrap border-b-2 transition-colors shrink-0',
                      isActive
                        ? 'border-foreground text-foreground font-medium'
                        : 'border-transparent text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <LegalHeaderSlotContext.Provider value={setSlot}>
        <Outlet />
      </LegalHeaderSlotContext.Provider>
      
      {/* Floating slot for mobile TOC button - rendered by child pages */}
      <div className="lg:hidden">{headerSlot}</div>
    </div>
  );
};

export default LegalShell;
