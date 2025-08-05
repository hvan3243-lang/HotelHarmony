import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Hotel, LogIn, Phone, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  // Create schemas with translations
  const loginSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.passwordRequired")),
    rememberMe: z.boolean().optional(),
  });

  const registerSchema = z.object({
    firstName: z.string().min(1, t("auth.nameRequired")),
    lastName: z.string().min(1, t("auth.nameRequired")),
    email: z.string().email(t("auth.invalidEmail")),
    phone: z.string().min(10, t("auth.phoneRequired")),
    password: z.string().min(6, t("auth.passwordRequired")),
    preferences: z.array(z.string()).optional(),
  });

  type LoginForm = z.infer<typeof loginSchema>;
  type RegisterForm = z.infer<typeof registerSchema>;

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      preferences: [],
    },
  });

  useEffect(() => {
    if (!isLogin) {
      registerForm.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        preferences: [],
      });
    }
  }, [isLogin]);

  const preferences = [
    t("rooms.roomType.deluxe"),
    t("rooms.amenities"),
    "spa & wellness",
    t("rooms.roomType.suite"),
  ];

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();

      console.log("Login API response:", result);
      console.log("User object from API:", result.user);
      console.log("User role from API:", result.user?.role);

      authManager.login(result.user, result.token);

      toast({
        title: t("auth.loginSuccess"),
        description: `${t("auth.welcomeMessage")} ${result.user.firstName}!`,
      });

      // Redirect based on user role
      if (result.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        title: t("auth.loginFailed"),
        description: error.message || t("auth.invalidCredentials"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Gửi đúng tên trường camelCase cho backend
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        preferences: data.preferences ? JSON.stringify(data.preferences) : "[]",
      };
      const response = await apiRequest("POST", "/api/auth/register", payload);
      const result = await response.json();

      authManager.login(result.user, result.token);

      toast({
        title: t("auth.registerSuccess"),
        description: t("auth.welcomeMessage"),
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: t("auth.registerFailed"),
        description: error.message || t("auth.emailExists"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Hình minh họa hoặc slogan */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gradient mb-2">
            Chào mừng đến với HotelLux
          </h2>
          <p className="text-muted-foreground text-center max-w-xs">
            Đăng nhập hoặc tạo tài khoản để trải nghiệm dịch vụ khách sạn đẳng
            cấp, ưu đãi hấp dẫn và quản lý đặt phòng dễ dàng!
          </p>
        </div>
        {/* Card đăng nhập/đăng ký */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="glass border-primary/20 shadow-2xl rounded-3xl bg-white/90 backdrop-blur-md">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center mb-4"
              >
                <Hotel size={40} className="text-primary mr-3 animate-float" />
                <h1 className="text-3xl font-bold text-gradient">HotelLux</h1>
              </motion.div>
              <CardTitle className="text-xl font-semibold">
                {isLogin ? t("auth.login") : t("auth.register")}
              </CardTitle>
              <p className="text-muted-foreground text-sm bg-primary/5 px-4 py-2 rounded">
                {isLogin ? t("auth.loginToContinue") : t("auth.createAccount")}
              </p>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <form
                      onSubmit={loginForm.handleSubmit(handleLogin)}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Label
                          htmlFor="email"
                          className="text-xs font-semibold mb-1 block"
                        >
                          {t("auth.email")}
                        </Label>
                        <span className="absolute left-3 top-9 text-blue-400">
                          <Hotel size={16} />
                        </span>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@hotellux.com"
                          {...loginForm.register("email")}
                          className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <Label
                          htmlFor="password"
                          className="text-xs font-semibold mb-1 block"
                        >
                          {t("auth.password")}
                        </Label>
                        <span className="absolute left-3 top-9 text-blue-400">
                          <LogIn size={16} />
                        </span>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...loginForm.register("password")}
                          className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-destructive mt-1">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rememberMe"
                            {...loginForm.register("rememberMe")}
                          />
                          <Label htmlFor="rememberMe" className="text-xs">
                            {t("auth.rememberMe")}
                          </Label>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-xs">
                          {t("auth.forgotPassword")}
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-xl text-base py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:scale-105 transition"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                        ) : (
                          <LogIn className="mr-2" size={16} />
                        )}
                        {t("auth.login")}
                      </Button>
                    </form>

                    <div className="relative">
                      <Separator />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-background px-2 text-muted-foreground text-xs">
                          hoặc
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full rounded-xl text-base py-2 hover:scale-105 transition"
                      onClick={() =>
                        (window.location.href = "/api/auth/google")
                      }
                      type="button"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t("auth.loginWithGoogle")}
                    </Button>

                    <div className="text-center">
                      <span className="text-muted-foreground text-xs">
                        {t("auth.noAccount")}{" "}
                      </span>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-xs"
                        onClick={() => setIsLogin(false)}
                      >
                        {t("auth.register")}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <form
                      onSubmit={registerForm.handleSubmit(handleRegister)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <Label
                            htmlFor="firstName"
                            className="text-xs font-semibold mb-1 block"
                          >
                            {t("auth.firstName")}
                          </Label>
                          <span className="absolute left-3 top-9 text-blue-400">
                            <UserPlus size={16} />
                          </span>
                          <Input
                            id="firstName"
                            placeholder="Nguyễn"
                            {...registerForm.register("firstName")}
                            className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                          />
                          {registerForm.formState.errors.firstName && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div className="relative">
                          <Label
                            htmlFor="lastName"
                            className="text-xs font-semibold mb-1 block"
                          >
                            {t("auth.lastName")}
                          </Label>
                          <span className="absolute left-3 top-9 text-blue-400">
                            <UserPlus size={16} />
                          </span>
                          <Input
                            id="lastName"
                            placeholder="Văn A"
                            {...registerForm.register("lastName")}
                            className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                          />
                          {registerForm.formState.errors.lastName && (
                            <p className="text-sm text-destructive mt-1">
                              {registerForm.formState.errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <Label
                          htmlFor="email"
                          className="text-xs font-semibold mb-1 block"
                        >
                          {t("auth.email")}
                        </Label>
                        <span className="absolute left-3 top-9 text-blue-400">
                          <Hotel size={16} />
                        </span>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          {...registerForm.register("email")}
                          className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <Label
                          htmlFor="phone"
                          className="text-xs font-semibold mb-1 block"
                        >
                          {t("auth.phone")}
                        </Label>
                        <span className="absolute left-3 top-9 text-blue-400">
                          <Phone size={16} />
                        </span>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+84 123 456 789"
                          {...registerForm.register("phone")}
                          className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        />
                        {registerForm.formState.errors.phone && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <Label
                          htmlFor="password"
                          className="text-xs font-semibold mb-1 block"
                        >
                          {t("auth.password")}
                        </Label>
                        <span className="absolute left-3 top-9 text-blue-400">
                          <LogIn size={16} />
                        </span>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...registerForm.register("password")}
                          className="rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs font-semibold mb-1 block">
                          {t("auth.preferences")}
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {preferences.map((preference, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`preference-${index}`}
                                value={preference}
                                {...registerForm.register("preferences")}
                              />
                              <Label
                                htmlFor={`preference-${index}`}
                                className="text-xs capitalize"
                              >
                                {preference}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full rounded-xl text-base py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:scale-105 transition"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                        ) : (
                          <UserPlus className="mr-2" size={16} />
                        )}
                        {t("auth.register")}
                      </Button>
                    </form>

                    <div className="text-center">
                      <span className="text-muted-foreground text-xs">
                        {t("auth.haveAccount")}{" "}
                      </span>
                      <Button
                        variant="link"
                        className="p-0 h-auto font-medium text-xs"
                        onClick={() => setIsLogin(true)}
                      >
                        {t("auth.login")}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
