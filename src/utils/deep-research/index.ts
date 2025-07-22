import { streamText, generateText } from "ai";
import { type GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { createAIProvider } from "./provider";
import { createSearchProvider } from "./search";
import {
  getSystemPrompt,
  writeReportPlanPrompt,
  generateSerpQueriesPrompt,
  processResultPrompt,
  processSearchResultPrompt,
  writeFinalReportPrompt,
  getSERPQuerySchema,
} from "./prompts";
import { outputGuidelinesPrompt } from "@/constants/prompts";
import { isNetworkingModel } from "@/utils/model";
import { ThinkTagStreamProcessor, removeJsonMarkdown } from "@/utils/text";
import { pick, unique, flat, isFunction } from "radash";

export interface DeepResearchOptions {
  AIProvider: {
    baseURL: string;
    apiKey?: string;
    provider: string;
    thinkingModel: string;
    taskModel: string;
  };
  searchProvider: {
    baseURL: string;
    apiKey?: string;
    provider: string;
    maxResult?: number;
  };
  language?: string;
  onMessage?: (event: string, data: any) => void;
}

interface FinalReportResult {
  title: string;
  finalReport: string;
  learnings: string[];
  sources: Source[];
  images: ImageSource[];
}

export interface DeepResearchSearchTask {
  query: string;
  researchGoal: string;
}

export interface DeepResearchSearchResult {
  query: string;
  researchGoal: string;
  learning: string;
  sources?: {
    url: string;
    title?: string;
  }[];
  images?: {
    url: string;
    description?: string;
  }[];
}

// Function to add a quote before each line of a string
function addQuoteBeforeAllLine(text: string = "") {
  // Split the string into an array of lines
  return text
    .split("\n")
    // Map each line to a new line with a quote before it
    .map((line) => `> ${line}`)
    .join("\n");
}

class DeepResearch {
  protected options: DeepResearchOptions;
  onMessage: (event: string, data: any) => void = () => {};
  constructor(options: DeepResearchOptions) {
    this.options = options;
    if (isFunction(options.onMessage)) {
      this.onMessage = options.onMessage;
    }
  }

// 异步获取思考模型
  async getThinkingModel() {
    // 获取AIProvider
    const { AIProvider } = this.options;
    // 获取AIProvider的baseURL和apiKey
    const AIProviderBaseOptions = pick(AIProvider, ["baseURL", "apiKey"]);
    // 创建AIProvider
    return await createAIProvider({
      // AIProvider的provider
      provider: AIProvider.provider,
      // AIProvider的thinkingModel
      model: AIProvider.thinkingModel,
      // AIProvider的baseURL和apiKey
      ...AIProviderBaseOptions,
    });
  }

  async getTaskModel() {
    const { AIProvider } = this.options;
    const AIProviderBaseOptions = pick(AIProvider, ["baseURL", "apiKey"]);
    return await createAIProvider({
      provider: AIProvider.provider,
      model: AIProvider.taskModel,
      settings:
        AIProvider.provider === "google" &&
        isNetworkingModel(AIProvider.taskModel)
          ? { useSearchGrounding: true }
          : undefined,
      ...AIProviderBaseOptions,
    });
  }

  getResponseLanguagePrompt() {
    return this.options.language
      ? `**Respond in ${this.options.language}**`
      : `**Respond in the same language as the user's language**`;
  }

// 异步写入报告计划
  async writeReportPlan(query: string): Promise<string> {
    // 发送开始报告计划的消息
    this.onMessage("progress", { step: "report-plan", status: "start" });
    // 创建ThinkTagStreamProcessor实例
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    // 调用streamText函数，传入模型、系统提示和报告计划提示
    const result = streamText({
      model: await this.getThinkingModel(),
      system: getSystemPrompt(),
      prompt: [
        writeReportPlanPrompt(query),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    // 初始化内容变量
    let content = "";
    // 发送报告计划开始的消息
    this.onMessage("message", { type: "text", text: "<report-plan>\n" });
    // 遍历结果流
    for await (const part of result.fullStream) {
      // 如果类型为文本增量
      if (part.type === "text-delta") {
        // 处理文本增量
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            // 将数据添加到内容变量中
            content += data;
            // 发送文本消息
            this.onMessage("message", { type: "text", text: data });
          },
          (data) => {
            // 发送推理消息
            this.onMessage("reasoning", { type: "text", text: data });
          }
        );
      // 如果类型为推理
      } else if (part.type === "reasoning") {
        // 发送推理消息
        this.onMessage("reasoning", { type: "text", text: part.textDelta });
      }
    }
    // 发送报告计划结束的消息
    this.onMessage("message", { type: "text", text: "\n</report-plan>\n\n" });
    // 发送报告计划结束的消息，并附带内容
    this.onMessage("progress", {
      step: "report-plan",
      status: "end",
      data: content,
    });
    // 返回内容
    return content;
  }

// 异步生成SERP查询
  async generateSERPQuery(
    reportPlan: string
  ): Promise<DeepResearchSearchTask[]> {
    // 发送消息，表示开始生成SERP查询
    this.onMessage("progress", { step: "serp-query", status: "start" });
    // 创建ThinkTagStreamProcessor实例
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    // 生成文本
    const { text } = await generateText({
      model: await this.getThinkingModel(),
      system: getSystemPrompt(),
      prompt: [
        generateSerpQueriesPrompt(reportPlan),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    // 获取SERP查询模式
    const querySchema = getSERPQuerySchema();
    let content = "";
    // 处理文本块
    thinkTagStreamProcessor.processChunk(text, (data) => {
      content += data;
    });
    // 解析JSON
    const data = JSON.parse(removeJsonMarkdown(content));
    // 结束处理
    thinkTagStreamProcessor.end();
    // 解析数据
    const result = querySchema.safeParse(data);
    if (result.success) {
      // 将数据转换为DeepResearchSearchTask数组
      const tasks: DeepResearchSearchTask[] = data.map(
        (item: { query: string; researchGoal?: string }) => ({
          query: item.query,
          researchGoal: item.researchGoal || "",
        })
      );
      // 发送消息，表示生成SERP查询结束
      this.onMessage("progress", {
        step: "serp-query",
        status: "end",
        data: tasks,
      });
      // 返回任务数组
      return tasks;
    } else {
      // 抛出错误
      throw new Error(result.error.message);
    }
  }

// 定义一个异步函数runSearchTask，用于执行搜索任务
  async runSearchTask(
    tasks: DeepResearchSearchTask[], // 搜索任务列表
    enableReferences = true // 是否启用引用
  ): Promise<SearchTask[]> { // 返回一个Promise，包含搜索任务的结果
    this.onMessage("progress", { step: "task-list", status: "start" }); // 发送消息，表示任务列表开始
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor(); // 创建一个ThinkTagStreamProcessor实例
    const results: SearchTask[] = []; // 创建一个空数组，用于存储搜索任务的结果
    for await (const item of tasks) { // 遍历搜索任务列表
      this.onMessage("progress", {
        step: "search-task",
        status: "start",
        name: item.query,
      }); // 发送消息，表示搜索任务开始
      let content = ""; // 创建一个空字符串，用于存储搜索结果
      let searchResult;
      let sources: Source[] = []; // 创建一个空数组，用于存储搜索结果中的来源
      let images: ImageSource[] = []; // 创建一个空数组，用于存储搜索结果中的图片
      const { taskModel } = this.options.AIProvider; // 获取AIProvider中的taskModel
      const { provider = "model", maxResult = 5 } = this.options.searchProvider; // 获取searchProvider中的provider和maxResult
      if (provider === "model") { // 如果provider为model
        const getTools = async () => {
          // Enable OpenAI's built-in search tool
          if (
            provider === "model" &&
            ["openai", "azure"].includes(taskModel) &&
            taskModel.startsWith("gpt-4o")
          ) { // 如果provider为model且taskModel为openai或azure且taskModel以gpt-4o开头
            const { openai } = await import("@ai-sdk/openai"); // 导入openai模块
            return {
              web_search_preview: openai.tools.webSearchPreview({
                // optional configuration:
                searchContextSize: maxResult > 5 ? "high" : "medium",
              }),
            };
          } else {
            return undefined;
          }
        };
        const getProviderOptions = () => {
          // Enable OpenRouter's built-in search tool
          if (provider === "model" && taskModel === "openrouter") { // 如果provider为model且taskModel为openrouter
            return {
              openrouter: {
                plugins: [
                  {
                    id: "web",
                    max_results: maxResult ?? 5,
                  },
                ],
              },
            };
          } else {
            return undefined;
          }
        };

        searchResult = streamText({
          model: await this.getTaskModel(), // 获取任务模型
          system: getSystemPrompt(), // 获取系统提示
          prompt: [
            processResultPrompt(item.query, item.researchGoal), // 处理结果提示
            this.getResponseLanguagePrompt(), // 获取响应语言提示
          ].join("\n\n"),
          tools: await getTools(), // 获取工具
          providerOptions: getProviderOptions(), // 获取提供者选项
        });
      } else {
        try {
          const result = await createSearchProvider({
            query: item.query,
            ...this.options.searchProvider,
          });

          sources = result.sources;
          images = result.images;
        } catch (err) {
          const errorMessage = `[${provider}]: ${
            err instanceof Error ? err.message : "Search Failed"
          }`;
          throw new Error(errorMessage);
        }
        searchResult = streamText({
          model: await this.getTaskModel(),
          system: getSystemPrompt(),
          prompt: [
            processSearchResultPrompt(
              item.query,
              item.researchGoal,
              sources,
              sources.length > 0 && enableReferences
            ),
            this.getResponseLanguagePrompt(),
          ].join("\n\n"),
        });
      }

      this.onMessage("message", { type: "text", text: "<search-task>\n" });
      this.onMessage("message", { type: "text", text: `## ${item.query}\n\n` });
      this.onMessage("message", {
        type: "text",
        text: `${addQuoteBeforeAllLine(item.researchGoal)}\n\n`,
      });
      for await (const part of searchResult.fullStream) {
        if (part.type === "text-delta") {
          thinkTagStreamProcessor.processChunk(
            part.textDelta,
            (data) => {
              content += data;
              this.onMessage("message", { type: "text", text: data });
            },
            (data) => {
              this.onMessage("reasoning", { type: "text", text: data });
            }
          );
        } else if (part.type === "reasoning") {
          this.onMessage("reasoning", { type: "text", text: part.textDelta });
        } else if (part.type === "source") {
          sources.push(part.source);
        } else if (part.type === "finish") {
          if (part.providerMetadata?.google) {
            const { groundingMetadata } = part.providerMetadata.google;
            const googleGroundingMetadata =
              groundingMetadata as GoogleGenerativeAIProviderMetadata["groundingMetadata"];
            if (googleGroundingMetadata?.groundingSupports) {
              googleGroundingMetadata.groundingSupports.forEach(
                ({ segment, groundingChunkIndices }) => {
                  if (segment.text && groundingChunkIndices) {
                    const index = groundingChunkIndices.map(
                      (idx: number) => `[${idx + 1}]`
                    );
                    content = content.replaceAll(
                      segment.text,
                      `${segment.text}${index.join("")}`
                    );
                  }
                }
              );
            }
          } else if (part.providerMetadata?.openai) {
            // Fixed the problem that OpenAI cannot generate markdown reference link syntax properly in Chinese context
            content = content.replaceAll("【", "[").replaceAll("】", "]");
          }
        }
      }
      thinkTagStreamProcessor.end();

      if (images.length > 0) {
        const imageContent =
          "\n\n---\n\n" +
          images
            .map(
              (source) =>
                `![${source.description || source.url}](${source.url})`
            )
            .join("\n");
        content += imageContent;
        this.onMessage("message", { type: "text", text: imageContent });
      }

      if (sources.length > 0) {
        const sourceContent =
          "\n\n---\n\n" +
          sources
            .map(
              (item, idx) =>
                `[${idx + 1}]: ${item.url}${
                  item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                }`
            )
            .join("\n");
        content += sourceContent;
        this.onMessage("message", { type: "text", text: sourceContent });
      }
      this.onMessage("message", { type: "text", text: "\n</search-task>\n\n" });

      const task: SearchTask = {
        query: item.query,
        researchGoal: item.researchGoal,
        state: "completed",
        learning: content,
        sources,
        images,
      };
      results.push(task);
      this.onMessage("progress", {
        step: "search-task",
        status: "end",
        name: item.query,
        data: task,
      });
    }
    this.onMessage("progress", { step: "task-list", status: "end" });
    return results;
  }

  async writeFinalReport(
    reportPlan: string,
    tasks: DeepResearchSearchResult[],
    enableCitationImage = true,
    enableReferences = true
  ): Promise<FinalReportResult> {
    this.onMessage("progress", { step: "final-report", status: "start" });
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    const learnings = tasks.map((item) => item.learning);
    const sources: Source[] = unique(
      flat(tasks.map((item) => item.sources || [])),
      (item) => item.url
    );
    const images: ImageSource[] = unique(
      flat(tasks.map((item) => item.images || [])),
      (item) => item.url
    );
    const result = streamText({
      model: await this.getThinkingModel(),
      system: [getSystemPrompt(), outputGuidelinesPrompt].join("\n\n"),
      prompt: [
        writeFinalReportPrompt(
          reportPlan,
          learnings,
          sources.map((item) => pick(item, ["title", "url"])),
          images,
          "",
          images.length > 0 && enableCitationImage,
          sources.length > 0 && enableReferences
        ),
        this.getResponseLanguagePrompt(),
      ].join("\n\n"),
    });
    let content = "";
    this.onMessage("message", { type: "text", text: "<final-report>\n" });
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            this.onMessage("message", { type: "text", text: data });
          },
          (data) => {
            this.onMessage("reasoning", { type: "text", text: data });
          }
        );
      } else if (part.type === "reasoning") {
        this.onMessage("reasoning", { type: "text", text: part.textDelta });
      } else if (part.type === "source") {
        sources.push(part.source);
      } else if (part.type === "finish") {
        if (sources.length > 0) {
          const sourceContent =
            "\n\n---\n\n" +
            sources
              .map(
                (item, idx) =>
                  `[${idx + 1}]: ${item.url}${
                    item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                  }`
              )
              .join("\n");
          content += sourceContent;
        }
      }
    }
    this.onMessage("message", { type: "text", text: "\n</final-report>\n\n" });
    thinkTagStreamProcessor.end();

    const title = content
      .split("\n")[0]
      .replaceAll("#", "")
      .replaceAll("*", "")
      .trim();

    const finalReportResult: FinalReportResult = {
      title,
      finalReport: content,
      learnings,
      sources,
      images,
    };
    this.onMessage("progress", {
      step: "final-report",
      status: "end",
      data: finalReportResult,
    });
    return finalReportResult;
  }

// 异步函数start，接收三个参数：query，enableCitationImage（默认为true），enableReferences（默认为true）
  async start(
    query: string,
    enableCitationImage = true,
    enableReferences = true
  ) {
    try {
      // 调用writeReportPlan函数，传入query参数，返回reportPlan
      const reportPlan = await this.writeReportPlan(query);
      // 调用generateSERPQuery函数，传入reportPlan参数，返回tasks
      const tasks = await this.generateSERPQuery(reportPlan);
      // 调用runSearchTask函数，传入tasks和enableReferences参数，返回results
      const results = await this.runSearchTask(tasks, enableReferences);
      // 调用writeFinalReport函数，传入reportPlan，results，enableCitationImage和enableReferences参数，返回finalReport
      const finalReport = await this.writeFinalReport(
        reportPlan,
        results,
        enableCitationImage,
        enableReferences
      );
      // 返回finalReport
      return finalReport;
    } catch (err) {
      // 捕获错误，如果错误是Error类型，则获取错误信息，否则设置为未知错误
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      // 调用onMessage函数，传入"error"和错误信息
      this.onMessage("error", { message: errorMessage });
      // 抛出错误
      throw new Error(errorMessage);
    }
  }
}

export default DeepResearch;
