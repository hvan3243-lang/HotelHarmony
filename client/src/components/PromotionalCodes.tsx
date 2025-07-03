import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Tag, 
  Percent, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Gift
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PromotionalCode {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

interface PromoCodeInputProps {
  onCodeApplied: (discount: any) => void;
  bookingAmount: number;
}

export function PromoCodeInput({ onCodeApplied, bookingAmount }: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState<any>(null);
  const { toast } = useToast();

  const validateCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/promotional-codes/validate", {
        code,
        amount: bookingAmount,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setAppliedCode(data);
      onCodeApplied(data);
      toast({
        title: "Mã giảm giá hợp lệ!",
        description: `Bạn được giảm ${data.discountAmount.toLocaleString('vi-VN')}đ`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Mã giảm giá không hợp lệ",
        description: error.message || "Vui lòng kiểm tra lại mã giảm giá",
        variant: "destructive",
      });
    },
  });

  const handleApplyCode = () => {
    if (!promoCode.trim()) {
      toast({
        title: "Vui lòng nhập mã giảm giá",
        variant: "destructive",
      });
      return;
    }
    validateCodeMutation.mutate(promoCode.trim().toUpperCase());
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setPromoCode("");
    onCodeApplied(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tag className="mr-2" size={20} />
          Mã giảm giá
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!appliedCode ? (
          <div className="flex space-x-2">
            <Input
              placeholder="Nhập mã giảm giá..."
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
            />
            <Button 
              onClick={handleApplyCode}
              disabled={validateCodeMutation.isPending}
            >
              {validateCodeMutation.isPending ? "Kiểm tra..." : "Áp dụng"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">
                    {appliedCode.code}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Giảm {appliedCode.discountAmount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveCode}
                className="text-green-600 hover:text-green-700"
              >
                Bỏ mã
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AvailableCodesProps {
  userLevel?: string;
  onCodeSelect?: (code: string) => void;
}

export function AvailableCodes({ userLevel, onCodeSelect }: AvailableCodesProps) {
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["/api/promotional-codes/available", userLevel],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/promotional-codes/available?level=${userLevel || ''}`);
      return await response.json();
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Gift className="mr-2" size={20} />
        Mã giảm giá có sẵn
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {codes.map((code: PromotionalCode, index: number) => (
          <motion.div
            key={code.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onCodeSelect?.(code.code)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono font-bold">
                        {code.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(code.code);
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                    <h4 className="font-semibold">{code.name}</h4>
                    <p className="text-sm text-muted-foreground">{code.description}</p>
                  </div>
                  <Badge variant="secondary">
                    {code.discountType === "percentage" ? (
                      <>
                        <Percent size={12} className="mr-1" />
                        {code.discountValue}%
                      </>
                    ) : (
                      <>
                        {code.discountValue.toLocaleString('vi-VN')}đ
                      </>
                    )}
                  </Badge>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Đơn tối thiểu:</span>
                    <span className="font-medium">{code.minAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                  
                  {code.maxDiscount && (
                    <div className="flex items-center justify-between">
                      <span>Giảm tối đa:</span>
                      <span className="font-medium">{code.maxDiscount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span>Hết hạn:</span>
                    <span className="font-medium flex items-center">
                      <Clock size={12} className="mr-1" />
                      {new Date(code.validTo).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {code.usageLimit && (
                    <div className="flex items-center justify-between">
                      <span>Còn lại:</span>
                      <span className="font-medium">
                        {(code.usageLimit - code.usedCount)} lượt
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={code.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {code.isActive ? "Hoạt động" : "Tạm ngưng"}
                    </Badge>
                    {onCodeSelect && (
                      <Button size="sm" variant="outline">
                        Sử dụng
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {codes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto mb-2 text-muted-foreground" size={24} />
            <p className="text-muted-foreground">Hiện tại không có mã giảm giá nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AdminPromoCodeManagerProps {
  onCodeCreated?: () => void;
}

export function AdminPromoCodeManager({ onCodeCreated }: AdminPromoCodeManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    minAmount: 0,
    maxDiscount: "",
    usageLimit: "",
    validFrom: "",
    validTo: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ["/api/admin/promotional-codes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/promotional-codes");
      return await response.json();
    },
  });

  const createCodeMutation = useMutation({
    mutationFn: async (codeData: any) => {
      const response = await apiRequest("POST", "/api/admin/promotional-codes", codeData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tạo mã giảm giá thành công!",
        description: "Mã giảm giá đã được thêm vào hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotional-codes"] });
      setIsCreating(false);
      setFormData({
        code: "",
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: 0,
        minAmount: 0,
        maxDiscount: "",
        usageLimit: "",
        validFrom: "",
        validTo: "",
      });
      onCodeCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo mã giảm giá",
        description: error.message || "Có lỗi xảy ra khi tạo mã giảm giá",
        variant: "destructive",
      });
    },
  });

  const toggleCodeStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/promotional-codes/${id}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promotional-codes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const codeData = {
      ...formData,
      code: formData.code.toUpperCase(),
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      validFrom: new Date(formData.validFrom).toISOString(),
      validTo: new Date(formData.validTo).toISOString(),
    };

    createCodeMutation.mutate(codeData);
  };

  return (
    <div className="space-y-6">
      {/* Create New Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quản lý mã giảm giá</CardTitle>
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant={isCreating ? "outline" : "default"}
            >
              {isCreating ? "Hủy" : "Tạo mã mới"}
            </Button>
          </div>
        </CardHeader>
        
        {isCreating && (
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Mã giảm giá</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER2024"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name">Tên mã</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Giảm giá mùa hè"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Giảm giá đặc biệt cho mùa hè"
                />
              </div>

              <div>
                <Label htmlFor="discountType">Loại giảm giá</Label>
                <select
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as "percentage" | "fixed" }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Số tiền cố định (VNĐ)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="discountValue">Giá trị giảm</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.discountType === "percentage" ? "10" : "100000"}
                  required
                />
              </div>

              <div>
                <Label htmlFor="minAmount">Đơn tối thiểu (VNĐ)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="500000"
                />
              </div>

              <div>
                <Label htmlFor="maxDiscount">Giảm tối đa (VNĐ)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: e.target.value }))}
                  placeholder="200000"
                />
              </div>

              <div>
                <Label htmlFor="usageLimit">Giới hạn sử dụng</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="100"
                />
              </div>

              <div>
                <Label htmlFor="validFrom">Có hiệu lực từ</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="validTo">Hết hạn</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCodeMutation.isPending}
                >
                  {createCodeMutation.isPending ? "Đang tạo..." : "Tạo mã giảm giá"}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Existing Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mã giảm giá</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : codes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có mã giảm giá nào</p>
          ) : (
            <div className="space-y-3">
              {codes.map((code: PromotionalCode) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <code className="bg-primary/10 text-primary px-2 py-1 rounded font-mono font-bold">
                        {code.code}
                      </code>
                      <span className="font-semibold">{code.name}</span>
                      <Badge variant={code.isActive ? "default" : "secondary"}>
                        {code.isActive ? "Hoạt động" : "Tạm ngưng"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{code.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>
                        Giảm: {code.discountType === "percentage" ? `${code.discountValue}%` : `${code.discountValue.toLocaleString('vi-VN')}đ`}
                      </span>
                      <span>Đã dùng: {code.usedCount}/{code.usageLimit || "∞"}</span>
                      <span>Hết hạn: {new Date(code.validTo).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleCodeStatusMutation.mutate({ id: code.id, isActive: !code.isActive })}
                    disabled={toggleCodeStatusMutation.isPending}
                  >
                    {code.isActive ? "Tạm ngưng" : "Kích hoạt"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}