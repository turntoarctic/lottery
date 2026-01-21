"use client";

/**
 * 年会抽奖大屏 - 超级炫酷版
 * 左侧：奖品列表（固定宽度）
 * 右侧：3D 球型抽奖动画（铺满剩余空间）
 * 设置按钮：浮动在右上角
 * 中奖弹窗：手动关闭，根据规则决定是否移除人员
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { ThreeErrorBoundary } from "./3d-error-boundary";
import { PrizeListSidebar } from "./prize-list-sidebar";
import { StatsDialog } from "./stats-dialog";
import { WinnersDialog } from "./winners-dialog";
import { ConfirmDrawDialog } from "./confirm-draw-dialog";
import { FloatingButtons } from "./floating-buttons";
import { KeyboardHelpDialog } from "./keyboard-help-dialog";
import type { Prize, User, Rule, Theme, DrawRecord } from "@/app/types";
import { PRIZE_LEVEL_CONFIG } from "@/app/types";
import { toast } from "sonner";

// 懒加载 3D 组件 - 使用修复版
const ThreeDrawAnimation = dynamic(
  () => import("./three-draw-animation-fixed").then((mod) => ({ default: mod.ThreeDrawAnimationFixed })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <Loader2 className="h-20 w-20 animate-spin text-yellow-400 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
          <p className="text-2xl text-purple-200">正在加载 3D 场景...</p>
          <p className="text-sm text-purple-400 mt-2">首次加载可能需要几秒钟</p>
        </div>
      </div>
    ),
  }
);

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

  const loadData = useCallback(async () => {
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
      records.forEach((record: { prizeId: string; userName: string }) => {
        if (!winnersMap[record.prizeId]) {
          winnersMap[record.prizeId] = [];
        }
        winnersMap[record.prizeId].push(record.userName);
      });
      setPrizeWinners(winnersMap);

      // 如果之前有选中的奖品，更新它以获取最新的剩余数量
      setSelectedPrize((prevSelected) => {
        if (prevSelected) {
          const updatedPrize = loadedPrizes.find(
            (p: Prize) => p.id === prevSelected.id,
          );
          return updatedPrize || prevSelected;
        } else if (loadedPrizes.length > 0) {
          // 如果没有选中奖品，选择第一个可用的
          const firstAvailable =
            loadedPrizes.find((p: Prize) => p.remainingCount > 0) ||
            loadedPrizes[0];
          return firstAvailable;
        }
        return null;
      });
    } catch (error) {
      console.error("加载数据失败:", error);
      toast.error("加载数据失败", {
        description: "请检查网络连接后重试",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  const allNames = useMemo(() => users.map((u) => u.name), [users]);

  // 抽奖候选人名单：根据规则决定谁可以中奖
  const eligibleNames = useMemo(() => {
    if (rule && rule.allowRepeatWin) {
      // 允许重复中奖：返回所有人员
      return users.map((u) => u.name);
    } else {
      // 不允许重复中奖：只返回未中奖人员
      return users.filter((u) => !u.hasWon).map((u) => u.name);
    }
  }, [users, rule]);

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
      <StatsDialog
        open={showStats}
        onOpenChange={setShowStats}
        users={users}
        prizes={prizes}
      />

      {/* 浮动管理按钮 - 右上角 */}
      <FloatingButtons
        theme={theme}
        soundEnabled={soundEnabled}
        onToggleStats={() => setShowStats(!showStats)}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      <div className="relative z-10 h-screen flex">
        {/* 左侧：奖品列表（固定宽度） */}
        <PrizeListSidebar
          prizes={prizes}
          selectedPrize={selectedPrize}
          prizeWinners={prizeWinners}
          isDrawing={isDrawing}
          onSelectPrize={handleSelectPrize}
          onRefresh={loadData}
          onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
        />

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
            <ThreeErrorBoundary
              fallbackProps={{
                names: allNames,
                isDrawing,
                winners: showResult ? currentRoundWinners : undefined,
                onClose: handleCloseResult,
              }}
            >
              <ThreeDrawAnimation
                names={allNames}
                isDrawing={isDrawing}
                winners={showResult ? currentRoundWinners : undefined}
                onClose={handleCloseResult}
              />
            </ThreeErrorBoundary>

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
      <WinnersDialog
        open={winnersDialogOpen}
        onOpenChange={setWinnersDialogOpen}
        selectedPrize={selectedPrize}
        currentRoundWinners={currentRoundWinners}
        prizeWinners={prizeWinners}
      />

      {/* 抽奖确认对话框 */}
      <ConfirmDrawDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmDraw}
        selectedPrize={selectedPrize}
        rule={rule}
        users={users}
      />

      {/* 快捷键帮助对话框 */}
      <KeyboardHelpDialog
        open={showKeyboardHelp}
        onOpenChange={setShowKeyboardHelp}
      />
    </div>
  );
}
