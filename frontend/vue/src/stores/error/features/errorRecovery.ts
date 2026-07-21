/**
 * Error Recovery
 * 
 * Manages recovery strategies for different error categories and
 * attempts automatic recovery where possible.
 */

import type { ProcessedError, RecoveryStrategy, ErrorCategory } from '../error.types';

export class ErrorRecovery {
  private strategies = new Map<ErrorCategory, RecoveryStrategy[]>();
  private maxAttempts: number;

  constructor(maxAttempts: number = 3) {
    this.maxAttempts = maxAttempts;
    this.registerDefaultStrategies();
  }

  registerStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    if (!this.strategies.has(category)) {
      this.strategies.set(category, []);
    }
    this.strategies.get(category)!.push(strategy);
  }

  async attemptRecovery(error: ProcessedError, maxAttempts: number = 3): Promise<void> {
    if (!error.recoverable) {
      return;
    }

    const strategies = this.strategies.get(error.category) || [];
    
    for (const strategy of strategies) {
      if (!strategy.canRecover(error)) {
        continue;
      }

      const strategyMaxAttempts = strategy.maxAttempts || maxAttempts;
      
      for (let attempt = 1; attempt <= strategyMaxAttempts; attempt++) {
        try {
          const recovered = await strategy.recover(error);
          if (recovered) {
            return;
          }
        } catch (err) {
          console.error(`Recovery attempt ${attempt} failed:`, err);
        }

        if (attempt < strategyMaxAttempts) {
          await this.delay(1000 * attempt);
        }
      }
    }

    throw new Error('Recovery failed');
  }

  registerDefaultStrategies(): void {
    // Network retry strategy
    this.registerStrategy('network', {
      name: 'Network Retry',
      canRecover: (error) => error.category === 'network',
      recover: async (error) => {
        // In a real implementation, this would retry the original request
        // For now, we just check if we're online
        await new Promise(resolve => setTimeout(resolve, 1000));
        return navigator.onLine;
      },
      maxAttempts: 3,
    });

    // API retry for 5xx errors
    this.registerStrategy('api', {
      name: 'API Retry',
      canRecover: (error) => {
        const status = error.originalError?.response?.status;
        return status >= 500 && status < 600;
      },
      recover: async () => {
        // Retry would happen here
        await new Promise(resolve => setTimeout(resolve, 2000));
        return false; // Can't actually retry without request context
      },
      maxAttempts: 2,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
