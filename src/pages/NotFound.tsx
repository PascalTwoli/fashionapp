import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <p className="text-eyebrow">Error 404</p>
        <h1 className="font-display text-5xl mt-3">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-3">
          The page you are looking for has moved or no longer exists.
        </p>
        <Button asChild className="mt-8 h-11 px-8 bg-foreground text-background rounded-none text-xs uppercase tracking-wider">
          <Link to="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
