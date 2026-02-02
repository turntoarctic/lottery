import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * 数据同步 Hook
 * 处理跨窗口、跨标签页的数据同步
 */
export function useDrawDataSync(onDataUpdate: () => void) {
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('检测到数据更新，正在刷新...');
      onDataUpdate();
      toast.info('数据已更新', { duration: 2000 });
    };

    // 监听自定义事件
    window.addEventListener('data-updated', handleDataUpdate);

    // 监听存储变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lottery-data-updated') {
        handleDataUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 监听广播频道（跨窗口通信）
    let broadcastChannel: BroadcastChannel | null = null;
    try {
      broadcastChannel = new BroadcastChannel('lottery-data-sync');
      broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'data-updated') {
          console.log('收到广播频道消息，正在刷新数据...');
          handleDataUpdate();
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not supported');
    }

    // 清理函数
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
      broadcastChannel?.close();
    };
  }, [onDataUpdate]);
}
