import { LoyaltyBadge } from "@/components/LoyaltyProgram";
import { useTheme } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { useLanguageStore, useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell,
  Crown,
  Globe,
  Moon,
  Settings as SettingsIcon,
  Shield,
  Star,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface UserSettings {
  firstName: string;
  lastName: string;
  phone: string;
  preferences: string[];
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

export default function Settings() {
  const { t, currentLanguage } = useTranslation();
  const { setLanguage } = useLanguageStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserType | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    firstName: "",
    lastName: "",
    phone: "",
    preferences: [],
    language: currentLanguage,
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  useEffect(() => {
    const currentUser = authManager.getUser();
    if (currentUser) {
      setUser(currentUser);
      setSettings({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        phone: currentUser.phone || "",
        preferences: currentUser.preferences || [],
        language: currentLanguage,
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
      });
    }
  }, [currentLanguage]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserSettings>) => {
      const response = await apiRequest(
        "PUT",
        "/api/users/profile",
        profileData
      );
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: t("success"),
        description: "Cập nhật thông tin thành công",
      });
      authManager.login(updatedUser, authManager.getToken() || "");
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Có lỗi xảy ra khi cập nhật thông tin",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    handleSettingChange("language", newLanguage);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      firstName: settings.firstName,
      lastName: settings.lastName,
      phone: settings.phone,
      preferences: settings.preferences,
      language: settings.language,
    });
  };

  const handleAddPreference = (preference: string) => {
    if (!settings.preferences.includes(preference)) {
      handleSettingChange("preferences", [...settings.preferences, preference]);
    }
  };

  const handleRemovePreference = (preference: string) => {
    handleSettingChange(
      "preferences",
      settings.preferences.filter((p) => p !== preference)
    );
  };

  const commonPreferences = [
    "Non-smoking room",
    "High floor",
    "Sea view",
    "Quiet area",
    "Late check-in",
    "Early check-out",
    "Extra towels",
    "Room service",
    "Daily housekeeping",
    "Mini bar",
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Vui lòng đăng nhập để truy cập cài đặt
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center mb-4"
          >
            <SettingsIcon className="mr-3" size={32} />
            <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
          </motion.div>

          {/* User Status */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="text-left">
                <p className="font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {user.isVip && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <Crown size={14} className="mr-1" />
                VIP Member
              </Badge>
            )}
            {user.loyaltyPoints !== undefined && (
              <LoyaltyBadge
                level={user.loyaltyLevel || "Bronze"}
                points={user.loyaltyPoints}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2" size={20} />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t("firstName")}</Label>
                    <Input
                      id="firstName"
                      value={settings.firstName}
                      onChange={(e) =>
                        handleSettingChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      value={settings.lastName}
                      onChange={(e) =>
                        handleSettingChange("lastName", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) =>
                      handleSettingChange("phone", e.target.value)
                    }
                    placeholder="+84 123 456 789"
                  />
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu thông tin"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Language & Theme Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2" size={20} />
                  Ngôn ngữ & Giao diện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Ngôn ngữ</Label>
                  <Select
                    value={settings.language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Giao diện</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex items-center space-x-2"
                    >
                      <Sun size={16} />
                      <span>Sáng</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex items-center space-x-2"
                    >
                      <Moon size={16} />
                      <span>Tối</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2" size={20} />
                  Sở thích đặt phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Chọn các sở thích để chúng tôi có thể phục vụ bạn tốt hơn
                </p>

                <div className="flex flex-wrap gap-2">
                  {settings.preferences.map((preference) => (
                    <Badge
                      key={preference}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => handleRemovePreference(preference)}
                    >
                      {preference} ×
                    </Badge>
                  ))}
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonPreferences
                    .filter((pref) => !settings.preferences.includes(pref))
                    .map((preference) => (
                      <Button
                        key={preference}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPreference(preference)}
                        className="justify-start"
                      >
                        + {preference}
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2" size={20} />
                  Cài đặt thông báo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email thông báo</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo về đặt phòng và cập nhật tài khoản
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Thông báo đẩy</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông báo ngay lập tức trên thiết bị
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange("pushNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email marketing</Label>
                    <p className="text-sm text-muted-foreground">
                      Nhận thông tin về ưu đãi và khuyến mãi
                    </p>
                  </div>
                  <Switch
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) =>
                      handleSettingChange("marketingEmails", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2" size={20} />
                  Bảo mật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Đổi mật khẩu</Label>
                    <p className="text-sm text-muted-foreground">
                      Cập nhật mật khẩu để bảo mật tài khoản
                    </p>
                  </div>
                  <Button variant="outline">Đổi mật khẩu</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Xác thực 2 lớp</Label>
                    <p className="text-sm text-muted-foreground">
                      Tăng cường bảo mật với xác thực 2 lớp
                    </p>
                  </div>
                  <Button variant="outline">Thiết lập</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
