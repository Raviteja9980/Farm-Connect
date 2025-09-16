
"use client";
import Link from 'next/link';
import { Leaf, UserCircle, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/'); 
  };

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Leaf className="h-8 w-8" />
          <span className="text-2xl font-bold">FarmConnect</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            Products
          </Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'farmer' && (
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              )}
               <Link href={user?.role === 'farmer' ? `/farmers/${user.id}` : `/profile`} className="text-foreground hover:text-primary transition-colors">
                 <Button variant="ghost" size="sm">
                    <UserCircle className="mr-2 h-4 w-4" /> Profile
                  </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-foreground hover:text-primary transition-colors">
                <Button variant="ghost" size="sm">
                 <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </Link>
              <Link href="/login?action=signup"> {/* Changed to /login?action=signup */}
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

