"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ThreeDrawAnimationProps } from "./three-draw-animation-fixed";
import { ThreeFallback } from "./three-fallback";

interface Props {
  children: React.ReactNode;
  fallbackProps?: ThreeDrawAnimationProps;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 3D 组件专用错误边界
 * 当 3D 渲染失败时,自动切换到降级版本
 */
export class ThreeErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("3D 组件错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 如果有 fallbackProps,使用降级组件
      if (this.props.fallbackProps) {
        return <ThreeFallback {...this.props.fallbackProps} />;
      }

      // 否则显示错误提示
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
          <Card className="max-w-lg w-full mx-4 bg-slate-900/95 backdrop-blur-xl border-4 border-yellow-400/50 shadow-2xl">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-20 w-20 text-yellow-400 mx-auto mb-6 animate-pulse" />

              <h2 className="text-3xl font-bold text-yellow-400 mb-4">
                3D 渲染失败
              </h2>

              <p className="text-lg text-slate-200 mb-6">
                3D 动画组件加载失败,已自动切换到简化版本
              </p>

              {this.state.error && (
                <div className="bg-black/30 rounded-lg p-3 mb-6 text-left">
                  <p className="text-xs text-slate-400 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold"
              >
                <RefreshCw className="h-4 w-4" />
                重试 3D 渲染
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
