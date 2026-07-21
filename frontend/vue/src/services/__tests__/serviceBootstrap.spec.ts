import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bootstrapServices, cleanupServices, getBootstrapStatus } from '../serviceBootstrap';
import { clearRegistry, getRegistryStats } from '../serviceRegistry';

describe('Service Bootstrap', () => {
  beforeEach(() => {
    clearRegistry();
  });

  afterEach(() => {
    clearRegistry();
  });

  describe('bootstrapServices', () => {
    it('should complete successfully with no services', async () => {
      const result = await bootstrapServices();

      expect(result.success).toBe(true);
      expect(result.initializedServices).toEqual([]);
      expect(result.failedServices).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should log bootstrap phases', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await bootstrapServices();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting V2 service bootstrap')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Phase 1: Core Services')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Phase 2: Infrastructure Services')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Phase 3: Auth Service')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Phase 4: Integration Services')
      );

      consoleSpy.mockRestore();
    });

    it('should accept and log options', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const options = {
        enableMock: true,
        enableDevTools: true,
        enablePerformanceTracking: true,
        apiBaseUrl: 'https://test.com',
      };

      await bootstrapServices(options);

      expect(consoleSpy).toHaveBeenCalledWith('Options:', options);

      consoleSpy.mockRestore();
    });

    it('should measure bootstrap duration', async () => {
      const result = await bootstrapServices();

      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });

    it('should log success summary', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await bootstrapServices();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bootstrap SUCCEEDED')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initialized: 0 services')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed: 0 services')
      );

      consoleSpy.mockRestore();
    });

    it('should handle default options', async () => {
      const result = await bootstrapServices();
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle empty options object', async () => {
      const result = await bootstrapServices({});
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should complete phases in order', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logs: string[] = [];
      
      consoleSpy.mockImplementation((message: string) => {
        logs.push(message);
      });

      await bootstrapServices();

      const phase1Index = logs.findIndex(log => log.includes('Phase 1'));
      const phase2Index = logs.findIndex(log => log.includes('Phase 2'));
      const phase3Index = logs.findIndex(log => log.includes('Phase 3'));
      const phase4Index = logs.findIndex(log => log.includes('Phase 4'));

      expect(phase1Index).toBeLessThan(phase2Index);
      expect(phase2Index).toBeLessThan(phase3Index);
      expect(phase3Index).toBeLessThan(phase4Index);

      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should return valid result structure', async () => {
      const result = await bootstrapServices();

      // Verify result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('initializedServices');
      expect(result).toHaveProperty('failedServices');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('duration');
      
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.initializedServices)).toBe(true);
      expect(Array.isArray(result.failedServices)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.duration).toBe('number');
    });

    it('should return duration as a number', async () => {
      const result = await bootstrapServices();
      
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cleanupServices', () => {
    it('should cleanup all services', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await cleanupServices();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up V2 services')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('All services cleaned up')
      );

      consoleSpy.mockRestore();
    });

    it('should clear the registry', async () => {
      await cleanupServices();

      const stats = getRegistryStats();
      expect(stats.servicesCount).toBe(0);
      expect(stats.registeredServices).toEqual([]);
    });

    it('should handle cleanup errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(cleanupServices()).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getBootstrapStatus', () => {
    it('should return registry stats', () => {
      const status = getBootstrapStatus();

      expect(status).toHaveProperty('registeredServices');
      expect(status).toHaveProperty('servicesCount');
      expect(status).toHaveProperty('waitingServices');
      expect(status).toHaveProperty('waitersCount');
    });

    it('should reflect empty state initially', () => {
      const status = getBootstrapStatus();

      expect(status.servicesCount).toBe(0);
      expect(status.registeredServices).toEqual([]);
    });
  });

  describe('Integration', () => {
    it('should bootstrap and cleanup in sequence', async () => {
      // Bootstrap
      const bootstrapResult = await bootstrapServices();
      expect(bootstrapResult.success).toBe(true);

      // Cleanup
      await cleanupServices();

      // Verify clean state
      const stats = getRegistryStats();
      expect(stats.servicesCount).toBe(0);
    });

    it('should support multiple bootstrap calls', async () => {
      const result1 = await bootstrapServices();
      const result2 = await bootstrapServices();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should measure realistic bootstrap time', async () => {
      const start = performance.now();
      const result = await bootstrapServices();
      const end = performance.now();

      // Bootstrap duration should be close to actual time
      expect(result.duration).toBeLessThanOrEqual(end - start + 50); // +50ms tolerance
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Options handling', () => {
    it('should handle enableMock option', async () => {
      const result = await bootstrapServices({ enableMock: true });
      expect(result.success).toBe(true);
    });

    it('should handle enableDevTools option', async () => {
      const result = await bootstrapServices({ enableDevTools: true });
      expect(result.success).toBe(true);
    });

    it('should handle enablePerformanceTracking option', async () => {
      const result = await bootstrapServices({ enablePerformanceTracking: true });
      expect(result.success).toBe(true);
    });

    it('should handle apiBaseUrl option', async () => {
      const result = await bootstrapServices({ apiBaseUrl: 'https://api.test.com' });
      expect(result.success).toBe(true);
    });

    it('should handle all options combined', async () => {
      const result = await bootstrapServices({
        enableMock: true,
        enableDevTools: true,
        enablePerformanceTracking: true,
        apiBaseUrl: 'https://api.test.com',
      });
      expect(result.success).toBe(true);
    });
  });
});
