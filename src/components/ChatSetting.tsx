"use client";
import {
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, CircleHelp, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Password } from "@/components/Internal/PasswordInput";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatModelList } from "@/hooks/useChatModelList";
import { useChatSettingStore } from "@/store/chatSetting";
import {
  OPENAI_BASE_URL,
  DEEPSEEK_BASE_URL,
  GEMINI_BASE_URL,
} from "@/constants/urls";
import {
  getCustomModelList,
} from "@/utils/model";
import { cn } from "@/utils/style";
import { omit, capitalize } from "radash";

type ChatSettingProps = {
  open: boolean;
  onClose: () => void;
};

const BUILD_MODE = process.env.NEXT_PUBLIC_BUILD_MODE;
const DISABLED_AI_PROVIDER = process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER || "";
const MODEL_LIST = process.env.NEXT_PUBLIC_MODEL_LIST || "";

const formSchema = z.object({
  provider: z.string(),
  mode: z.string().optional(),
  model: z.string().optional(),
  googleApiKey: z.string().optional(),
  googleApiProxy: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  systemPrompt: z.string().optional(),
  enableStreaming: z.boolean().optional(),
  openRouterApiKey: z.string().optional(),
  openRouterApiProxy: z.string().optional(),
  openAIApiKey: z.string().optional(),
  openAIApiProxy: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  anthropicApiProxy: z.string().optional(),
  deepseekApiKey: z.string().optional(),
  deepseekApiProxy: z.string().optional(),
  xAIApiKey: z.string().optional(),
  xAIApiProxy: z.string().optional(),
  mistralApiKey: z.string().optional(),
  mistralApiProxy: z.string().optional(),
  azureApiKey: z.string().optional(),
  azureResourceName: z.string().optional(),
  azureApiVersion: z.string().optional(),
  openAICompatibleApiKey: z.string().optional(),
  openAICompatibleApiProxy: z.string().optional(),
  pollinationsApiProxy: z.string().optional(),
  ollamaApiProxy: z.string().optional(),
  accessPassword: z.string().optional(),
  smoothStreamType: z.enum(["character", "word", "line"]).optional(),
});

function convertModelName(name: string) {
  return name
    .replaceAll("/", "-")
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

function HelpTip({ children, tip }: { children: ReactNode; tip: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => {
      setOpen(false);
    }, 2000);
  };

  return (
    <div className="flex items-center">
      <span className="flex-1">{children}</span>
      <TooltipProvider delayDuration={100}>
        <Tooltip open={open} onOpenChange={(opened) => setOpen(opened)}>
          <TooltipTrigger asChild>
            <CircleHelp
              className="cursor-help w-4 h-4 ml-1 opacity-50 max-sm:ml-0"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                handleOpen();
              }}
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-52">
            <p>{tip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

function ChatSetting({ open, onClose }: ChatSettingProps) {
  const { t } = useTranslation();
  const { mode, provider, update } = useChatSettingStore();
  const { modelList, refresh } = useChatModelList();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasPreLoaded, setHasPreLoaded] = useState<boolean>(false);

  const chatModelList = useMemo(() => {
    return modelList || [];
  }, [modelList]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return new Promise((resolve) => {
        const state = useChatSettingStore.getState();
        resolve({ ...omit(state, ["update"]) });
      });
    },
  });

  const isDisabledAIProvider = useCallback(
    (provider: string) => {
      const disabledAIProviders =
        mode === "proxy" && DISABLED_AI_PROVIDER.length > 0
          ? DISABLED_AI_PROVIDER.split(",")
          : [];
      return disabledAIProviders.includes(provider);
    },
    [mode]
  );

  const isDisabledAIModel = useCallback(
    (model: string) => {
      if (mode === "local") return false;
      const { availableModelList, disabledModelList } = getCustomModelList(
        MODEL_LIST.length > 0 ? MODEL_LIST.split(",") : []
      );
      const isAvailableModel = availableModelList.some(
        (availableModel) => availableModel === model
      );
      if (isAvailableModel) return false;
      if (disabledModelList.includes("all")) return true;
      return disabledModelList.some((disabledModel) => disabledModel === model);
    },
    [mode]
  );

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  function handleSubmit(values: z.infer<typeof formSchema>) {
    update(values);
    onClose();
  }

  const fetchModelList = useCallback(async () => {
    const { provider } = useChatSettingStore.getState();
    try {
      setIsRefreshing(true);
      await refresh(provider);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  function handleModeChange(mode: string) {
    update({ mode });
  }

  async function handleProviderChange(provider: string) {
    update({ provider });
    await fetchModelList();
  }

  async function updateSetting(key: string, value?: string | number) {
    update({ [key]: value });
    await fetchModelList();
  }

  useLayoutEffect(() => {
    if (open && !hasPreLoaded) {
      setHasPreLoaded(true);
      fetchModelList();
    }
  }, [open, hasPreLoaded, fetchModelList]);

  useLayoutEffect(() => {
    if (open && mode === "") {
      const { accessPassword, update, getApiKey } = useChatSettingStore.getState();
      const apiKey = getApiKey(provider);
      const requestMode = !apiKey && accessPassword ? "proxy" : "local";
      update({ mode: requestMode });
      form.setValue("mode", requestMode);
    }
  }, [open, mode, form, provider]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-lg:max-w-md print:hidden"
        >
        <DialogHeader>
          <DialogTitle>{t("setting.chatTitle", "聊天设置")}</DialogTitle>
          <DialogDescription>
            {t("setting.chatDescription", "配置聊天AI模型参数")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 min-h-[250px]">
              <div className={BUILD_MODE === "export" ? "hidden" : ""}>
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="from-label">
                        <HelpTip tip={t("setting.modeTip")}>
                          {t("setting.mode")}
                        </HelpTip>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleModeChange(value);
                          }}
                        >
                          <SelectTrigger className="form-field">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-sm:max-h-48">
                            <SelectItem value="local">
                              {t("setting.local")}
                            </SelectItem>
                            <SelectItem value="proxy">
                              {t("setting.proxy")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem className="from-item">
                    <FormLabel className="from-label">
                      <HelpTip tip={t("setting.providerTip")}>
                        {t("setting.provider")}
                      </HelpTip>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleProviderChange(value);
                        }}
                      >
                        <SelectTrigger className="form-field">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-sm:max-h-72">
                          {!isDisabledAIProvider("google") ? (
                            <SelectItem value="google">
                              Google AI Studio
                            </SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("openai") ? (
                            <SelectItem value="openai">OpenAI</SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("anthropic") ? (
                            <SelectItem value="anthropic">
                              Anthropic
                            </SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("deepseek") ? (
                            <SelectItem value="deepseek">DeepSeek</SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("xai") ? (
                            <SelectItem value="xai">xAI Grok</SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("mistral") ? (
                            <SelectItem value="mistral">Mistral</SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("azure") ? (
                            <SelectItem value="azure">
                              Azure OpenAI
                            </SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("openrouter") ? (
                            <SelectItem value="openrouter">
                              OpenRouter
                            </SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("openaicompatible") ? (
                            <SelectItem value="openaicompatible">
                              {t("setting.openAICompatible")}
                            </SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("pollinations") ? (
                            <SelectItem value="pollinations">
                              Pollinations ({t("setting.free")})
                            </SelectItem>
                          ) : null}
                          {!isDisabledAIProvider("ollama") ? (
                            <SelectItem value="ollama">Ollama</SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className={mode === "proxy" ? "hidden" : ""}>
                {/* Google AI Studio */}
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "google",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="googleApiKey"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="from-label">
                          {t("setting.apiKeyLabel")}
                          <span className="ml-1 text-red-500 max-sm:hidden">
                            *
                          </span>
                        </FormLabel>
                        <FormControl className="form-field">
                          <Password
                            type="text"
                            placeholder={t("setting.apiKeyPlaceholder")}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "googleApiKey",
                                form.getValues("googleApiKey")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="googleApiProxy"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="from-label">
                          {t("setting.apiUrlLabel")}
                        </FormLabel>
                        <FormControl className="form-field">
                          <Input
                            placeholder={GEMINI_BASE_URL}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "googleApiProxy",
                                form.getValues("googleApiProxy")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* OpenAI */}
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "openai",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="openAIApiKey"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="from-label">
                          {t("setting.apiKeyLabel")}
                          <span className="ml-1 text-red-500 max-sm:hidden">
                            *
                          </span>
                        </FormLabel>
                        <FormControl className="form-field">
                          <Password
                            type="text"
                            placeholder={t("setting.apiKeyPlaceholder")}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "openAIApiKey",
                                form.getValues("openAIApiKey")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openAIApiProxy"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="from-label">
                          {t("setting.apiUrlLabel")}
                        </FormLabel>
                        <FormControl className="form-field">
                          <Input
                            placeholder={OPENAI_BASE_URL}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "openAIApiProxy",
                                form.getValues("openAIApiProxy")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* DeepSeek */}
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "deepseek",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="deepseekApiKey"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="from-label">
                          {t("setting.apiKeyLabel")}
                          <span className="ml-1 text-red-500 max-sm:hidden">
                            *
                          </span>
                        </FormLabel>
                        <FormControl className="form-field">
                          <Password
                            type="text"
                            placeholder={t("setting.apiKeyPlaceholder")}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "deepseekApiKey",
                                form.getValues("deepseekApiKey")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deepseekApiProxy"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="from-label">
                          {t("setting.apiUrlLabel")}
                        </FormLabel>
                        <FormControl className="form-field">
                          <Input
                            placeholder={DEEPSEEK_BASE_URL}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "deepseekApiProxy",
                                form.getValues("deepseekApiProxy")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* 聊天模型选择 */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="from-label">
                        <div className="flex items-center justify-between">
                          <HelpTip tip={"选择用于聊天的AI模型"}>
                            聊天模型
                          </HelpTip>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={fetchModelList}
                            disabled={isRefreshing}
                          >
                            <RefreshCw
                              className={cn("w-3 h-3", {
                                "animate-spin": isRefreshing,
                              })}
                            />
                          </Button>
                        </div>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            updateSetting("model", value);
                          }}
                        >
                          <SelectTrigger className="form-field">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-sm:max-h-72">
                            {chatModelList?.map((model) => (
                              <SelectItem
                                key={model}
                                value={model}
                                disabled={isDisabledAIModel(model)}
                              >
                                {convertModelName(model)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* 聊天参数 */}
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="from-label">
                        <HelpTip tip={"控制回答的随机性，0-1之间，值越高越随机"}>
                          温度参数
                        </HelpTip>
                      </FormLabel>
                      <FormControl className="form-field">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          placeholder="0.7"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0.7)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxTokens"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="from-label">
                        <HelpTip tip={"最大输出token数量"}>
                          最大Token数
                        </HelpTip>
                      </FormLabel>
                      <FormControl className="form-field">
                        <Input
                          type="number"
                          min="100"
                          max="8000"
                          placeholder="4000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 4000)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="from-label">
                        <HelpTip tip={"系统提示词，定义AI的角色和行为"}>
                          系统提示词
                        </HelpTip>
                      </FormLabel>
                      <FormControl className="form-field">
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="你是一个有用的AI助手。"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* 开关选项 */}
                 <FormField
                   control={form.control}
                   name="enableStreaming"
                   render={({ field }) => (
                     <FormItem className="from-item flex flex-row items-center justify-between rounded-lg border p-4">
                       <div className="space-y-0.5">
                         <FormLabel className="from-label">
                           <HelpTip tip={"启用流式输出，实时显示AI回答"}>启用流式输出</HelpTip>
                         </FormLabel>
                       </div>
                       <FormControl>
                         <Switch
                           checked={field.value}
                           onCheckedChange={(checked) => {
                             field.onChange(checked);
                             update({ enableStreaming: checked });
                           }}
                         />
                       </FormControl>
                     </FormItem>
                   )}
                 />
                 
                 <FormField
                   control={form.control}
                   name="smoothStreamType"
                   render={({ field }) => (
                     <FormItem className="from-item">
                       <FormLabel className="from-label">
                         <HelpTip tip={"选择流式文本的平滑显示方式"}>流式类型</HelpTip>
                       </FormLabel>
                       <FormControl>
                         <Select
                           value={field.value}
                           onValueChange={(value) => {
                             field.onChange(value);
                             updateSetting("smoothStreamType", value);
                           }}
                         >
                           <SelectTrigger className="form-field">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="character">按字符</SelectItem>
                             <SelectItem value="word">按单词</SelectItem>
                             <SelectItem value="line">按行</SelectItem>
                           </SelectContent>
                         </Select>
                       </FormControl>
                     </FormItem>
                   )}
                 />
                 


              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("setting.cancel", "取消")}
              </Button>
              <Button type="submit">
                {t("setting.save", "保存")}
              </Button>
            </div>
          </form>
        </Form>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export default ChatSetting;