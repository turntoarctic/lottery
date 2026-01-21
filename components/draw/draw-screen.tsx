"use client";

/**
 * 年会抽奖大屏 - 超级炫酷版
 * 左侧：奖品列表（固定宽度）
 * 右侧：3D 球型抽奖动画（铺满剩余空间）
 * 设置按钮：浮动在右上角
 * 中奖弹窗：手动关闭，根据规则决定是否移除人员
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  RefreshCw,
  Trophy,
  Gift,
  Zap,
  Crown,
  X,
  Loader2,
  BarChart3,
  Volume2,
  VolumeX,
  Info,
} from "lucide-react";
import Link from "next/link";
import { ThreeDrawAnimation } from "./three-draw-animation";
import type { Prize, User, DrawRecord, Rule, Theme } from "@/app/types";
import { PRIZE_LEVEL_CONFIG } from "@/app/types";
import { toast } from "sonner";

export function DrawScreen() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [prizeWinners, setPrizeWinners] = useState<Record<string, string[]>>(
    {},
  );
  const [rule, setRule] = useState<Rule | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRoundWinners, setCurrentRoundWinners] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [winnersDialogOpen, setWinnersDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadRule();
    loadTheme();

    // 监听来自后台页面的数据更新事件
    const handleDataUpdate = () => {
      console.log("检测到数据更新，正在刷新...");
      loadData();
      toast.info("数据已更新", { duration: 2000 });
    };

    // 监听自定义事件
    window.addEventListener("data-updated", handleDataUpdate);

    // 监听存储变化（当其他标签页更新localStorage时触发）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lottery-data-updated") {
        handleDataUpdate();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 监听广播频道（跨窗口、跨标签页通信）
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel("lottery-data-sync");
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === "data-updated") {
          console.log("收到广播频道消息，正在刷新数据...");
          handleDataUpdate();
        }
      };
    } catch (e) {
      console.log("BroadcastChannel not supported");
    }

    // 清理函数
    return () => {
      window.removeEventListener("data-updated", handleDataUpdate);
      window.removeEventListener("storage", handleStorageChange);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // ESC键 - 关闭弹窗
      if (e.key === "Escape") {
        if (showConfirmDialog) {
          setShowConfirmDialog(false);
        } else if (showResult) {
          handleCloseResult();
        } else if (winnersDialogOpen) {
          setWinnersDialogOpen(false);
        } else if (showStats) {
          setShowStats(false);
        }
        return;
      }

      // 如果正在抽奖或显示结果，不响应其他快捷键
      if (isDrawing || showResult) return;

      // 空格键 - 开始抽奖
      if (e.key === " " && selectedPrize && selectedPrize.remainingCount > 0) {
        e.preventDefault();
        startDraw();
        return;
      }

      // S键 - 统计面板
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setShowStats(!showStats);
        return;
      }

      // R键 - 刷新数据
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        loadData();
        toast.info("数据已刷新", { duration: 2000 });
        return;
      }

      // 数字键1-9 - 快速选择奖品
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        const availablePrizes = prizes.filter((p) => p.remainingCount > 0);
        if (index < availablePrizes.length) {
          setSelectedPrize(availablePrizes[index]);
          toast.info(`已选择：${availablePrizes[index].name}`, {
            duration: 2000,
          });
        }
        return;
      }

      // M键 - 切换音效
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setSoundEnabled(!soundEnabled);
        toast.info(soundEnabled ? "音效已关闭" : "音效已开启", {
          duration: 2000,
        });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isDrawing,
    showResult,
    showConfirmDialog,
    winnersDialogOpen,
    showStats,
    selectedPrize,
    prizes,
    soundEnabled,
    rule,
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prizesRes, usersRes, recordsRes] = await Promise.all([
        fetch("/api/prizes"),
        fetch("/api/users"),
        fetch("/api/records"),
      ]);

      const prizesData = await prizesRes.json();
      const usersData = await usersRes.json();
      const recordsData = await recordsRes.json();

      const loadedPrizes = prizesData.data || [];
      setPrizes(loadedPrizes);
      setUsers(usersData.data || []);

      // 按奖品分组中奖记录
      const winnersMap: Record<string, string[]> = {};
      const records = recordsData.data || [];
      records.forEach((record: DrawRecord) => {
        if (!winnersMap[record.prizeId]) {
          winnersMap[record.prizeId] = [];
        }
        winnersMap[record.prizeId].push(record.userName);
      });
      setPrizeWinners(winnersMap);

      // 如果之前有选中的奖品，更新它以获取最新的剩余数量
      if (selectedPrize) {
        const updatedPrize = loadedPrizes.find(
          (p: Prize) => p.id === selectedPrize.id,
        );
        if (updatedPrize) {
          setSelectedPrize(updatedPrize);
        }
      } else if (loadedPrizes.length > 0) {
        // 如果没有选中奖品，选择第一个可用的
        const firstAvailable =
          loadedPrizes.find((p: Prize) => p.remainingCount > 0) ||
          loadedPrizes[0];
        setSelectedPrize(firstAvailable);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRule = async () => {
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      if (data.success) {
        setRule(data.data);
      }
    } catch (error) {
      console.error("加载规则失败:", error);
    }
  };

  const loadTheme = async () => {
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      if (data.success && data.data) {
        const activeTheme = data.data.find((t: Theme) => t.isActive);
        if (activeTheme) {
          setTheme(activeTheme);
        }
      }
    } catch (error) {
      console.error("加载主题失败:", error);
    }
  };

  const handleSelectPrize = async (prize: Prize) => {
    setSelectedPrize(prize);
    setCurrentRoundWinners([]);
    setShowResult(false);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setCurrentRoundWinners([]);

    // 数据已在抽奖成功后重新加载，这里不需要再次加载
    // 只关闭弹窗即可
  };

  const startDraw = async () => {
    if (!selectedPrize || isDrawing) return;

    // 显示确认对话框
    setShowConfirmDialog(true);
  };

  const confirmDraw = async () => {
    setShowConfirmDialog(false);

    if (!selectedPrize) return;

    setIsDrawing(true);
    setCurrentRoundWinners([]);
    setShowResult(false);

    const eligibleUsers = users.filter(
      (u) => !u.hasWon || (rule && rule.allowRepeatWin),
    );
    if (eligibleUsers.length === 0) {
      toast.error("没有符合条件的候选人", {
        description:
          "所有人员都已中奖，请在后台添加更多人员或修改规则允许重复中奖",
        duration: 5000,
      });
      setIsDrawing(false);
      return;
    }

    // 10秒优雅动画：3秒加速 + 4秒高速 + 3秒减速
    setTimeout(async () => {
      try {
        const response = await fetch("/api/draw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prizeId: selectedPrize.id }),
        });

        const result = await response.json();

        if (result.success) {
          const winnerNames = result.data.winners.map(
            (w: DrawRecord) => w.userName,
          );
          setCurrentRoundWinners(winnerNames);
          setShowResult(true);

          // 播放中奖音效
          if (soundEnabled) {
            // TODO: 添加中奖音效
          }

          toast.success("抽奖成功！", {
            description: `恭喜 ${winnerNames.join("、")} 中奖！`,
            duration: 5000,
          });

          // 立即重新加载数据以更新奖品剩余数量和用户状态
          await loadData();
        } else {
          toast.error("抽奖失败", {
            description: result.error || "未知错误，请重试",
            duration: 5000,
          });
          // 失败时也要重新加载，以防状态不一致
          await loadData();
        }
      } catch (error) {
        console.error("抽奖失败:", error);
        toast.error("抽奖失败", {
          description: "网络错误或服务器异常，请检查网络连接后重试",
          duration: 5000,
        });
        // 出错时也要重新加载
        await loadData();
      } finally {
        setIsDrawing(false);
      }
    }, 10000);
  };

  // 球体展示：始终显示所有人员
  const allNames = users.map((u) => u.name);

  // 抽奖候选人名单：根据规则决定谁可以中奖
  const eligibleNames = (() => {
    if (rule && rule.allowRepeatWin) {
      // 允许重复中奖：返回所有人员
      return users.map((u) => u.name);
    } else {
      // 不允许重复中奖：只返回未中奖人员
      return users.filter((u) => !u.hasWon).map((u) => u.name);
    }
  })();

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${theme?.backgroundColor || "from-indigo-950 via-purple-950 to-pink-950"} text-white overflow-hidden relative`}
    >
      {/* 动态背景光效 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: `${theme?.primaryColor || "#A855F7"}4D` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000"
          style={{ backgroundColor: `${theme?.secondaryColor || "#EC4899"}4D` }}
        />
        <div
          className="absolute top-3/4 left-1/3 w-96 h-96 rounded-full blur-3xl animate-pulse delay-2000"
          style={{ backgroundColor: `${theme?.primaryColor || "#8b5cf6"}4D` }}
        />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2" />

        {/* 移动光点 */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-white/80 rounded-full animate-ping" />
          <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-yellow-400/80 rounded-full animate-ping delay-300" />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-pink-400/80 rounded-full animate-ping delay-700" />
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-400/80 rounded-full animate-ping delay-1000" />
        </div>
      </div>

      {/* 全局加载指示器 */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="h-20 w-20 animate-spin text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
            <p className="text-3xl font-bold text-white drop-shadow-lg animate-pulse">
              加载中...
            </p>
          </div>
        </div>
      )}

      {/* 统计面板 */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
              <BarChart3 className="h-10 w-10 animate-bounce" />
              抽奖统计
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-xl border-2 border-yellow-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-yellow-400 mb-2 drop-shadow-lg">
                {users.length}
              </div>
              <div className="text-lg text-yellow-200">总人数</div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl border-2 border-purple-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-purple-400 mb-2 drop-shadow-lg">
                {users.filter((u) => u.hasWon).length}
              </div>
              <div className="text-lg text-purple-200">已中奖人数</div>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500/20 to-rose-600/20 backdrop-blur-xl border-2 border-pink-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-pink-400 mb-2 drop-shadow-lg">
                {users.filter((u) => !u.hasWon).length}
              </div>
              <div className="text-lg text-pink-200">待抽奖人数</div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-xl border-2 border-blue-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-blue-400 mb-2 drop-shadow-lg">
                {prizes.reduce((sum, p) => sum + p.remainingCount, 0)}
              </div>
              <div className="text-lg text-blue-200">剩余奖品数</div>
            </Card>
            <Card className="col-span-2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl border-2 border-green-400/60 p-6 text-center">
              <div className="text-5xl font-bold text-green-400 mb-2 drop-shadow-lg">
                {prizes.reduce(
                  (sum, p) => sum + (p.totalCount - p.remainingCount),
                  0,
                )}
              </div>
              <div className="text-lg text-green-200">已发放奖品总数</div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* 浮动管理按钮 - 右上角 */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {/* 统计面板按钮 */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowStats(!showStats)}
          className="h-14 w-14 rounded-full shadow-2xl backdrop-blur-xl border-3 border-white/40 hover:scale-110 hover:shadow-lg transition-all duration-300 relative group"
          style={{
            background: `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}CC, ${theme?.secondaryColor || "#EC4899"}CC)`,
            boxShadow: `0 25px 50px -12px ${theme?.primaryColor || "#A855F7"}80`,
          }}
        >
          <BarChart3 className="h-7 w-7 text-white drop-shadow-lg" />
          <span className="absolute right-full mr-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            统计面板
          </span>
        </Button>

        {/* 音效开关按钮 */}
        {/* <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-14 w-14 rounded-full shadow-2xl backdrop-blur-xl border-3 border-white/40 hover:scale-110 hover:shadow-lg transition-all duration-300 relative group"
          style={{
            background: `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}CC, ${theme?.secondaryColor || "#EC4899"}CC)`,
            boxShadow: `0 25px 50px -12px ${theme?.primaryColor || "#A855F7"}80`,
          }}
        >
          {soundEnabled ? (
            <Volume2 className="h-7 w-7 text-white drop-shadow-lg" />
          ) : (
            <VolumeX className="h-7 w-7 text-white drop-shadow-lg" />
          )}
          <span className="absolute right-full mr-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {soundEnabled ? "关闭音效" : "开启音效"}
          </span>
        </Button> */}

        {/* 管理后台按钮 */}
        <Link href="/admin" className="group">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl backdrop-blur-xl border-3 border-white/40 hover:scale-110 hover:shadow-lg  relative"
            style={{
              background: `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}CC, ${theme?.secondaryColor || "#EC4899"}CC)`,
              boxShadow: `0 25px 50px -12px ${theme?.primaryColor || "#A855F7"}80`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}, ${theme?.secondaryColor || "#EC4899"})`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(to bottom right, ${theme?.primaryColor || "#A855F7"}CC, ${theme?.secondaryColor || "#EC4899"}CC)`;
            }}
          >
            <Settings className="h-8 w-8 text-white drop-shadow-lg" />
            <span className="absolute right-full mr-4 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              管理后台
            </span>
          </Button>
        </Link>
      </div>

      <div className="relative z-10 h-screen flex">
        {/* 左侧：奖品列表（固定宽度） */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="p-6 border-b border-white/10 flex items-center gap-2">
            <h2 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
              <Gift className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
              奖品列表
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="  gap-2 cursor-pointer "
            >
              <RefreshCw className="h-4 w-4" />
              {/* 刷新列表 */}
            </Button>
            {/* {rule && (
              <div className="mt-3 text-xs text-purple-300 text-center">
                {rule.allowRepeatWin ? '允许重复中奖' : '不允许重复中奖'}
              </div>
            )} */}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar gap-2">
            {prizes.map((prize, index) => {
              const config = PRIZE_LEVEL_CONFIG[prize.level];
              const isSelected = selectedPrize?.id === prize.id;
              const isFinished = prize.remainingCount === 0;
              const progress =
                prize.totalCount > 0
                  ? ((prize.totalCount - prize.remainingCount) /
                      prize.totalCount) *
                    100
                  : 0;

              return (
                <Card
                  key={prize.id}
                  className={`
                    cursor-pointer transition-all duration-500 backdrop-blur-xl border-2 relative overflow-hidden group
                    ${
                      isSelected
                        ? "bg-gradient-to-br from-white/30 to-white/10 border-yellow-400 shadow-2xl shadow-yellow-400/30 scale-105"
                        : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:bg-white/15 hover:scale-102"
                    }
                    ${isFinished ? "opacity-40 grayscale" : ""}
                  `}
                  onClick={() => !isDrawing && handleSelectPrize(prize)}
                >
                  <CardContent className="p-4 relative flex flex-col items-center">
                    {prize.imageUrl && (
                      <div
                        className="relative h-32 w-full -mx-4 -mt-4 mb-3 cursor-pointer group"
                      >
                        <img
                          src={prize.imageUrl}
                          alt={prize.name}
                          className="w-full rounded-b-sm h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                            点击放大
                          </div>
                        </div> */}
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3 w-full ">
                      <Badge
                        style={{
                          backgroundColor: config.color,
                          boxShadow: `0 0 15px ${config.color}`,
                        }}
                        className="text-sm font-bold border-2 border-white/30 px-3 py-1"
                      >
                        {config.label}
                      </Badge>
                      {isFinished ? (
                        <Badge className="text-xs bg-gray-600 border-2 border-white/20">
                          已抽完
                        </Badge>
                      ) : (
                        isSelected && (
                          <Crown className="h-6 w-6 text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
                        )
                      )}
                    </div>

                    <div className="flex w-full justify-between items-center">
                      <div className="font-bold text-xl mb-3 drop-shadow-lg text-white">
                        {prize.name}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-purple-200">剩余</span>
                        <span
                          className="font-bold text-2xl"
                          style={{
                            color: config.color,
                            textShadow: `0 0 15px ${config.color}`,
                          }}
                        >
                          {prize.remainingCount}
                        </span>
                        <span className="text-purple-200">
                          / {prize.totalCount}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
                      <div
                        className="h-full transition-all duration-700 rounded-full relative"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: config.color,
                          boxShadow: `0 0 20px ${config.color}, inset 0 0 10px rgba(255,255,255,0.3)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                      </div>
                    </div>

                    {/* 中奖名单 */}
                        <div className="w-full">
                                             {prizeWinners[prize.id] &&
                      prizeWinners[prize.id].length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-xs text-purple-200 mb-2">
                            🎉 中奖名单 ({prizeWinners[prize.id].length}人)
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {prizeWinners[prize.id]
                              .slice(0, 6)
                              .map((winner, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/90"
                                >
                                  {winner}
                                </span>
                              ))}
                            {prizeWinners[prize.id].length > 6 && (
                              <span className="text-xs text-purple-300 px-2 py-1">
                                +{prizeWinners[prize.id].length - 6}人
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                        </div>
                  </CardContent>
                </Card>
              );
            })}

            {prizes.length === 0 && (
              <Card className="bg-white/5 border-white/10 border-2">
                <CardContent className="py-12 text-center text-purple-200">
                  <div className="text-6xl mb-4 animate-bounce">🎁</div>
                  <p className="mb-4 text-lg">暂无奖品</p>
                  <Link href="/admin/prizes">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30 border-2 border-white/20"
                    >
                      前往添加
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 底部快捷键帮助按钮 */}
          <div className="p-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKeyboardHelp(true)}
              className="w-full hover:bg-white/10 gap-2 text-purple-300"
            >
              <Info className="h-4 w-4" />
              快捷键帮助 (?)
            </Button>
          </div>
        </div>

        {/* 右侧：3D 抽奖动画区域（铺满剩余空间） */}
        <div className="flex-1 flex flex-col relative">
          {/* 当前奖品信息 - 浮动在顶部 */}
          {selectedPrize && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-3xl px-4">
              <Card className="bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-orange-600/50 backdrop-blur-2xl border-2 border-yellow-400/70 shadow-2xl shadow-yellow-400/40 px-8 py-4">
                <div className="flex items-center gap-4">
                  <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)] animate-bounce" />
                  <div className="text-center flex-1">
                    <div className="text-4xl font-bold text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
                      {selectedPrize.name}
                    </div>
                    <div className="text-sm text-purple-100 mt-1">
                      {PRIZE_LEVEL_CONFIG[selectedPrize.level].label}
                      {" · "}剩余 {selectedPrize.remainingCount} /{" "}
                      {selectedPrize.totalCount}
                    </div>
                  </div>
                  {/* 查看中奖名单按钮 */}
                  {!isDrawing &&
                    (prizeWinners[selectedPrize.id]?.length > 0 ||
                      currentRoundWinners.length > 0) && (
                      <Button
                        onClick={() => setWinnersDialogOpen(true)}
                        variant="outline"
                        className="gap-2 bg-yellow-400/20 hover:bg-yellow-400/30 border-yellow-400/60 text-yellow-100 backdrop-blur-xl"
                      >
                        <Trophy className="h-4 w-4" />
                        查看中奖名单
                        <span className="bg-yellow-400/30 px-2 py-0.5 rounded-full text-xs">
                          {(prizeWinners[selectedPrize.id]?.length || 0) +
                            currentRoundWinners.length}
                        </span>
                      </Button>
                    )}
                  <Trophy className="h-10 w-10 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)] animate-bounce" />
                </div>
              </Card>
            </div>
          )}

          {/* 3D 球体动画区域 - 铺满 */}
          <div className="flex-1 relative">
            <ThreeDrawAnimation
              names={allNames}
              isDrawing={isDrawing}
              winners={showResult ? currentRoundWinners : undefined}
              onClose={handleCloseResult}
            />

            {/* 抽奖按钮 - 浮动在底部中央 */}
            {!isDrawing && !showResult && selectedPrize && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
                <Button
                  onClick={startDraw}
                  disabled={
                    !selectedPrize || selectedPrize.remainingCount === 0
                  }
                  size="lg"
                  className="group px-24 py-12 text-4xl font-bold shadow-2xl border-4 border-white/50 hover:scale-110 transition-all duration-300 relative overflow-hidden rounded-2xl"
                  style={{
                    background: `linear-gradient(to right, ${theme?.primaryColor || "#A855F7"}, ${theme?.secondaryColor || "#EC4899"}, ${theme?.primaryColor || "#A855F7"})`,
                    boxShadow: `0 25px 50px -12px ${theme?.primaryColor || "#A855F7"}CC`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${theme?.secondaryColor || "#EC4899"}, ${theme?.primaryColor || "#A855F7"}, ${theme?.secondaryColor || "#EC4899"})`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${theme?.primaryColor || "#A855F7"}, ${theme?.secondaryColor || "#EC4899"}, ${theme?.primaryColor || "#A855F7"})`;
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Zap className="h-12 w-12 mr-4 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
                  <span className="relative z-10">开始抽奖</span>
                  <Zap className="h-12 w-12 ml-4 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
                </Button>
              </div>
            )}

            {/* 提示信息 - 未选择奖品 */}
            {!selectedPrize && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-9xl mb-8 animate-bounce">🎁</div>
                  <p className="text-4xl text-purple-200 mb-4 font-semibold">
                    请选择一个奖品
                  </p>
                  <p className="text-xl text-purple-300">
                    点击左侧奖品列表开始
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 中奖名单弹窗 */}
      <Dialog open={winnersDialogOpen} onOpenChange={setWinnersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold flex items-center gap-3 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
              <Trophy className="h-10 w-10 animate-bounce" />
              {selectedPrize?.name}
              <span className="text-white/80 text-2xl font-normal">
                - 中奖名单
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            {/* 当前轮中奖名单 */}
            {currentRoundWinners.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-yellow-400 flex items-center gap-2 pb-3 border-b-2 border-yellow-400/30">
                  <span className="text-2xl">🎉</span> 本轮中奖名单
                  <span className="bg-yellow-400/30 px-3 py-1 rounded-full text-sm ml-auto">
                    {currentRoundWinners.length} 人
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentRoundWinners.map((winner, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-gradient-to-br from-yellow-400/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border-3 border-yellow-400/60 p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-105 transition-transform"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      {/* 发光背景 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-orange-500/30 to-pink-500/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse" />

                      {/* 序号 */}
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-lg font-bold text-black shadow-lg">
                        {idx + 1}
                      </div>

                      <div className="relative z-10">
                        <div className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
                          {winner}
                        </div>
                        <div className="text-sm text-yellow-200">🎉 中奖者</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 历史中奖名单 */}
            {selectedPrize && prizeWinners[selectedPrize.id]?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center gap-2 pb-3 border-b-2 border-purple-400/30">
                  <span className="text-2xl">🏆</span> 历史中奖名单
                  <span className="bg-purple-400/30 px-3 py-1 rounded-full text-sm ml-auto">
                    {prizeWinners[selectedPrize.id].length} 人
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {prizeWinners[selectedPrize.id].map((winner, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border-2 border-purple-400/40 p-4 text-center hover:scale-105 transition-transform"
                    >
                      <div className="text-lg font-semibold text-white mb-1 drop-shadow">
                        {winner}
                      </div>
                      <div className="text-xs text-purple-200">🏆 中奖者</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 如果没有中奖记录 */}
            {(!selectedPrize || prizeWinners[selectedPrize.id]?.length === 0) &&
              currentRoundWinners.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6 animate-bounce">🏆</div>
                  <p className="text-2xl text-purple-200 font-semibold">
                    暂无中奖记录
                  </p>
                  <p className="text-sm text-purple-300 mt-2">
                    开始抽奖后将在此显示中奖名单
                  </p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 抽奖确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-yellow-400/50 shadow-2xl shadow-yellow-400/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-3xl font-bold flex items-center gap-3 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]">
              <Trophy className="h-10 w-10 animate-bounce" />
              确认开始抽奖
            </AlertDialogTitle>
            <div className="text-lg text-purple-100 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                  <Gift className="h-5 w-5 text-yellow-400" />
                  <span className="font-semibold">奖品：</span>
                  <span className="text-yellow-300 font-bold">
                    {selectedPrize?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                  <Info className="h-5 w-5 text-blue-400" />
                  <span>剩余数量：</span>
                  <span className="text-yellow-300 font-bold">
                    {selectedPrize?.remainingCount}
                  </span>
                  <span className="text-gray-300">
                    / {selectedPrize?.totalCount}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white/10 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-400" />
                  <span>符合条件人数：</span>
                  <span className="text-green-300 font-bold">
                    {
                      users.filter(
                        (u) => !u.hasWon || (rule && rule.allowRepeatWin),
                      ).length
                    }
                  </span>
                </div>
                <div className="mt-4 p-4 bg-yellow-400/20 border-2 border-yellow-400/50 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ 确认后开始10秒抽奖动画，动画结束后将自动抽取中奖者
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDraw}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8"
            >
              确认开始
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 快捷键帮助对话框 */}
      <Dialog open={showKeyboardHelp} onOpenChange={setShowKeyboardHelp}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-orange-900/95 backdrop-blur-2xl border-4 border-purple-400/50 shadow-2xl shadow-purple-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-purple-300">
              <Info className="h-8 w-8" />
              快捷键帮助
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    空格
                  </kbd>
                </div>
                <span className="text-purple-200">开始抽奖</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                  ESC
                </kbd>
                <span className="text-purple-200">关闭弹窗</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    S
                  </kbd>
                </div>
                <span className="text-purple-200">统计面板</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    R
                  </kbd>
                </div>
                <span className="text-purple-200">刷新数据</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    M
                  </kbd>
                </div>
                <span className="text-purple-200">切换音效</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    1
                  </kbd>
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    2
                  </kbd>
                  <kbd className="px-3 py-1 bg-white/20 rounded-md text-sm font-mono">
                    3
                  </kbd>
                  <span className="text-xs text-purple-400">...</span>
                </div>
                <span className="text-purple-200">快速选择奖品</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 图片预览对话框 */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl bg-black/95 backdrop-blur-2xl border-2 border-white/20 shadow-2xl">
          <div className="relative">
            <img
              src={previewImage || ""}
              alt="预览"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 自定义动画 */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        /* 烟花爆炸效果 */
        @keyframes firework {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(2) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-firework {
          animation: firework 1.5s ease-out forwards;
        }

        /* 星星闪烁效果 */
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .animate-twinkle {
          animation: twinkle 0.8s ease-in-out infinite;
        }

        /* 彩虹旋转 */
        @keyframes rainbow-rotate {
          0% {
            filter: hue-rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
            transform: rotate(360deg);
          }
        }
        .animate-rainbow {
          animation: rainbow-rotate 3s linear infinite;
        }

        /* 弹性放大 */
        @keyframes pop-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .animate-pop-in {
          animation: pop-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        /* 光晕扩散 */
        @keyframes glow-expand {
          0% {
            box-shadow: 0 0 5px rgba(250, 204, 21, 0.5);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(250, 204, 21, 0.8);
            transform: scale(1.05);
          }
          100% {
            box-shadow: 0 0 5px rgba(250, 204, 21, 0.5);
            transform: scale(1);
          }
        }
        .animate-glow {
          animation: glow-expand 2s ease-in-out infinite;
        }

        /* 漂浮动画 */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          75% {
            transform: translateY(10px) rotate(-5deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgba(168, 85, 247, 0.5),
            rgba(236, 72, 153, 0.5)
          );
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            to bottom,
            rgba(168, 85, 247, 0.7),
            rgba(236, 72, 153, 0.7)
          );
        }

        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  );
}
