"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  LoaderCircle,
  CircleCheck,
  TextSearch,
  Download,
  Trash,
  RotateCcw,
  NotebookText,
} from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import useDeepResearch from "@/hooks/useDeepResearch";
import useKnowledge from "@/hooks/useKnowledge";
import { useTaskStore } from "@/store/task";
import { useKnowledgeStore } from "@/store/knowledge";
import { downloadFile } from "@/utils/file";

const MagicDown = dynamic(() => import("@/components/MagicDown"));
const MagicDownView = dynamic(() => import("@/components/MagicDown/View"));
const Lightbox = dynamic(() => import("@/components/Internal/Lightbox"));

const formSchema = z.object({
  suggestion: z.string().optional(),
});

function addQuoteBeforeAllLine(text: string = "") {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

function TaskState({ state }: { state: SearchTask["state"] }) {
  if (state === "completed") {
    return <CircleCheck className="h-5 w-5" />;
  } else if (state === "processing") {
    return <LoaderCircle className="animate-spin h-5 w-5" />;
  } else {
    return <TextSearch className="h-5 w-5" />;
  }
}

function SearchResult() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, runSearchTask, reviewSearchResult } = useDeepResearch();
  const { generateId } = useKnowledge();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const unfinishedTasks = useMemo(() => {
    return taskStore.tasks.filter((item) => item.state !== "completed");
  }, [taskStore.tasks]);
  const taskFinished = useMemo(() => {
    return taskStore.tasks.length > 0 && unfinishedTasks.length === 0;
  }, [taskStore.tasks, unfinishedTasks]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestion: taskStore.suggestion,
    },
  });

  function getSearchResultContent(item: SearchTask) {
    return [
      `## ${item.query}`,
      addQuoteBeforeAllLine(item.researchGoal),
      "---",
      item.learning,
      item.images?.length > 0
        ? `#### ${t("research.searchResult.relatedImages")}\n\n${item.images
            .map(
              (source) =>
                `![${source.description || source.url}](${source.url})`
            )
            .join("\n")}`
        : "",
      item.sources?.length > 0
        ? `#### ${t("research.common.sources")}\n\n${item.sources
            .map(
              (source, idx) =>
                `${idx + 1}. [${source.title || source.url}][${idx + 1}]`
            )
            .join("\n")}`
        : "",
    ].join("\n\n");
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { setSuggestion } = useTaskStore.getState();
    try {
      accurateTimerStart();
      setIsThinking(true);
      if (unfinishedTasks.length > 0) {
        await runSearchTask(unfinishedTasks);
      } else {
        if (values.suggestion) setSuggestion(values.suggestion);
        await reviewSearchResult();
        // Clear previous research suggestions
        setSuggestion("");
      }
    } finally {
      setIsThinking(false);
      accurateTimerStop();
    }
  }

  function addToKnowledgeBase(item: SearchTask) {
    const { save } = useKnowledgeStore.getState();
    const currentTime = Date.now();
    save({
      id: generateId("knowledge"),
      title: item.query,
      content: getSearchResultContent(item),
      type: "knowledge",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    toast.message(t("research.common.addToKnowledgeBaseTip"));
  }

  async function handleRetry(query: string, researchGoal: string) {
    const { updateTask } = useTaskStore.getState();
    const newTask: SearchTask = {
      query,
      researchGoal,
      learning: "",
      sources: [],
      images: [],
      state: "unprocessed",
    };
    updateTask(query, newTask);
    await runSearchTask([newTask]);
  }

  function handleRemove(query: string) {
    const { removeTask } = useTaskStore.getState();
    removeTask(query);
  }

  useEffect(() => {
    form.setValue("suggestion", taskStore.suggestion);
  }, [taskStore.suggestion, form]);

  return (
    <section className="space-y-6 print:hidden max-w-4xl mx-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-accent/10 rounded-xl border border-primary/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <TextSearch className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              {t("research.searchResult.title")}
            </h3>
            <p className="text-sm text-muted-foreground">收集和整理研究信息</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
        {taskStore.tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <TextSearch className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">{t("research.searchResult.emptyTip")}</p>
            </div>
          </div>
        ) : (
        <div>
          <Accordion className="mb-4" type="multiple">
            {taskStore.tasks.map((item, idx) => {
              return (
                <AccordionItem key={idx} value={item.query}>
                  <AccordionTrigger>
                    <div className="flex">
                      <TaskState state={item.state} />
                      <span className="ml-1">{item.query}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose prose-slate dark:prose-invert max-w-full min-h-20">
                    <MagicDownView>
                      {addQuoteBeforeAllLine(item.researchGoal)}
                    </MagicDownView>
                    <Separator className="mb-4" />
                    <MagicDown
                      value={item.learning}
                      onChange={(value) =>
                        taskStore.updateTask(item.query, { learning: value })
                      }
                      tools={
                        <>
                          <div className="px-1">
                            <Separator className="dark:bg-slate-700" />
                          </div>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.restudy")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              handleRetry(item.query, item.researchGoal)
                            }
                          >
                            <RotateCcw />
                          </Button>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.delete")}
                            side="left"
                            sideoffset={8}
                            onClick={() => handleRemove(item.query)}
                          >
                            <Trash />
                          </Button>
                          <div className="px-1">
                            <Separator className="dark:bg-slate-700" />
                          </div>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.addToKnowledgeBase")}
                            side="left"
                            sideoffset={8}
                            onClick={() => addToKnowledgeBase(item)}
                          >
                            <NotebookText />
                          </Button>
                          <Button
                            className="float-menu-button"
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={t("research.common.export")}
                            side="left"
                            sideoffset={8}
                            onClick={() =>
                              downloadFile(
                                getSearchResultContent(item),
                                `${item.query}.md`,
                                "text/markdown;charset=utf-8"
                              )
                            }
                          >
                            <Download />
                          </Button>
                        </>
                      }
                    ></MagicDown>
                    {item.images?.length > 0 ? (
                      <>
                        <hr className="my-6" />
                        <h4>{t("research.searchResult.relatedImages")}</h4>
                        <Lightbox data={item.images}></Lightbox>
                      </>
                    ) : null}
                    {item.sources?.length > 0 ? (
                      <>
                        <hr className="my-6" />
                        <h4>{t("research.common.sources")}</h4>
                        <ol>
                          {item.sources.map((source, idx) => {
                            return (
                              <li className="ml-2" key={idx}>
                                <a href={source.url} target="_blank">
                                  {source.title || source.url}
                                </a>
                              </li>
                            );
                          })}
                        </ol>
                      </>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="suggestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mb-2 font-semibold">
                      {t("research.searchResult.suggestionLabel")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t(
                          "research.searchResult.suggestionPlaceholder"
                        )}
                        disabled={isThinking}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                className="w-full mt-4"
                type="submit"
                variant="default"
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <LoaderCircle className="animate-spin" />
                    <span>{status}</span>
                    <small className="font-mono">{formattedTime}</small>
                  </>
                ) : taskFinished ? (
                  t("research.common.indepthResearch")
                ) : (
                  t("research.common.continueResearch")
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
      </div>
    </section>
  );
}

export default SearchResult;
