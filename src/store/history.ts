import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type { TaskStore } from "./task";
import { researchStore } from "@/utils/storage";
import { customAlphabet } from "nanoid";
import { clone, pick } from "radash";

export interface ResearchHistory extends TaskStore {
  createdAt: number;
  updatedAt?: number;
}

export interface HistoryStore {
  history: ResearchHistory[];
}

interface HistoryFunction {
  save: (taskStore: TaskStore) => string;
  load: (id: string) => TaskStore | void;
  update: (id: string, taskStore: TaskStore) => boolean;
  remove: (id: string) => boolean;
}

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

export const useHistoryStore = create(
  persist<HistoryStore & HistoryFunction>(
    (set, get) => ({
      // 存储历史记录的数组
      history: [],

      // 保存任务到历史记录
      // @param taskStore - 要保存的任务数据
      // @returns 成功返回新生成的id，失败返回空字符串
      save: (taskStore) => {
        // Only tasks with a title and final report are saved to the history
        if (taskStore.title && taskStore.finalReport) {
          const id = nanoid();
          // 创建新的历史记录对象，包含任务数据的深拷贝和创建时间
          const newHistory: ResearchHistory = {
            ...clone(taskStore),
            id,
            createdAt: Date.now(),
          };
          // 将新记录添加到历史记录数组的开头
          set((state) => ({ history: [newHistory, ...state.history] }));
          return id;
        }
        return "";
      },

      // 根据id加载历史记录
      // @param id - 历史记录id
      // @returns 返回历史记录的深拷贝，未找到则返回undefined
      load: (id) => {
        const current = get().history.find((item) => item.id === id);
        if (current) return clone(current);
      },

      // 更新指定id的历史记录
      // @param id - 要更新的历史记录id
      // @param taskStore - 新的任务数据
      // @returns 始终返回true
      update: (id, taskStore) => {
        const newHistory = get().history.map((item) => {
          if (item.id === id) {
            // 更新匹配id的记录，添加更新时间
            return {
              ...clone(taskStore),
              updatedAt: Date.now(),
            } as ResearchHistory;
          } else {
            return item;
          }
        });
        set(() => ({ history: [...newHistory] }));
        return true;
      },

      // 删除指定id的历史记录
      // @param id - 要删除的历史记录id
      // @returns 始终返回true
      remove: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
        return true;
      },
    }),
    {
      // 持久化配置
      name: "historyStore", // 存储键名
      version: 1, // 版本号
      storage: {
        // 自定义存储实现
        // 从存储中获取数据
        getItem: async (key: string) => {
          return await researchStore.getItem<
            StorageValue<HistoryStore & HistoryFunction>
          >(key);
        },
        // 将数据保存到存储
        setItem: async (
          key: string,
          store: StorageValue<HistoryStore & HistoryFunction>
        ) => {
          return await researchStore.setItem(key, {
            state: pick(store.state, ["history"]), // 只保存history字段
            version: store.version,
          });
        },
        // 从存储中删除数据
        removeItem: async (key: string) => await researchStore.removeItem(key),
      },
    }
  )
);
