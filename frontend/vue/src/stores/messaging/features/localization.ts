import type { LocalizedMessageOptions } from '../messaging.types';

export interface I18nService {
  t(key: string, interpolation?: Record<string, any>): string;
}

export class LocalizationHelper {
  private i18nService?: I18nService;

  setI18nService(service: I18nService): void {
    this.i18nService = service;
  }

  translateMessage(
    summaryKey: string,
    detailKey?: string,
    options?: LocalizedMessageOptions
  ): { summary: string; detail?: string } {
    if (!this.i18nService) {
      return {
        summary: summaryKey,
        detail: detailKey,
      };
    }

    const summary = this.i18nService.t(summaryKey, options?.interpolation);
    const detail = detailKey 
      ? this.i18nService.t(detailKey, options?.interpolation)
      : undefined;

    return { summary, detail };
  }

  isAvailable(): boolean {
    return this.i18nService !== undefined;
  }
}
