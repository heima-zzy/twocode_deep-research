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
      // 1.如果你直接调用 useTaskStore(...)，并且通常会传入一个选择器函数 (state => state.something)，
      // 那么你正在把它当作一个 React Hook 使用。这必须在组件顶层。
      // 2.如果你在使用它上面的方法，比如 useTaskStore.getState() 或 useTaskStore.setState()，
      // 那么你正在把它当作一个普通对象使用。这可以在任何地方进行。
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
        // 更新研究主题到store中
        setQuestion(values.topic);
        // await关键字会暂停当前函数的执行，直到askQuestions()这个异步操作完成
        // 这确保了在继续执行后续代码之前，提问流程已经完全结束
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
    <section className="space-y-6 print:hidden max-w-4xl mx-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-accent/10 rounded-xl border border-primary/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <BookText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              {t("research.topic.title")}
            </h3>
            <p className="text-sm text-muted-foreground">开始您的深度研究之旅</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => createNewResearch()}
          title={t("research.common.newResearch")}
          className="border-primary/30 hover:bg-primary/10 hover:border-primary transition-all duration-200"
        >
          <SquarePlus className="w-4 h-4" />
          <span className="ml-2">{t("research.common.newResearch")}</span>
        </Button>
      </div>

      {/* 表单部分 */}

      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 主题输入框 - 用于输入研究主题的文本区域 */}
            <FormField
              control={form.control} // 表单控制器
              name="topic" // 字段名称
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-foreground">
                    {/* 使用i18n的t函数来获取研究主题标签的多语言翻译文本 */}
                    {t("research.topic.topicLabel")}
                  </FormLabel>
                  <FormControl>
                    {/* 多行文本输入框组件 */}
                    <Textarea
                      rows={3} // 设置文本框高度为3行
                      placeholder={t("research.topic.topicPlaceholder")} // 占位文本
                      className="border-2 border-input focus:border-primary transition-colors duration-200 rounded-lg"
                      {...field} // 展开字段属性
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 资源列表部分 */}
            <FormItem className="space-y-4">
              <FormLabel className="text-base font-semibold text-foreground">
                {t("knowledge.localResourceTitle")}
              </FormLabel>
              <FormControl onSubmit={(ev) => ev.stopPropagation()}>
                <div className="space-y-4">
                  {/* 显示已添加的资源 */}
                  {taskStore.resources.length > 0 ? (
                    <div className="bg-accent/30 rounded-lg p-4 border border-accent">
                      <ResourceList
                        className="pb-2 mb-2 border-b border-accent"
                        resources={taskStore.resources}
                        onRemove={taskStore.removeResource}
                      />
                    </div>
                  ) : null}

                  {/* 添加资源下拉菜单 */}
                  {/* 下拉菜单组件，用于添加资源 */}
                  <DropdownMenu>
                    {/* 触发下拉菜单的按钮 */}
                    <DropdownMenuTrigger asChild>
                      <div className="inline-flex border-2 border-dashed border-primary/30 p-3 rounded-lg text-sm cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
                        <FilePlus className="w-5 h-5 text-primary" />
                        <span className="ml-2 font-medium text-primary">{t("knowledge.addResource")}</span>
                      </div>
                    </DropdownMenuTrigger>
                    {/* 下拉菜单内容 */}
                    <DropdownMenuContent>
                      {/* 知识库选项 */}
                      <DropdownMenuItem onClick={() => openKnowledgeList()}>
                        <BookText />
                        <span>{t("knowledge.knowledge")}</span>
                      </DropdownMenuItem>
                      {/* 本地文件选项 - 点击时检查配置并打开文件选择器 */}
                      <DropdownMenuItem
                        onClick={() =>
                          handleCheck() && fileInputRef.current?.click()
                        }
                      >
                        <Paperclip />
                        <span>{t("knowledge.localFile")}</span>
                      </DropdownMenuItem>
                      {/* 网页爬虫选项 - 点击时检查配置并打开爬虫弹窗 */}
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
            <Button 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl" 
              disabled={isThinking} 
              type="submit"
            >
              {isThinking ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" />
                  <span>{t("research.common.thinkingQuestion")}</span>
                  <small className="font-mono ml-2 bg-primary-foreground/20 px-2 py-1 rounded">{formattedTime}</small>
                </>
              ) : taskStore.questions === "" ? (
                <>
                  <BookText className="w-5 h-5 mr-2" />
                  {t("research.common.startThinking")}
                </>
              ) : (
                <>
                  <BookText className="w-5 h-5 mr-2" />
                  {t("research.common.rethinking")}
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>

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
