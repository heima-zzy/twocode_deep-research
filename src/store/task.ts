import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pick } from "radash";
//import { useTaskStore } from './store/task'

export interface TaskStore {
  id: string;
  question: string;
  resources: Resource[];
  query: string;
  questions: string;
  feedback: string;
  reportPlan: string;
  suggestion: string;
  tasks: SearchTask[];
  requirement: string;
  title: string;
  finalReport: string;
  sources: Source[];
  images: ImageSource[];
  knowledgeGraph: string;
}

interface TaskFunction {
  update: (tasks: SearchTask[]) => void;
  setId: (id: string) => void;
  setTitle: (title: string) => void;
  setSuggestion: (suggestion: string) => void;
  setRequirement: (requirement: string) => void;
  setQuery: (query: string) => void;
  updateTask: (query: string, task: Partial<SearchTask>) => void;
  removeTask: (query: string) => boolean;
  setQuestion: (question: string) => void;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, resource: Partial<Resource>) => void;
  removeResource: (id: string) => boolean;
  updateQuestions: (questions: string) => void;
  updateReportPlan: (plan: string) => void;
  updateFinalReport: (report: string) => void;
  setSources: (sources: Source[]) => void;
  setImages: (images: Source[]) => void;
  setFeedback: (feedback: string) => void;
  updateKnowledgeGraph: (knowledgeGraph: string) => void;
  clear: () => void;
  reset: () => void;
  backup: () => TaskStore;
  restore: (taskStore: TaskStore) => void;
}

const defaultValues: TaskStore = {
  id: "",
  question: "",
  resources: [],
  query: "",
  questions: "",
  feedback: "",
  reportPlan: "",
  suggestion: "",
  tasks: [],
  requirement: "",
  title: "",
  finalReport: "",
  sources: [],
  images: [],
  knowledgeGraph: "",
};

// Zustand是一个轻量级的状态管理库,这里创建了一个任务管理的store
// persist中间件使store的数据可以持久化保存到localStorage
export const useTaskStore = create(
  persist<TaskStore & TaskFunction>(
    (set, get) => ({
      ...defaultValues, // 初始化默认值
      
      // 更新整个任务列表
      update: (tasks) => set(() => ({ tasks: [...tasks] })),
      
      // 设置基本信息
      setId: (id) => set(() => ({ id })),
      setTitle: (title) => set(() => ({ title })),
      setSuggestion: (suggestion) => set(() => ({ suggestion })),
      setRequirement: (requirement) => set(() => ({ requirement })),
      setQuery: (query) => set(() => ({ query })),
      
      // 任务相关操作
      updateTask: (query, task) => {
        const newTasks = get().tasks.map((item) => {
          return item.query === query ? { ...item, ...task } : item;
        });
        set(() => ({ tasks: [...newTasks] }));
      },
      removeTask: (query) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.query !== query),
        }));
        return true;
      },
      
      // 问题和资源管理
      setQuestion: (question) => set(() => ({ question })),
      addResource: (resource) =>
        set((state) => ({ resources: [resource, ...state.resources] })),
      updateResource: (id, resource) => {
        const newResources = get().resources.map((item) => {
          return item.id === id ? { ...item, ...resource } : item;
        });
        set(() => ({ resources: [...newResources] }));
      },
      removeResource: (id) => {
        set((state) => ({
          resources: state.resources.filter((resource) => resource.id !== id),
        }));
        return true;
      },
      
      // 更新报告相关内容
      updateQuestions: (questions) => set(() => ({ questions })),
      updateReportPlan: (plan) => set(() => ({ reportPlan: plan })),
      updateFinalReport: (report) => set(() => ({ finalReport: report })),
      
      // 设置资源和反馈
      setSources: (sources) => set(() => ({ sources })),
      setImages: (images) => set(() => ({ images })),
      setFeedback: (feedback) => set(() => ({ feedback })),
      updateKnowledgeGraph: (knowledgeGraph) => set(() => ({ knowledgeGraph })),
      
      // 状态管理工具函数
      clear: () => set(() => ({ tasks: [] })),
      reset: () => set(() => ({ ...defaultValues })),
      backup: () => {
        return {
          ...pick(get(), Object.keys(defaultValues) as (keyof TaskStore)[]),
        } as TaskStore;
      },
      restore: (taskStore) => set(() => ({ ...taskStore })),
    }),
    { name: "research" } // store的名称,用于持久化存储
  )
);

/* 使用方法:
1. 在组件中引入:
2. 在组件中使用:
const { tasks, update, setTitle } = useTaskStore()

3. 读取状态:
console.log(tasks)

4. 更新状态:
setTitle('新标题')
update(newTasks)

5. 状态会自动保存到localStorage
*/
