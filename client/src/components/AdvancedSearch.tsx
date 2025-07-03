import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Star,
  Wifi,
  Car,
  Coffee,
  Waves,
  Utensils,
  ChevronDown,
  SlidersHorizontal,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SearchFilters {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string;
  priceRange: [number, number];
  amenities: string[];
  rating: number;
  sortBy: string;
  location: string;
  keywords: string;
}

interface Room {
  id: number;
  number: string;
  type: string;
  price: string;
  capacity: number;
  description?: string;
  status: string;
  amenities?: string[];
  images?: string[];
  averageRating?: number;
  reviewCount?: number;
}

const roomTypes = [
  { value: "", label: "Tất cả loại phòng" },
  { value: "standard", label: "Phòng tiêu chuẩn" },
  { value: "deluxe", label: "Phòng deluxe" },
  { value: "suite", label: "Phòng suite" },
  { value: "presidential", label: "Phòng tổng thống" },
];

const sortOptions = [
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "rating_desc", label: "Đánh giá cao nhất" },
  { value: "popularity", label: "Phổ biến nhất" },
  { value: "newest", label: "Mới nhất" },
];

const commonAmenities = [
  { id: "wifi", label: "WiFi miễn phí", icon: Wifi },
  { id: "parking", label: "Chỗ đậu xe", icon: Car },
  { id: "breakfast", label: "Bữa sáng", icon: Coffee },
  { id: "pool", label: "Hồ bơi", icon: Waves },
  { id: "restaurant", label: "Nhà hàng", icon: Utensils },
  { id: "spa", label: "Spa & Wellness", icon: Star },
  { id: "gym", label: "Phòng gym", icon: Users },
  { id: "balcony", label: "Ban công", icon: MapPin },
];

interface AdvancedSearchProps {
  onSearchResults: (results: Room[]) => void;
  initialFilters?: Partial<SearchFilters>;
}

export function AdvancedSearch({ onSearchResults, initialFilters }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    checkIn: "",
    checkOut: "",
    guests: 1,
    roomType: "",
    priceRange: [0, 5000000],
    amenities: [],
    rating: 0,
    sortBy: "price_asc",
    location: "",
    keywords: "",
    ...initialFilters,
  });

  const [isSearching, setIsSearching] = useState(false);

  // Search rooms with filters
  const searchRooms = async (searchFilters: SearchFilters) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== "" && value !== 0 && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              params.append(key, value.join(","));
            }
          } else if (key === "priceRange") {
            params.append("minPrice", value[0].toString());
            params.append("maxPrice", value[1].toString());
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await apiRequest("GET", `/api/rooms/search?${params}`);
      const results = await response.json();
      onSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      onSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    searchRooms(filters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      checkIn: "",
      checkOut: "",
      guests: 1,
      roomType: "",
      priceRange: [0, 5000000],
      amenities: [],
      rating: 0,
      sortBy: "price_asc",
      location: "",
      keywords: "",
    });
  };

  const hasActiveFilters = () => {
    return filters.roomType !== "" || 
           filters.amenities.length > 0 || 
           filters.rating > 0 || 
           filters.priceRange[0] > 0 || 
           filters.priceRange[1] < 5000000 ||
           filters.keywords !== "";
  };

  // Auto-search when critical filters change
  useEffect(() => {
    if (filters.checkIn && filters.checkOut) {
      const debounceTimer = setTimeout(() => {
        searchRooms(filters);
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [filters.checkIn, filters.checkOut, filters.guests]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search size={20} />
            <CardTitle>Tìm kiếm phòng</CardTitle>
            {hasActiveFilters() && (
              <Badge variant="secondary">
                {filters.amenities.length + (filters.roomType ? 1 : 0) + (filters.rating > 0 ? 1 : 0)} bộ lọc
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X size={16} className="mr-1" />
                Xóa bộ lọc
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal size={16} className="mr-1" />
              {isExpanded ? "Ẩn bộ lọc" : "Bộ lọc nâng cao"}
              <ChevronDown size={16} className={`ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="checkIn">Ngày nhận phòng</Label>
            <Input
              id="checkIn"
              type="date"
              value={filters.checkIn}
              onChange={(e) => handleFilterChange("checkIn", e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <Label htmlFor="checkOut">Ngày trả phòng</Label>
            <Input
              id="checkOut"
              type="date"
              value={filters.checkOut}
              onChange={(e) => handleFilterChange("checkOut", e.target.value)}
              min={filters.checkIn || new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div>
            <Label htmlFor="guests">Số khách</Label>
            <Select value={filters.guests.toString()} onValueChange={(value) => handleFilterChange("guests", parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} khách
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="keywords">Từ khóa</Label>
            <Input
              id="keywords"
              placeholder="Tìm kiếm..."
              value={filters.keywords}
              onChange={(e) => handleFilterChange("keywords", e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 pt-4 border-t"
                >
                  {/* Room Type & Sort */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Loại phòng</Label>
                      <Select value={filters.roomType} onValueChange={(value) => handleFilterChange("roomType", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại phòng" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Sắp xếp theo</Label>
                      <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="mb-3 block">
                      Khoảng giá: {filters.priceRange[0].toLocaleString('vi-VN')}đ - {filters.priceRange[1].toLocaleString('vi-VN')}đ
                    </Label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => handleFilterChange("priceRange", value)}
                      max={5000000}
                      min={0}
                      step={100000}
                      className="w-full"
                    />
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <Label className="mb-3 block">Đánh giá tối thiểu</Label>
                    <div className="flex items-center space-x-2">
                      {[0, 1, 2, 3, 4, 5].map(rating => (
                        <Button
                          key={rating}
                          variant={filters.rating === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange("rating", rating)}
                          className="flex items-center space-x-1"
                        >
                          <Star size={14} className={rating <= filters.rating ? "fill-current" : ""} />
                          <span>{rating === 0 ? "Tất cả" : `${rating}+`}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <Label className="mb-3 block">Tiện nghi</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {commonAmenities.map(amenity => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={amenity.id}
                            checked={filters.amenities.includes(amenity.id)}
                            onCheckedChange={() => toggleAmenity(amenity.id)}
                          />
                          <Label htmlFor={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                            <amenity.icon size={16} />
                            <span className="text-sm">{amenity.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>

        {/* Search Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleSearch} 
            className="w-full"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Đang tìm kiếm...
              </>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                Tìm kiếm phòng
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SearchResultsProps {
  results: Room[];
  isLoading?: boolean;
  onBookRoom?: (room: Room) => void;
}

export function SearchResults({ results, isLoading, onBookRoom }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Search size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy phòng nào</h3>
          <p className="text-muted-foreground">
            Thử thay đổi tiêu chí tìm kiếm hoặc điều chỉnh bộ lọc
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Tìm thấy {results.length} phòng phù hợp
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative h-48">
                {room.images && room.images.length > 0 ? (
                  <img
                    src={room.images[0]}
                    alt={`Phòng ${room.number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
                    Phòng {room.number}
                  </div>
                )}
                
                {room.averageRating && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{room.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">Phòng {room.number}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{room.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {parseFloat(room.price).toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-xs text-muted-foreground">/ đêm</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  <Users size={14} className="text-muted-foreground" />
                  <span className="text-sm">{room.capacity} khách</span>
                  {room.reviewCount && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {room.reviewCount} đánh giá
                      </span>
                    </>
                  )}
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {room.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{room.amenities.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {room.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {room.description}
                  </p>
                )}
                
                <Button 
                  className="w-full"
                  onClick={() => onBookRoom?.(room)}
                  disabled={room.status !== "available"}
                >
                  {room.status === "available" ? "Đặt phòng" : "Không có sẵn"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}