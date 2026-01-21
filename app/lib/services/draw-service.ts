/**
 * 抽奖核心业务逻辑
 * 后期接数据库时，此文件基本保持不变
 * 只需替换下层的 storage 实现
 */

import type { Prize, User, DrawRecord, DrawRequest, DrawResponse } from '../../types';
import { storage, generateId, now } from '../repositories/memory-storage';

export class DrawService {
  /**
   * 执行抽奖
   * @param request 抽奖请求
   * @returns 抽奖结果
   */
  async draw(request: DrawRequest): Promise<DrawResponse> {
    console.log('DrawService.draw - 开始抽奖, prizeId:', request.prizeId);

    // 1. 获取奖品
    const prize = storage.getPrizeById(request.prizeId);
    console.log('找到奖品:', prize);

    if (!prize) {
      console.error('奖品不存在, ID:', request.prizeId);
      console.error('当前所有奖品:', storage.getPrizes());
      return {
        success: false,
        winners: [],
        remainingCount: 0,
        message: '奖品不存在',
      };
    }

    // 2. 检查奖品剩余数量
    if (prize.remainingCount <= 0) {
      return {
        success: false,
        winners: [],
        remainingCount: 0,
        message: '该奖品已抽完',
      };
    }

    // 3. 获取抽奖规则
    const rule = storage.getRule();
    const drawCount = request.count ?? rule.drawCountPerRound;

    // 4. 实际可抽取数量（不能超过剩余数量）
    const actualCount = Math.min(drawCount, prize.remainingCount);

    // 5. 获取候选人池
    const candidates = this.getCandidates(rule.allowRepeatWin);

    if (candidates.length === 0) {
      return {
        success: false,
        winners: [],
        remainingCount: prize.remainingCount,
        message: '没有符合条件的候选人',
      };
    }

    // 6. 随机抽取中奖者
    const winners = this.randomPick(candidates, actualCount);

    // 7. 创建抽奖记录
    const drawRecords: DrawRecord[] = winners.map((user, index) => {
      const record: DrawRecord = {
        id: generateId(),
        prizeId: prize.id,
        prizeName: prize.name,
        prizeLevel: prize.level,
        userId: user.id,
        userName: user.name,
        round: rule.currentRound,
        createdAt: now(),
        updatedAt: now(),
      };
      return record;
    });

    // 8. 保存抽奖记录
    drawRecords.forEach(record => {
      storage.createDrawRecord(record);

      // 标记用户已中奖
      const user = storage.getUserById(record.userId);
      if (user) {
        user.hasWon = true;
        storage.updateUser(user);
      }
    });

    // 9. 更新奖品剩余数量
    prize.remainingCount -= actualCount;
    storage.updatePrize(prize);

    // 10. 如果该奖品已抽完，进入下一轮
    if (prize.remainingCount === 0) {
      storage.incrementRound();
    }

    return {
      success: true,
      winners: drawRecords,
      remainingCount: prize.remainingCount,
    };
  }

  /**
   * 获取候选人池
   * @param allowRepeatWin 是否允许重复中奖
   * @returns 候选人列表
   */
  private getCandidates(allowRepeatWin: boolean): User[] {
    if (allowRepeatWin) {
      return storage.getAllUsersForDraw();
    }
    return storage.getEligibleUsers();
  }

  /**
   * 随机抽取 N 个用户
   * 使用 Fisher-Yates 洗牌算法保证公平性
   * @param users 候选用户列表
   * @param count 抽取数量
   * @returns 中奖用户列表
   */
  private randomPick(users: User[], count: number): User[] {
    if (count >= users.length) {
      return [...users];
    }

    // Fisher-Yates 洗牌算法
    const shuffled = [...users];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  /**
   * 获取当前可抽取的奖品列表
   */
  getAvailablePrizes(): Prize[] {
    return storage.getPrizes().filter(prize => prize.remainingCount > 0);
  }

  /**
   * 获取所有奖品
   */
  getAllPrizes(): Prize[] {
    return storage.getPrizes();
  }

  /**
   * 重置抽奖数据（清空记录，恢复奖品数量）
   * 用于测试或重新开始
   */
  resetDraw(): void {
    // 清空抽奖记录
    const records = storage.getDrawRecords();
    records.forEach(record => {
      storage.getDrawRecords(); // 这里有问题，应该是清空操作
    });

    // 恢复用户状态
    const users = storage.getUsers();
    users.forEach(user => {
      user.hasWon = false;
      storage.updateUser(user);
    });

    // 恢复奖品数量
    const prizes = storage.getPrizes();
    prizes.forEach(prize => {
      prize.remainingCount = prize.totalCount;
      storage.updatePrize(prize);
    });

    // 重置轮次
    storage.updateRule({ currentRound: 1 });
  }
}

// ==================== 单例导出 ====================

export const drawService = new DrawService();
