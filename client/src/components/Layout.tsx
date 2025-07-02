import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { authManager } from "@/lib/auth";
import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import { Moon, Sun, Hotel, Menu, X } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(authManager.getUser());
  }, [location]);

  const handleLogout = () => {
    authManager.logout();
    setUser(null);
    window.location.href = "/";
  };

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/booking", label: "Đặt phòng" },
    ...(user ? [
      { href: user.role === 'admin' ? "/admin" : "/customer", label: user.role === 'admin' ? "Quản lý" : "Tài khoản" }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card dark:bg-card shadow-lg sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Link href="/">
                  <h1 className="text-2xl font-bold text-primary cursor-pointer">
                    <Hotel className="inline mr-2" size={24} />
                    HotelLux
                  </h1>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className="font-medium"
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </Button>
              
              {/* User Menu */}
              {user ? (
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {user.firstName} {user.lastName}
                  </span>
                  <Button variant="outline" onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button>
                    Đăng nhập
                  </Button>
                </Link>
              )}
              
              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4">
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
                {user && (
                  <Button variant="outline" onClick={handleLogout} className="w-full justify-start">
                    Đăng xuất
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
