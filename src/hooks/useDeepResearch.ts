import { useState } from "react";
import { streamText, smoothStream, type JSONValue, type Tool } from "ai";
import { parsePartialJson } from "@ai-sdk/ui-utils";
import { openai } from "@ai-sdk/openai";
import { type GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";
import { useTranslation } from "react-i18next";
import Plimit from "p-limit";
import { toast } from "sonner";
import useModelProvider from "@/hooks/useAiProvider";
import useWebSearch from "@/hooks/useWebSearch";
import { useTaskStore } from "@/store/task";
import { useHistoryStore } from "@/store/history";
import { useSettingStore } from "@/store/setting";
import { useKnowledgeStore } from "@/store/knowledge";
import { outputGuidelinesPrompt } from "@/constants/prompts";
import {
  getSystemPrompt,
  generateQuestionsPrompt,
  writeReportPlanPrompt,
  generateSerpQueriesPrompt,
  processResultPrompt,
  processSearchResultPrompt,
  processSearchKnowledgeResultPrompt,
  reviewSerpQueriesPrompt,
  writeFinalReportPrompt,
  getSERPQuerySchema,
} from "@/utils/deep-research/prompts";
import { isNetworkingModel } from "@/utils/model";
import { ThinkTagStreamProcessor, removeJsonMarkdown } from "@/utils/text";
import { parseError } from "@/utils/error";
import { pick, flat, unique } from "radash";

type ProviderOptions = Record<string, Record<string, JSONValue>>;
type Tools = Record<string, Tool>;

function getResponseLanguagePrompt() {
  return `\n\n**Respond in the same language as the user's language**`;
}

function smoothTextStream(type: "character" | "word" | "line") {
  return smoothStream({
    chunking: type === "character" ? /./ : type,
    delayInMs: 0,
  });
}

function handleError(error: unknown) {
  const errorMessage = parseError(error);
  toast.error(errorMessage);
}

function useDeepResearch() {
  // 初始化国际化翻译函数
  const { t } = useTranslation();
  // 获取任务状态管理store
  const taskStore = useTaskStore();
  // 从设置store中获取文本流平滑类型
  const { smoothTextStreamType } = useSettingStore();
  // 获取AI模型提供者相关方法
  const { createModelProvider, getModel } = useModelProvider();
  // 获取网页搜索功能
  const { search } = useWebSearch();
  // 定义当前研究状态
  const [status, setStatus] = useState<string>("");

  /**
   * askQuestions 函数用于向AI模型询问问题并处理返回结果
   * 主要功能:
   * 1. 从store获取问题并设置思考状态
   * 2. 调用AI模型进行问题分析
   * 3. 处理流式返回的文本,更新到store中
   * 4. 分别处理正文内容和推理过程
   */
  async function askQuestions() {
    // 从store获取当前问题
      const { question } = useTaskStore.getState();
    // 获取用于思考的模型配置
    const { thinkingModel } = getModel();
    // 设置状态为思考中
    setStatus(t("research.common.thinking"));
    
    // 创建文本流处理器
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    
    // 调用AI模型进行分析
    // 调用streamText函数来处理AI文本流
    const result = streamText({
      // 创建并配置AI模型提供者
      model: await createModelProvider(thinkingModel),
      // 设置系统级提示词
      system: getSystemPrompt(),
      // 组合用户提示词和语言响应提示
      prompt: [
        // 生成问题相关的提示词
        generateQuestionsPrompt(question),
        // 添加语言响应提示
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      // 配置文本流平滑处理
      experimental_transform: smoothTextStream(smoothTextStreamType),
      // 设置错误处理函数
      onError: handleError,
    });

    // 用于存储返回的内容和推理过程
    let content = "";
    let reasoning = "";
    
    // 将问题保存到store
    taskStore.setQuestion(question);

    // 处理流式返回的数据 
    // 使用 for await...of 语法，去消费（consume）一个由 streamText 函数创建并返回的、
    // 名为 fullStream 的异步数据流。它在循环的每一次迭代中处理一个数据块，
    // 而不是发起一次新的API调用。
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        // 处理文本内容,分别更新到content和reasoning
        thinkTagStreamProcessor.processChunk(
          part.textDelta,
          (data) => {
            content += data;
            taskStore.updateQuestions(content);
          },
          (data) => {
            reasoning += data;
          }
        );
      } else if (part.type === "reasoning") {
        // 处理推理过程
        reasoning += part.textDelta;
      }
    }

    // 如果有推理内容则打印出来
    if (reasoning) console.log(reasoning);
  }

/**
 * writeReportPlan 函数用于生成研究报告计划
 * 主要功能:
 * 1. 从store获取查询内容
 * 2. 使用AI模型生成报告计划
 * 3. 处理流式返回的文本,更新到store中
 * 4. 分别处理正文内容和推理过程
 */
async function writeReportPlan() {
  // 从store获取查询内容
  const { query } = useTaskStore.getState();
  // 获取用于思考的模型配置
  const { thinkingModel } = getModel();
  // 设置状态为思考中
  setStatus(t("research.common.thinking"));
  
  // 创建文本流处理器
  const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
  
  // 调用AI模型生成报告计划
  const result = streamText({
    // 创建并配置AI模型提供者
    model: await createModelProvider(thinkingModel),
    // 设置系统级提示词
    system: getSystemPrompt(),
    // 组合报告计划提示词和语言响应提示
    prompt: [writeReportPlanPrompt(query), getResponseLanguagePrompt()].join(
      "\n\n"
    ),
    // 配置文本流平滑处理
    experimental_transform: smoothTextStream(smoothTextStreamType),
    // 设置错误处理函数
    onError: handleError,
  });

  // 用于存储返回的内容和推理过程
  let content = "";
  let reasoning = "";

  // 处理流式返回的数据
  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      // 处理文本内容,分别更新到content和reasoning
      thinkTagStreamProcessor.processChunk(
        part.textDelta,
        (data) => {
          content += data;
          // 更新报告计划到store
          taskStore.updateReportPlan(content);
        },
        (data) => {
          reasoning += data;
        }
      );
    } else if (part.type === "reasoning") {
      // 处理推理过程
      reasoning += part.textDelta;
    }
  }

  // 如果有推理内容则打印出来
  if (reasoning) console.log(reasoning);
  
  return content;
}

/**
 * deepResearch 函数是执行深度研究的主要函数
 * 主要功能:
 * 1. 基于研究计划生成搜索查询
 * 2. 处理AI返回的流式文本
 * 3. 解析查询结果并更新到任务状态
 * 4. 执行实际的搜索任务
 */
async function deepResearch() {
  // 从store获取研究计划
  const { reportPlan } = useTaskStore.getState();
  // 获取用于思考的模型配置
  const { thinkingModel } = getModel();
  // 设置状态为思考中
  setStatus(t("research.common.thinking"));

  try {
    // 创建文本流处理器实例
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
    
    // 调用AI模型生成搜索查询
    const result = streamText({
      // 创建并配置AI模型提供者
      model: await createModelProvider(thinkingModel),
      // 设置系统级提示词
      system: getSystemPrompt(),
      // 组合生成查询提示词和语言响应提示
      prompt: [
        generateSerpQueriesPrompt(reportPlan),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      // 配置文本流平滑处理
      experimental_transform: smoothTextStream(smoothTextStreamType),
      // 设置错误处理函数
      onError: handleError,
    });

    // 获取查询结果的数据模式
    const querySchema = getSERPQuerySchema();
    // 用于存储返回的内容和推理过程
    let content = "";
    let reasoning = "";
    // 存储生成的搜索任务数组
    let queries: SearchTask[] = [];

    // 处理文本流
    for await (const textPart of result.textStream) {
      // 使用处理器处理每个文本块
      thinkTagStreamProcessor.processChunk(
        textPart,
        // 处理主要内容的回调
        (text) => {
          // 累加内容
          content += text;
          // 解析JSON内容
          const data: PartialJson = parsePartialJson(
            removeJsonMarkdown(content)
          );
          // 验证数据是否符合查询模式
          if (querySchema.safeParse(data.value)) {
            // 检查解析状态
            if (
              data.state === "repaired-parse" ||
              data.state === "successful-parse"
            ) {
              if (data.value) {
                // 将解析后的数据转换为搜索任务格式
                queries = data.value.map(
                  (item: { query: string; researchGoal: string }) => ({
                    state: "unprocessed",
                    learning: "",
                    ...pick(item, ["query", "researchGoal"]),
                  })
                );
                // 更新任务状态
                taskStore.update(queries);
              }
            }
          }
        },
        // 处理推理内容的回调
        (text) => {
          reasoning += text;
        }
      );
    }

    // 如果有推理内容则打印
    if (reasoning) console.log(reasoning);
    // 执行实际的搜索任务
    await runSearchTask(queries);
  } catch (err) {
    // 错误处理
    console.error(err);
  }
}

/**
 * 搜索本地知识库的函数
 * @param query - 搜索查询词
 * @param researchGoal - 研究目标
 * @returns 返回处理后的内容字符串
 */
async function searchLocalKnowledges(query: string, researchGoal: string) {
  // 从任务存储中获取资源列表
  const { resources } = useTaskStore.getState();
  // 获取知识库存储实例
  const knowledgeStore = useKnowledgeStore.getState();
  // 初始化知识数组
  const knowledges: Knowledge[] = [];

  // 遍历资源列表,获取已完成的资源
  for (const item of resources) {
    if (item.status === "completed") {
      // 从知识库中获取对应资源
      const resource = knowledgeStore.get(item.id);
      if (resource) {
        knowledges.push(resource);
      }
    }
  }

  // 获取网络模型配置
  const { networkingModel } = getModel();
  // 创建思考标签流处理器实例
  const thinkTagStreamProcessor = new ThinkTagStreamProcessor();
  
  // 调用AI模型进行知识搜索
  const searchResult = streamText({
    model: await createModelProvider(networkingModel),
    system: getSystemPrompt(),
    prompt: [
      // 处理知识搜索结果的提示词
      processSearchKnowledgeResultPrompt(query, researchGoal, knowledges),
      getResponseLanguagePrompt(),
    ].join("\n\n"),
    experimental_transform: smoothTextStream(smoothTextStreamType),
    onError: handleError,
  });

  // 用于存储返回的内容和推理过程
  let content = "";
  let reasoning = "";

  // 处理流式返回的数据
  for await (const part of searchResult.fullStream) {
    if (part.type === "text-delta") {
      // 处理文本内容
      thinkTagStreamProcessor.processChunk(
        part.textDelta,
        (data) => {
          content += data;
          // 更新任务存储中的学习内容
          taskStore.updateTask(query, { learning: content });
        },
        (data) => {
          reasoning += data;
        }
      );
    } else if (part.type === "reasoning") {
      // 处理推理过程
      reasoning += part.textDelta;
    }
  }

  // 如果有推理内容则打印出来
  if (reasoning) console.log(reasoning);
  return content;
}

/**
 * runSearchTask 函数是整个深度研究功能的核心搜索执行函数
 * 主要功能:
 * 1. 并行执行多个搜索任务
 * 2. 支持本地知识库搜索和网络搜索
 * 3. 支持多种AI模型提供商(OpenAI、Google、OpenRouter等)的搜索能力
 * 4. 处理搜索结果并更新到任务状态
 * 5. 支持引用和图片处理
 */
async function runSearchTask(queries: SearchTask[]) {
    // 从设置store获取搜索相关配置
    const {
      provider,
      enableSearch,
      searchProvider, 
      parallelSearch,
      searchMaxResult,
      references,
      onlyUseLocalResource,
    } = useSettingStore.getState();
    
    // 获取资源和模型配置
    const { resources } = useTaskStore.getState();
    const { networkingModel } = getModel();
    
    // 设置搜索状态
    setStatus(t("research.common.research"));
    
    // 初始化并行限制器和文本处理器
    const plimit = Plimit(parallelSearch);//并发控制 js库里的函数
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();

    // 创建模型实例的工具函数
    /**
     * 创建模型实例的工具函数
     * @param model - 模型名称字符串
     * @returns 返回配置好的模型提供者实例
     * 
     * 主要逻辑:
     * 1. 如果满足以下所有条件,则创建带搜索功能的Google模型:
     *    - enableSearch 为 true (启用搜索)
     *    - searchProvider 为 "model" (使用模型提供搜索)
     *    - provider 为 "google" (使用Google提供者)
     *    - 是网络模型
     * 2. 否则创建普通模型实例
     */
    const createModel = (model: string) => {
      if (
        enableSearch &&
        searchProvider === "model" &&
        provider === "google" &&
        isNetworkingModel(model)
      ) {
        return createModelProvider(model, { useSearchGrounding: true });
      } else {
        return createModelProvider(model);
      }
    };

    // 获取OpenAI搜索工具配置
    /**
     * 获取OpenAI搜索工具配置的函数
     * @param model - 模型名称
     * @returns 返回配置好的搜索工具对象或undefined
     * 
     * 主要逻辑:
     * 1. 检查是否启用搜索且搜索提供者为model
     * 2. 检查是否使用OpenAI或Azure,且模型名以gpt-4o开头
     * 3. 如果条件满足,返回web_search_preview工具配置
     * 4. 否则返回undefined
     */
    const getTools = (model: string) => {
      if (enableSearch && searchProvider === "model") {
        if (
          ["openai", "azure"].includes(provider) &&
          model.startsWith("gpt-4o")
        ) {
          return {
            web_search_preview: openai.tools.webSearchPreview({
              searchContextSize: "medium",
            }),
          } as Tools;
        }
      }
      return undefined;
    };

    // 获取不同提供商的搜索选项配置
    const getProviderOptions = (model: string) => {
      if (enableSearch && searchProvider === "model") {
        if (provider === "openrouter") {
          return {
            openrouter: {
              plugins: [{ id: "web", max_results: searchMaxResult }],
            },
          } as ProviderOptions;
        } else if (
          provider === "xai" &&
          model.startsWith("grok-3") &&
          !model.includes("mini")
        ) {
          return {
            xai: {
              search_parameters: {
                mode: "auto",
                max_search_results: searchMaxResult,
              },
            },
          } as ProviderOptions;
        }
      }
      return undefined;
    };

    // 并行执行所有搜索查询
    await Promise.all(
      queries.map((item) => {
        plimit(async () => {
          // 初始化搜索结果变量
          let content = "";
          let reasoning = "";
          let searchResult;
          let sources: Source[] = [];
          let images: ImageSource[] = [];
          
          // 更新任务状态为处理中
          taskStore.updateTask(item.query, { state: "processing" });

          // 处理本地知识库搜索
          if (resources.length > 0) {
            const knowledges = await searchLocalKnowledges(
              item.query,
              item.researchGoal
            );
            content += [
              knowledges,
              `### ${t("research.searchResult.references")}`,
              resources.map((item) => `- ${item.name}`).join("\n"),
            ].join("\n\n");

            if (onlyUseLocalResource === "enable") {
              taskStore.updateTask(item.query, {
                state: "completed",
                learning: content,
                sources,
                images,
              });
              return content;
            } else {
              content += "\n\n---\n\n";
            }
          }

          // 处理网络搜索
          if (enableSearch) {
            // 判断搜索提供者是否为model
            if (searchProvider !== "model") {
              try {
                // 使用search函数执行搜索,获取结果
                const results = await search(item.query);
                // 从结果中提取sources和images
                sources = results.sources;
                images = results.images;

                // 如果没有搜索结果源,抛出错误
                if (sources.length === 0) {
                  throw new Error("Invalid Search Results");
                }
              } catch (err) {
                // 错误处理和日志记录
                console.error(err);
                handleError(
                  `[${searchProvider}]: ${
                    err instanceof Error ? err.message : "Search Failed"
                  }`
                );
                // 清空并行队列并返回
                return plimit.clearQueue();
              }

              // 判断是否启用引用功能
              const enableReferences =
                sources.length > 0 && references === "enable";
              
              // 使用streamText处理搜索结果
              searchResult = streamText({
                model: await createModel(networkingModel),
                system: getSystemPrompt(),
                prompt: [
                  // 处理搜索结果的提示词
                  processSearchResultPrompt(
                    item.query,
                    item.researchGoal,
                    sources,
                    enableReferences
                  ),
                  getResponseLanguagePrompt(),
                ].join("\n\n"),
                experimental_transform: smoothTextStream(smoothTextStreamType),
                onError: handleError,
              });
            } else {
              // 如果搜索提供者是model,直接使用模型进行搜索
              searchResult = streamText({
                model: await createModel(networkingModel),
                system: getSystemPrompt(),
                prompt: [
                  processResultPrompt(item.query, item.researchGoal),
                  getResponseLanguagePrompt(),
                ].join("\n\n"),
                // 添加搜索工具和提供者选项
                tools: getTools(networkingModel),
                providerOptions: getProviderOptions(networkingModel),
                experimental_transform: smoothTextStream(smoothTextStreamType),
                onError: handleError,
              });
            }
          } else {
            // 如果未启用搜索,直接使用模型处理
            searchResult = streamText({
              model: await createModelProvider(networkingModel),
              system: getSystemPrompt(),
              prompt: [
                processResultPrompt(item.query, item.researchGoal),
                getResponseLanguagePrompt(),
              ].join("\n\n"),
              experimental_transform: smoothTextStream(smoothTextStreamType),
              onError: (err) => {
                // 更新任务状态为失败并处理错误
                taskStore.updateTask(item.query, { state: "failed" });
                handleError(err);
              },
            });
          }

          // 处理搜索结果流
          // 异步迭代处理搜索结果流
          for await (const part of searchResult.fullStream) {
            // 处理文本增量更新
            if (part.type === "text-delta") {
              // 使用文本处理器处理文本块
              thinkTagStreamProcessor.processChunk(
                part.textDelta,
                // 处理主要内容的回调函数
                (data) => {
                  // 累加内容
                  content += data;
                  // 更新任务存储中的学习内容
                  taskStore.updateTask(item.query, { learning: content });
                },
                // 处理推理内容的回调函数
                (data) => {
                  reasoning += data;
                }
              );
            } 
            // 处理推理类型的数据
            else if (part.type === "reasoning") {
              reasoning += part.textDelta;
            }
            // 处理来源类型的数据
            else if (part.type === "source") {
              sources.push(part.source);
            }
            // 处理完成状态的数据
            else if (part.type === "finish") {
              // 处理Google搜索元数据
              if (part.providerMetadata?.google) {
                const { groundingMetadata } = part.providerMetadata.google;
                // 类型转换为Google生成式AI的元数据类型
                const googleGroundingMetadata =
                  groundingMetadata as GoogleGenerativeAIProviderMetadata["groundingMetadata"];
                
                // 处理Google的接地支持数据
                if (googleGroundingMetadata?.groundingSupports) {
                  // 遍历每个接地支持项
                  googleGroundingMetadata.groundingSupports.forEach(
                    ({ segment, groundingChunkIndices }) => {
                      // 如果存在文本段和块索引
                      if (segment.text && groundingChunkIndices) {
                        // 将块索引转换为引用格式
                        const index = groundingChunkIndices.map(
                          (idx: number) => `[${idx + 1}]`
                        );
                        // 在原文中添加引用标记
                        content = content.replaceAll(
                          segment.text,
                          `${segment.text}${index.join("")}`
                        );
                      }
                    }
                  );
                }
              } 
              // 处理OpenAI的特殊字符替换
              else if (part.providerMetadata?.openai) {
                content = content.replaceAll("【", "[").replaceAll("】", "]");
              }
            }
          }

          if (reasoning) console.log(reasoning);

          // 添加引用源
          if (sources.length > 0) {
            content +=
              "\n\n" +
              sources
                .map(
                  (item, idx) =>
                    `[${idx + 1}]: ${item.url}${
                      item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
                    }`
                )
                .join("\n");
          }

          // 更新最终任务状态
          if (content.length > 0) {
            taskStore.updateTask(item.query, {
              state: "completed",
              learning: content,
              sources,
              images,
            });
            return content;
          } else {
            taskStore.updateTask(item.query, {
              state: "failed",
              learning: "",
              sources: [],
              images: [],
            });
            return "";
          }
        });
      })
    );
  }

  /**
   * reviewSearchResult 函数用于审查搜索结果并生成新的搜索任务
   * 主要功能:
   * 1. 从store获取报告计划、任务列表和建议
   * 2. 使用AI模型分析现有搜索结果
   * 3. 生成新的搜索查询任务
   * 4. 执行新生成的搜索任务
   */
  async function reviewSearchResult() {
    // 从store获取相关状态
    const { reportPlan, tasks, suggestion } = useTaskStore.getState();
    // 获取思考模型配置
    const { thinkingModel } = getModel();
    // 设置状态为研究中
    setStatus(t("research.common.research"));
    // 获取所有任务的学习内容
    const learnings = tasks.map((item) => item.learning);
    // 创建文本流处理器实例
    const thinkTagStreamProcessor = new ThinkTagStreamProcessor();

    // 调用AI模型分析搜索结果
    const result = streamText({
      model: await createModelProvider(thinkingModel),
      system: getSystemPrompt(),
      prompt: [
        reviewSerpQueriesPrompt(reportPlan, learnings, suggestion),
        getResponseLanguagePrompt(),
      ].join("\n\n"),
      experimental_transform: smoothTextStream(smoothTextStreamType),
      onError: handleError,
    });

    // 获取搜索查询的schema验证器
    const querySchema = getSERPQuerySchema();
    // 初始化内容、推理和查询数组
    let content = "";
    let reasoning = "";
    let queries: SearchTask[] = [];

    // 处理文本流
    for await (const textPart of result.textStream) {
      thinkTagStreamProcessor.processChunk(
        textPart,
        // 处理主要内容
        (text) => {
          content += text;
          // 解析JSON内容
          const data: PartialJson = parsePartialJson(
            removeJsonMarkdown(content)
          );
          // 验证并处理查询数据
          if (
            querySchema.safeParse(data.value) &&
            data.state === "successful-parse"
          ) {
            if (data.value) {
              // 将解析的数据转换为搜索任务格式
              queries = data.value.map(
                (item: { query: string; researchGoal: string }) => ({
                  state: "unprocessed",
                  learning: "",
                  ...pick(item, ["query", "researchGoal"]),
                })
              );
            }
          }
        },
        // 处理推理内容
        (text) => {
          reasoning += text;
        }
      );
    }

    // 如果有推理内容则打印
    if (reasoning) console.log(reasoning);

    // 如果生成了新的查询任务
    if (queries.length > 0) {
      // 更新任务列表并执行新的搜索任务
      taskStore.update([...tasks, ...queries]);
      await runSearchTask(queries);
    }
  }

/**
 * writeFinalReport 函数用于生成最终的研究报告
 * 主要功能:
 * 1. 从各个store获取所需数据(引用图片设置、参考文献设置、报告计划、任务等)
 * 2. 整合所有任务的学习内容、来源和图片
 * 3. 使用AI模型生成最终报告
 * 4. 处理引用和图片引用
 * 5. 保存报告到历史记录
 */
async function writeFinalReport() {
  // 获取引用相关设置
  const { citationImage, references } = useSettingStore.getState();
  
  // 获取任务相关数据和方法
  const {
    reportPlan,
    tasks,
    setId,
    setTitle,
    setSources,
    requirement,
    updateFinalReport,
  } = useTaskStore.getState();
  
  // 获取历史记录保存方法
  const { save } = useHistoryStore.getState();
  
  // 获取思考模型
  const { thinkingModel } = getModel();
  
  // 设置状态和初始化数据
  setStatus(t("research.common.writing"));
  updateFinalReport("");
  setTitle("");
  setSources([]);

  // 整合所有任务的学习内容
  const learnings = tasks.map((item) => item.learning);
  
  // 去重并整合所有来源和图片
  const sources: Source[] = unique(
    flat(tasks.map((item) => item.sources || [])),
    (item) => item.url
  );
  const images: ImageSource[] = unique(
    flat(tasks.map((item) => item.images || [])),
    (item) => item.url
  );

  // 确定是否启用引用功能
  const enableCitationImage = images.length > 0 && citationImage === "enable";
  const enableReferences = sources.length > 0 && references === "enable";

  // 创建文本处理器
  const thinkTagStreamProcessor = new ThinkTagStreamProcessor();

  // 调用AI模型生成报告
  const result = streamText({
    model: await createModelProvider(thinkingModel),
    system: [getSystemPrompt(), outputGuidelinesPrompt].join("\n\n"),
    prompt: [
      writeFinalReportPrompt(
        reportPlan,
        learnings,
        enableReferences
          ? sources.map((item) => pick(item, ["title", "url"]))
          : [],
        enableCitationImage ? images : [],
        requirement,
        enableCitationImage,
        enableReferences
      ),
      getResponseLanguagePrompt(),
    ].join("\n\n"),
    experimental_transform: smoothTextStream(smoothTextStreamType),
    onError: handleError,
  });

  // 用于存储生成的内容和推理过程
  let content = "";
  let reasoning = "";

  // 处理流式返回的数据
  for await (const part of result.fullStream) {
    if (part.type === "text-delta") {
      thinkTagStreamProcessor.processChunk(
        part.textDelta,
        (data) => {
          content += data;
          updateFinalReport(content);
        },
        (data) => {
          reasoning += data;
        }
      );
    } else if (part.type === "reasoning") {
      reasoning += part.textDelta;
    }
  }

  // 输出推理过程
  if (reasoning) console.log(reasoning);

  // 添加引用源
  if (sources.length > 0) {
    content +=
      "\n\n" +
      sources
        .map(
          (item, idx) =>
            `[${idx + 1}]: ${item.url}${
              item.title ? ` "${item.title.replaceAll('"', " ")}"` : ""
            }`
        )
        .join("\n");
    updateFinalReport(content);
  }

  // 如果生成了内容,保存报告
  if (content.length > 0) {
    // 提取标题
    const title = (content || "")
      .split("\n")[0]
      .replaceAll("#", "")
      .replaceAll("*", "")
      .trim();
      
    // 更新标题和来源
    setTitle(title);
    setSources(sources);
    
    // 保存到历史记录
    const id = save(taskStore.backup());
    setId(id);
    
    return content;
  } else {
    return "";
  }
}



  return {
    status,
    deepResearch,
    askQuestions,
    writeReportPlan,
    runSearchTask,
    reviewSearchResult,
    writeFinalReport,
  };
}

export default useDeepResearch;
