import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { useState } from "react";

export function CreateAdmin() {
  const [email, setEmail] = useState("admin@hotellux.com");
  const [password, setPassword] = useState("admin123");
  const [firstName, setFirstName] = useState("Admin");
  const [lastName, setLastName] = useState("User");
  const [phone, setPhone] = useState("+84-123-456-789");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login with the created admin account
        authManager.login(data.user, data.token);

        toast({
          title: "Thành công!",
          description: "Tài khoản admin đã được tạo và đăng nhập tự động.",
        });

        // Refresh page to update auth state
        window.location.reload();
      } else {
        toast({
          title: "Lỗi!",
          description: data.message || "Không thể tạo tài khoản admin.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi!",
        description: "Có lỗi xảy ra khi tạo tài khoản admin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Tạo Tài Khoản Admin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tên</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Họ</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang tạo..." : "Tạo Admin"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
