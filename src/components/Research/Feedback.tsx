"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, MessageSquare, FileText, Play } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import useDeepResearch from "@/hooks/useDeepResearch";
import useAccurateTimer from "@/hooks/useAccurateTimer";
import { useTaskStore } from "@/store/task";

const MagicDown = dynamic(() => import("@/components/MagicDown"));

const formSchema = z.object({
  feedback: z.string(),
});

function Feedback() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, deepResearch, writeReportPlan } = useDeepResearch();
  const {
    formattedTime,
    start: accurateTimerStart,
    stop: accurateTimerStop,
  } = useAccurateTimer();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isResearch, setIsResaerch] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feedback: taskStore.feedback,
    },
  });

  async function startDeepResearch() {
    try {
      accurateTimerStart();
      setIsResaerch(true);
      await deepResearch();
    } finally {
      setIsResaerch(false);
      accurateTimerStop();
    }
  }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    const { question, questions, setFeedback } = useTaskStore.getState();
    setFeedback(values.feedback);
    const prompt = [
      `Initial Query: ${question}`,
      `Follow-up Questions: ${questions}`,
      `Follow-up Feedback: ${values.feedback}`,
    ].join("\n\n");
    taskStore.setQuery(prompt);
    try {
      accurateTimerStart();
      setIsThinking(true);
      await writeReportPlan();
      setIsThinking(false);
    } finally {
      accurateTimerStop();
    }
  }

  useEffect(() => {
    form.setValue("feedback", taskStore.feedback);
  }, [taskStore.feedback, form]);

  return (
    <section className="space-y-6 print:hidden max-w-4xl mx-auto">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-accent/10 rounded-xl border border-primary/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              {t("research.feedback.title")}
            </h3>
            <p className="text-sm text-muted-foreground">完善研究方向和计划</p>
          </div>
        </div>
      </div>

      {taskStore.questions === "" ? (
        <div className="bg-card rounded-xl border border-border/50 p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("research.feedback.emptyTip")}</p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="text-base font-semibold text-foreground">
                {t("research.feedback.questions")}
              </h4>
            </div>
            <div className="bg-accent/30 rounded-lg p-4 border border-accent">
              <MagicDown
                className="min-h-20"
                value={taskStore.questions}
                onChange={(value) => taskStore.updateQuestions(value)}
              ></MagicDown>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-foreground flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{t("research.feedback.feedbackLabel")}</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder={t("research.feedback.feedbackPlaceholder")}
                        disabled={isThinking}
                        className="border-2 border-input focus:border-primary transition-colors duration-200 rounded-lg"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                type="submit"
                disabled={isThinking}
              >
                {isThinking ? (
                  <>
                    <LoaderCircle className="animate-spin mr-2" />
                    <span>{status}</span>
                    <small className="font-mono ml-2 bg-primary-foreground/20 px-2 py-1 rounded">{formattedTime}</small>
                  </>
                ) : taskStore.reportPlan === "" ? (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    {t("research.common.writeReportPlan")}
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5 mr-2" />
                    {t("research.common.rewriteReportPlan")}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
      
      {taskStore.reportPlan !== "" ? (
        <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="text-base font-semibold text-foreground">
              {t("research.feedback.reportPlan")}
            </h4>
          </div>
          <div className="bg-accent/30 rounded-lg p-4 border border-accent">
            <MagicDown
              className="min-h-20"
              value={taskStore.reportPlan}
              onChange={(value) => taskStore.updateReportPlan(value)}
            ></MagicDown>
          </div>
          <Button
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl text-white"
            onClick={() => startDeepResearch()}
            disabled={isResearch}
          >
            {isResearch ? (
              <>
                <LoaderCircle className="animate-spin mr-2" />
                <span>{status}</span>
                <small className="font-mono ml-2 bg-white/20 px-2 py-1 rounded">{formattedTime}</small>
              </>
            ) : taskStore.tasks.length === 0 ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                {t("research.common.startResearch")}
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                {t("research.common.restartResearch")}
              </>
            )}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export default Feedback;
