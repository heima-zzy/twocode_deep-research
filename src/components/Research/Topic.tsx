"use client";

// 导入必要的React hooks和组件
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  LoaderCircle,
  SquarePlus,
  FilePlus,
  BookText,
  Paperclip,
  Link,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 导入自定义组件
import ResourceList from "@/components/Knowledge/ResourceList";
import Crawler from "@/components/Knowledge/Crawler";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// 导入自定义hooks和store
import useDeepResearch from "@/hooks/useDeepResearch";
import useAiProvider from "@/hooks/useAiProvider";
import useKnowledge from "@/hooks/useKnowledge";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import { useGlobalStore } from "@/store/global";
import { useSettingStore } from "@/store/setting";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";

// 定义表单验证schema
const formSchema = z.object({
  topic: z.string().min(2),
});

function Topic() {
  // 初始化hooks和状态
  // 国际化翻译hook
  const { t } = useTranslation();
  // 文件上传input的ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 任务状态管理store
  const taskStore = useTaskStore();
  // 深度研究相关方法
  const { askQuestions } = useDeepResearch();
  // AI提供者相关方法
  const { hasApiKey } = useAiProvider();
  // 知识库相关方法
  const { getKnowledgeFromFile } = useKnowledge();
  // 精确计时器hook
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  // 思考状态
  const [isThinking, setIsThinking] = useState<boolean>(false);
  // 爬虫弹窗开关状态
  const [openCrawler, setOpenCrawler] = useState<boolean>(false);

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: taskStore.question,
    },
  });

  // 检查API key是否有效
  function handleCheck(): boolean {
    const { mode } = useSettingStore.getState();
    if ((mode === "local" && hasApiKey()) || mode === "proxy") {
      return true;
    } else {
      const { setOpenSetting } = useGlobalStore.getState(); //js语法 拿出其中的一个一个setOpenSetting函数
      setOpenSetting(true);//配置无效时，打开设置面板
      return false;
    }
  }

  // 处理表单提交
  async function handleSubmit(values: z.infer<typeof formSchema>) {
    // 检查API配置是否有效
    if (handleCheck()) {
      // 从任务store中获取id和setQuestion方法
      // 如果你直接调用 useTaskStore(...)，并且通常会传入一个选择器函数 (state => state.something)，那么你正在把它当作一个 React Hook 使用。这必须在组件顶层。
      // 如果你在使用它上面的方法，比如 useTaskStore.getState() 或 useTaskStore.setState()，那么你正在把它当作一个普通对象使用。这可以在任何地方进行。
      const { id, setQuestion } = useTaskStore.getState();
      try {
        // 设置思考状态为true并启动计时器
        setIsThinking(true);
        accurateTimerStart();

        // 如果存在已有研究，则创建新研究并更新表单值
        if (id !== "") {
          createNewResearch();
          form.setValue("topic", values.topic);
        }

        // 更新研究主题
        setQuestion(values.topic);
        // 开始提问流程
        await askQuestions();
      } finally {
        // 无论成功失败都重置状态和停止计时
        setIsThinking(false);
        accurateTimerStop();
      }
    }
  }

  // 创建新的研究
  function createNewResearch() {
    const { id, backup, reset } = useTaskStore.getState();
    const { update } = useHistoryStore.getState();
    if (id) update(id, backup());
    reset();
    form.reset();
  }

  // 打开知识列表
  function openKnowledgeList() {
    const { setOpenKnowledge } = useGlobalStore.getState();
    setOpenKnowledge(true);
  }

  // 处理文件上传
  async function handleFileUpload(files: FileList | null) {
    if (files) {
      for await (const file of files) {
        await getKnowledgeFromFile(file);
      }
      // 清除input文件，避免重复处理
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // 监听问题变化，更新表单
  useEffect(() => {
    form.setValue("topic", taskStore.question);
  }, [taskStore.question, form]);

  // 渲染界面
  return (
    <section className="p-4 border rounded-md mt-4 print:hidden">
      {/* 标题栏 */}
      <div className="flex justify-between items-center border-b mb-2">
        <h3 className="font-semibold text-lg leading-10">
          {t("research.topic.title")}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createNewResearch()}
            title={t("research.common.newResearch")}
          >
            <SquarePlus />
          </Button>
        </div>
      </div>

      {/* 表单部分 */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {/* 主题输入框 */}
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-2 text-base font-semibold">
                  {t("research.topic.topicLabel")}
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder={t("research.topic.topicPlaceholder")}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* 资源列表部分 */}
          <FormItem className="mt-2">
            <FormLabel className="mb-2 text-base font-semibold">
              {t("knowledge.localResourceTitle")}
            </FormLabel>
            <FormControl onSubmit={(ev) => ev.stopPropagation()}>
              <div>
                {/* 显示已添加的资源 */}
                {taskStore.resources.length > 0 ? (
                  <ResourceList
                    className="pb-2 mb-2 border-b"
                    resources={taskStore.resources}
                    onRemove={taskStore.removeResource}
                  />
                ) : null}

                {/* 添加资源下拉菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="inline-flex border p-2 rounded-md text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                      <FilePlus className="w-5 h-5" />
                      <span className="ml-1">{t("knowledge.addResource")}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => openKnowledgeList()}>
                      <BookText />
                      <span>{t("knowledge.knowledge")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleCheck() && fileInputRef.current?.click()
                      }
                    >
                      <Paperclip />
                      <span>{t("knowledge.localFile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCheck() && setOpenCrawler(true)}
                    >
                      <Link />
                      <span>{t("knowledge.webPage")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </FormControl>
          </FormItem>

          {/* 提交按钮 */}
          <Button className="w-full mt-4" disabled={isThinking} type="submit">
            {isThinking ? (
              <>
                <LoaderCircle className="animate-spin" />
                <span>{t("research.common.thinkingQuestion")}</span>
                <small className="font-mono">{formattedTime}</small>
              </>
            ) : taskStore.questions === "" ? (
              t("research.common.startThinking")
            ) : (
              t("research.common.rethinking")
            )}
          </Button>
        </form>
      </Form>

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(ev) => handleFileUpload(ev.target.files)}
      />

      {/* 网页爬虫组件 */}
      <Crawler
        open={openCrawler}
        onClose={() => setOpenCrawler(false)}
      ></Crawler>
    </section>
  );
}

export default Topic;
