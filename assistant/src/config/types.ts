export interface AssistantConfig {
  provider: string;
  model: string;
  apiKeys: Record<string, string>;
  systemPrompt?: string;
  maxTokens: number;
  dataDir: string;
}
