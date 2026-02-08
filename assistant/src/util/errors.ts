export class AssistantError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AssistantError';
  }
}

export class ProviderError extends AssistantError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
  ) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'ProviderError';
  }
}

export class ToolError extends AssistantError {
  constructor(
    message: string,
    public readonly toolName: string,
  ) {
    super(message, 'TOOL_ERROR');
    this.name = 'ToolError';
  }
}

export class PermissionDeniedError extends AssistantError {
  constructor(
    message: string,
    public readonly toolName: string,
  ) {
    super(message, 'PERMISSION_DENIED');
    this.name = 'PermissionDeniedError';
  }
}

export class ConfigError extends AssistantError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class DaemonError extends AssistantError {
  constructor(message: string) {
    super(message, 'DAEMON_ERROR');
    this.name = 'DaemonError';
  }
}
