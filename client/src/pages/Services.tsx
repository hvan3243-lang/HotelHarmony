import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Coffee, 
  Car, 
  Waves, 
  Shirt,
  MapPin,
  Search
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

const categoryIcons = {
  food: <Coffee className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
  spa: <Waves className="h-4 w-4" />,
  laundry: <Shirt className="h-4 w-4" />,
  room_service: <Coffee className="h-4 w-4" />,
  tour: <MapPin className="h-4 w-4" />
};

const categoryNames = {
  food: "Ăn uống",
  transport: "Đưa đón",
  spa: "Spa & Massage",
  laundry: "Giặt ủi",
  room_service: "Dịch vụ phòng",
  tour: "Tour du lịch"
};

export default function Services() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    category: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const addServiceMutation = useMutation({
    mutationFn: (serviceData: any) => apiRequest("POST", "/api/services", serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setIsAddDialogOpen(false);
      setNewService({ name: "", description: "", price: "", category: "" });
      toast({ title: "Thành công", description: "Đã thêm dịch vụ mới" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể thêm dịch vụ", variant: "destructive" });
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setEditingService(null);
      toast({ title: "Thành công", description: "Đã cập nhật dịch vụ" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật dịch vụ", variant: "destructive" });
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Thành công", description: "Đã xóa dịch vụ" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xóa dịch vụ", variant: "destructive" });
    }
  });

  const handleAddService = () => {
    if (!newService.name || !newService.price || !newService.category) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin", variant: "destructive" });
      return;
    }
    addServiceMutation.mutate(newService);
  };

  const handleUpdateService = () => {
    if (!editingService) return;
    updateServiceMutation.mutate(editingService);
  };

  const handleDeleteService = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  const servicesArray = Array.isArray(services) ? services : [];
  const filteredServices = servicesArray.filter((service: Service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(parseFloat(amount));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quản Lý Dịch Vụ
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Quản lý các dịch vụ khách sạn
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Thêm Dịch Vụ
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo loại dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại dịch vụ</SelectItem>
                  <SelectItem value="food">Ăn uống</SelectItem>
                  <SelectItem value="transport">Đưa đón</SelectItem>
                  <SelectItem value="spa">Spa & Massage</SelectItem>
                  <SelectItem value="laundry">Giặt ủi</SelectItem>
                  <SelectItem value="room_service">Dịch vụ phòng</SelectItem>
                  <SelectItem value="tour">Tour du lịch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: Service) => (
            <Card key={service.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {categoryIcons[service.category as keyof typeof categoryIcons]}
                    <span className="text-lg">{service.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="secondary">
                    {categoryNames[service.category as keyof typeof categoryNames]}
                  </Badge>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {service.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(service.price)}
                    </span>
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy dịch vụ nào</p>
            </CardContent>
          </Card>
        )}

        {/* Add Service Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Dịch Vụ Mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tên dịch vụ</label>
                <Input
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Ví dụ: Massage thư giãn"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Loại dịch vụ</label>
                <Select
                  value={newService.category}
                  onValueChange={(value) => setNewService({ ...newService, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại dịch vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Ăn uống</SelectItem>
                    <SelectItem value="transport">Đưa đón</SelectItem>
                    <SelectItem value="spa">Spa & Massage</SelectItem>
                    <SelectItem value="laundry">Giặt ủi</SelectItem>
                    <SelectItem value="room_service">Dịch vụ phòng</SelectItem>
                    <SelectItem value="tour">Tour du lịch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Giá (VND)</label>
                <Input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Mô tả chi tiết về dịch vụ..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddService} className="flex-1">
                  Thêm Dịch Vụ
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh Sửa Dịch Vụ</DialogTitle>
            </DialogHeader>
            {editingService && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên dịch vụ</label>
                  <Input
                    value={editingService.name}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Loại dịch vụ</label>
                  <Select
                    value={editingService.category}
                    onValueChange={(value) => setEditingService({ ...editingService, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Ăn uống</SelectItem>
                      <SelectItem value="transport">Đưa đón</SelectItem>
                      <SelectItem value="spa">Spa & Massage</SelectItem>
                      <SelectItem value="laundry">Giặt ủi</SelectItem>
                      <SelectItem value="room_service">Dịch vụ phòng</SelectItem>
                      <SelectItem value="tour">Tour du lịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Giá (VND)</label>
                  <Input
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    value={editingService.description || ""}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateService} className="flex-1">
                    Cập Nhật
                  </Button>
                  <Button variant="outline" onClick={() => setEditingService(null)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}