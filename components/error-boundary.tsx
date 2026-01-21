"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误,显示友好的错误 UI
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary 捕获到错误:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback,使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-orange-950 to-pink-950 p-4">
          <Card className="max-w-2xl w-full bg-red-900/95 backdrop-blur-xl border-4 border-red-400/50 shadow-2xl shadow-red-400/30">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-24 w-24 text-red-400 mx-auto mb-6 animate-bounce" />

              <h1 className="text-4xl font-bold text-red-400 mb-4 drop-shadow-lg">
                出错了!
              </h1>

              <p className="text-xl text-red-100 mb-6">
                应用程序遇到了意外错误
              </p>

              {this.state.error && (
                <div className="bg-black/30 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
                >
                  <RefreshCw className="h-5 w-5" />
                  刷新页面
                </Button>

                <Button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  variant="outline"
                  size="lg"
                  className="border-red-400/60 text-red-100 hover:bg-red-400/20"
                >
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
