import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { researchStore } from "@/utils/storage";
import { clone, pick } from "radash";

// 定义知识库存储的接口，包含知识条目数组
export interface KnowledgeStore {
  knowledges: Knowledge[];
}

// 定义知识库操作的函数类型
type KnowledgeFunction = {
  // 保存新的知识条目
  save: (knowledge: Knowledge) => void;
  // 检查指定ID的知识条目是否存在
  exist: (id: string) => boolean;
  // 获取指定ID的知识条目
  get: (id: string) => Knowledge | null;
  // 更新指定ID的知识条目
  update: (id: string, knowledge: Partial<Knowledge>) => boolean;
  // 删除指定ID的知识条目
  remove: (id: string) => boolean;
};

// 创建并导出知识库存储钩子
export const useKnowledgeStore = create(
  persist<KnowledgeStore & KnowledgeFunction>(
    (set, get) => ({
      // 初始化空知识库数组
      knowledges: [],
      // 保存新知识条目到数组开头
      save: (knowledge) => {
        set((state) => ({ knowledges: [knowledge, ...state.knowledges] }));
      },
      // 检查知识条目是否存在
      exist: (id) => {
        const { knowledges } = get();
        const knowledge = knowledges.find((item) => item.id === id);
        return !!knowledge;
      },
      // 获取并克隆知识条目
      get: (id) => {
        const current = get().knowledges.find((item) => item.id === id);
        return current ? clone(current) : null;
      },
      // 更新知识条目并添加更新时间
      update: (id, knowledge) => {
        const newKnowledges = get().knowledges.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              ...clone(knowledge),
              updatedAt: Date.now(),
            };
          } else {
            return item;
          }
        });
        set(() => ({ knowledges: [...newKnowledges] }));
        return true;
      },
      // 移除指定知识条目
      remove: (id) => {
        set((state) => ({
          knowledges: state.knowledges.filter((item) => item.id !== id),
        }));
        return true;
      },
    }),
    {
      // 持久化配置
      name: "knowledgeStore",
      version: 1,
      storage: {
        // 从存储中获取数据
        getItem: async (key: string) => {
          return await researchStore.getItem<
            StorageValue<KnowledgeStore & KnowledgeFunction>
          >(key);
        },
        // 将数据保存到存储中
        setItem: async (
          key: string,
          store: StorageValue<KnowledgeStore & KnowledgeFunction>
        ) => {
          return await researchStore.setItem(key, {
            state: pick(store.state, ["knowledges"]),
            version: store.version,
          });
        },
        // 从存储中删除数据
        removeItem: async (key: string) => await researchStore.removeItem(key),
      },
    }
  )
);
