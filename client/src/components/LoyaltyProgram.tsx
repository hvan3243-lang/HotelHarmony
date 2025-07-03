import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  Star, 
  Gift, 
  TrendingUp, 
  Calendar,
  Award,
  Coins,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyLevel {
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
}

const loyaltyLevels: LoyaltyLevel[] = [
  {
    name: "Bronze",
    minPoints: 0,
    maxPoints: 999,
    benefits: ["Ưu đãi sinh nhật", "Check-in ưu tiên"],
    color: "from-amber-600 to-amber-700",
    icon: <Award className="w-5 h-5" />
  },
  {
    name: "Silver",
    minPoints: 1000,
    maxPoints: 2999,
    benefits: ["Nâng hạng phòng miễn phí", "Late check-out", "Wifi premium"],
    color: "from-gray-400 to-gray-600",
    icon: <Star className="w-5 h-5" />
  },
  {
    name: "Gold",
    minPoints: 3000,
    maxPoints: 4999,
    benefits: ["Dịch vụ spa giảm 20%", "Phòng hạng cao", "Concierge cá nhân"],
    color: "from-yellow-400 to-yellow-600",
    icon: <Crown className="w-5 h-5" />
  },
  {
    name: "Platinum",
    minPoints: 5000,
    maxPoints: Infinity,
    benefits: ["Nâng hạng suite", "Butler riêng", "Ưu đãi đặc biệt", "Ưu tiên tuyệt đối"],
    color: "from-purple-500 to-purple-700",
    icon: <Zap className="w-5 h-5" />
  }
];

interface PointTransaction {
  id: number;
  type: "earned" | "redeemed";
  points: number;
  description: string;
  createdAt: string;
}

interface LoyaltyData {
  currentPoints: number;
  totalEarned: number;
  currentLevel: string;
  nextLevel?: string;
  pointsToNextLevel?: number;
}

export function LoyaltyDashboard({ userId }: { userId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loyaltyData, isLoading } = useQuery({
    queryKey: ["/api/loyalty", userId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loyalty/${userId}`);
      return await response.json();
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/loyalty", userId, "transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loyalty/${userId}/transactions`);
      return await response.json();
    },
  });

  const { data: redeemableRewards = [] } = useQuery({
    queryKey: ["/api/loyalty/rewards"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/loyalty/rewards");
      return await response.json();
    },
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async ({ rewardId, points }: { rewardId: number; points: number }) => {
      const response = await apiRequest("POST", "/api/loyalty/redeem", {
        userId,
        rewardId,
        points,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đổi thưởng thành công!",
        description: "Phần thưởng sẽ được áp dụng trong booking tiếp theo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đổi thưởng",
        description: error.message || "Không thể đổi thưởng lúc này",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Không thể tải thông tin điểm thưởng</p>
        </CardContent>
      </Card>
    );
  }

  const currentLevel = loyaltyLevels.find(level => level.name === loyaltyData.currentLevel);
  const nextLevel = loyaltyData.nextLevel ? loyaltyLevels.find(level => level.name === loyaltyData.nextLevel) : null;
  const progressPercent = nextLevel ? 
    ((loyaltyData.currentPoints - currentLevel!.minPoints) / (nextLevel.minPoints - currentLevel!.minPoints)) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Loyalty Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${currentLevel?.color} flex items-center justify-center text-white`}>
                {currentLevel?.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{loyaltyData.currentPoints.toLocaleString()} điểm</h3>
                <p className="text-muted-foreground">Hạng {loyaltyData.currentLevel}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {loyaltyData.totalEarned.toLocaleString()} điểm tích lũy
            </Badge>
          </div>

          {nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiến độ lên hạng {nextLevel.name}</span>
                <span>{loyaltyData.pointsToNextLevel} điểm nữa</span>
              </div>
              <Progress value={Math.min(progressPercent, 100)} className="h-2" />
            </div>
          )}

          {/* Current Level Benefits */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Quyền lợi hiện tại:</h4>
            <div className="flex flex-wrap gap-2">
              {currentLevel?.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Tabs */}
      <Tabs defaultValue="levels" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="levels">Các hạng thành viên</TabsTrigger>
          <TabsTrigger value="rewards">Đổi thưởng</TabsTrigger>
          <TabsTrigger value="history">Lịch sử điểm</TabsTrigger>
        </TabsList>

        {/* Loyalty Levels */}
        <TabsContent value="levels">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loyaltyLevels.map((level, index) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${level.name === loyaltyData.currentLevel ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${level.color} flex items-center justify-center text-white`}>
                          {level.icon}
                        </div>
                        <h3 className="font-semibold">{level.name}</h3>
                        {level.name === loyaltyData.currentLevel && (
                          <Badge>Hạng hiện tại</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {level.minPoints === 0 ? '0' : level.minPoints.toLocaleString()}
                        {level.maxPoints === Infinity ? '+' : ` - ${level.maxPoints.toLocaleString()}`} điểm
                      </span>
                    </div>
                    <div className="space-y-1">
                      {level.benefits.map((benefit, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-center">
                          <Gift className="w-3 h-3 mr-2" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Rewards */}
        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {redeemableRewards.map((reward: any, index: number) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{reward.name}</h4>
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                      </div>
                      <Badge variant="outline">
                        <Coins className="w-3 h-3 mr-1" />
                        {reward.points}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      variant={loyaltyData.currentPoints >= reward.points ? "default" : "outline"}
                      disabled={loyaltyData.currentPoints < reward.points || redeemRewardMutation.isPending}
                      onClick={() => redeemRewardMutation.mutate({ rewardId: reward.id, points: reward.points })}
                    >
                      {loyaltyData.currentPoints >= reward.points ? "Đổi thưởng" : "Không đủ điểm"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Transaction History */}
        <TabsContent value="history">
          <div className="space-y-3">
            {transactions.map((transaction: PointTransaction, index: number) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'earned' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'earned' ? <TrendingUp size={16} /> : <Gift size={16} />}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar size={14} className="mr-1" />
                            {new Date(transaction.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.points} điểm
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            
            {transactions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Chưa có giao dịch điểm nào</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function LoyaltyBadge({ level, points }: { level: string; points: number }) {
  const currentLevel = loyaltyLevels.find(l => l.name === level);
  
  if (!currentLevel) return null;

  return (
    <Badge className={`bg-gradient-to-r ${currentLevel.color} text-white border-0`}>
      <span className="mr-1">{currentLevel.icon}</span>
      {level} • {points.toLocaleString()} điểm
    </Badge>
  );
}