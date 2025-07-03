import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { authManager } from "@/lib/auth";
import { useState, useEffect } from "react";
import { User } from "@shared/schema";
import { Moon, Sun, Hotel, Menu, X } from "lucide-react";
import { LiveChat } from "./LiveChat";
// import { LanguageSwitcher } from "./LanguageSwitcher";
// import { useTranslation } from "@/lib/i18n";

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

  // const { t } = useTranslation();

  const navItems = [
    { href: "/", label: "Trang chủ" },
    { href: "/booking", label: "Đặt phòng" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Liên hệ" },
    ...(user ? [
      ...(user.role === 'admin' ? [
        { href: "/admin", label: "Quản trị" }
      ] : [
        { href: "/customer", label: "Khách hàng" }
      ])
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="glass backdrop-blur-lg sticky top-0 z-50 border-b shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Link href="/">
                  <h1 className="text-2xl font-bold text-gradient hover-scale cursor-pointer transition-all">
                    <Hotel className="inline mr-2 animate-float" size={24} />
                    HotelLux
                  </h1>
                </Link>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className={`font-medium hover-scale transition-all ${
                        location === item.href ? "btn-primary" : "hover:bg-primary/10"
                      }`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              {/* <LanguageSwitcher /> */}
              
              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="hover-scale glass"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </Button>
              
              {/* User Menu */}
              {user ? (
                <div className="hidden md:flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <Button variant="outline" onClick={handleLogout} className="hover-glow">
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button className="btn-primary hover-glow">
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
      
      {/* Live Chat Component */}
      {user && <LiveChat isAdmin={user.role === 'admin'} />}
    </div>
  );
}
