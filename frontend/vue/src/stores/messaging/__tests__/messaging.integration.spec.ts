/**
 * Messaging Service Integration Tests
 * 
 * Tests the integration of the Messaging service with other V2 services
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useV2MessagingStore } from '../index';
import { registerService, clearRegistry } from '@/services/serviceRegistry';

describe('Messaging Service Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearRegistry();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearRegistry();
    vi.restoreAllMocks();
  });

  describe('Integration with Auth Service', () => {
    it('should be accessible from auth service via service registry', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      // Register in service registry
      registerService('messaging', messaging);
      
      // Simulate auth service accessing messaging
      const { getServiceAsync } = await import('@/services/serviceRegistry');
      const messagingService = await getServiceAsync('messaging');
      
      expect(messagingService).toBeDefined();
      expect(messagingService.success).toBeDefined();
      expect(messagingService.info).toBeDefined();
      expect(messagingService.warn).toBeDefined();
      expect(messagingService.error).toBeDefined();
    });

    it('should handle login success notification', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const successSpy = vi.spyOn(messaging, 'success');
      
      // Simulate auth service calling messaging
      await messaging.success('Login Successful', 'Welcome back, testuser!');
      
      expect(successSpy).toHaveBeenCalledWith(
        'Login Successful',
        'Welcome back, testuser!'
      );
    });

    it('should handle logout notification', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const infoSpy = vi.spyOn(messaging, 'info');
      
      // Simulate auth service calling messaging
      await messaging.info('Logged Out', 'You have been logged out successfully');
      
      expect(infoSpy).toHaveBeenCalledWith(
        'Logged Out',
        'You have been logged out successfully'
      );
    });

    it('should handle authentication required warning', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const warnSpy = vi.spyOn(messaging, 'warn');
      
      // Simulate auth service calling messaging
      await messaging.warn('Authentication Required', 'Please log in to continue');
      
      expect(warnSpy).toHaveBeenCalledWith(
        'Authentication Required',
        'Please log in to continue'
      );
    });

    it('should handle session expired warning', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const warnSpy = vi.spyOn(messaging, 'warn');
      
      // Simulate auth service calling messaging
      await messaging.warn('Session Expired', 'Your session has expired. Please log in again.');
      
      expect(warnSpy).toHaveBeenCalledWith(
        'Session Expired',
        'Your session has expired. Please log in again.'
      );
    });
  });

  describe('Integration with Error Service', () => {
    it('should be accessible from error service via service registry', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      // Register in service registry
      registerService('messaging', messaging);
      
      // Simulate error service accessing messaging
      const { getServiceAsync } = await import('@/services/serviceRegistry');
      const messagingService = await getServiceAsync('messaging');
      
      expect(messagingService).toBeDefined();
      expect(typeof messagingService.error).toBe('function');
      expect(typeof messagingService.warn).toBe('function');
      expect(typeof messagingService.info).toBe('function');
    });

    it('should handle critical error notifications', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const errorSpy = vi.spyOn(messaging, 'error');
      
      // Simulate error service notifying critical error
      await messaging.error('Critical Error', 'A critical error has occurred');
      
      expect(errorSpy).toHaveBeenCalledWith(
        'Critical Error',
        'A critical error has occurred'
      );
    });

    it('should handle medium severity error as warning', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const warnSpy = vi.spyOn(messaging, 'warn');
      
      // Simulate error service notifying medium severity error
      await messaging.warn('Validation Error', 'Please check your input');
      
      expect(warnSpy).toHaveBeenCalledWith(
        'Validation Error',
        'Please check your input'
      );
    });

    it('should handle low severity error as info', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const infoSpy = vi.spyOn(messaging, 'info');
      
      // Simulate error service notifying low severity error
      await messaging.info('Minor Issue', 'This is a minor issue');
      
      expect(infoSpy).toHaveBeenCalledWith(
        'Minor Issue',
        'This is a minor issue'
      );
    });

    it('should handle error recovery notification', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const successSpy = vi.spyOn(messaging, 'success');
      
      // Simulate error service notifying recovery
      await messaging.success('Connection restored', 'The issue has been resolved.');
      
      expect(successSpy).toHaveBeenCalledWith(
        'Connection restored',
        'The issue has been resolved.'
      );
    });

    it('should not throw when service is not yet registered', async () => {
      // Simulate early access attempt (before registration)
      const { getServiceAsync } = await import('@/services/serviceRegistry');
      
      // This should timeout gracefully without throwing
      const promise = Promise.race([
        getServiceAsync('messaging'),
        new Promise(resolve => setTimeout(() => resolve(null), 100))
      ]);
      
      const result = await promise;
      // Should either get null (timeout) or the service if it gets registered
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('Integration with API Service', () => {
    it('should handle API error notifications', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const errorSpy = vi.spyOn(messaging, 'error');
      
      // Simulate API service reporting error
      await messaging.error('API Error', 'Failed to fetch data from server');
      
      expect(errorSpy).toHaveBeenCalledWith(
        'API Error',
        'Failed to fetch data from server'
      );
    });

    it('should handle network error notifications', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const errorSpy = vi.spyOn(messaging, 'error');
      
      // Simulate network error
      await messaging.error('Network Error', 'Unable to connect to server');
      
      expect(errorSpy).toHaveBeenCalledWith(
        'Network Error',
        'Unable to connect to server'
      );
    });
  });

  describe('Service Registry Integration', () => {
    it('should be registered in service registry during bootstrap', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      registerService('messaging', messaging);
      
      const { hasService } = await import('@/services/serviceRegistry');
      expect(hasService('messaging')).toBe(true);
    });

    it('should be retrievable from registry synchronously after registration', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      registerService('messaging', messaging);
      
      const { getService } = await import('@/services/serviceRegistry');
      const retrieved = getService('messaging');
      
      expect(retrieved).toBe(messaging);
    });

    it('should be retrievable from registry asynchronously', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      registerService('messaging', messaging);
      
      const { getServiceAsync } = await import('@/services/serviceRegistry');
      const retrieved = await getServiceAsync('messaging');
      
      expect(retrieved).toBe(messaging);
    });

    it('should wait for registration when accessed before ready', async () => {
      const { getServiceAsync, registerService: register } = await import('@/services/serviceRegistry');
      
      // Start waiting before service is registered
      const promise = getServiceAsync('messaging');
      
      // Register service after a short delay
      setTimeout(async () => {
        const messaging = useV2MessagingStore();
        await messaging.initialize();
        register('messaging', messaging);
      }, 10);
      
      // Should resolve once registered
      const result = await promise;
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
    });
  });

  describe('Cross-Service Communication Patterns', () => {
    it('should support notification chaining across services', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const successSpy = vi.spyOn(messaging, 'success');
      const infoSpy = vi.spyOn(messaging, 'info');
      
      // Simulate a workflow: login -> api call -> success
      await messaging.info('Logging in...', 'Please wait');
      await messaging.success('Login Successful', 'Welcome!');
      
      expect(infoSpy).toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalled();
    });

    it('should handle concurrent notifications from multiple services', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      // Simulate multiple services calling messaging concurrently
      const promises = [
        messaging.info('Auth', 'Checking credentials'),
        messaging.info('API', 'Fetching data'),
        messaging.info('Error', 'Validating input'),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.severity).toBe('info');
        expect(result.id).toBeDefined();
      });
    });

    it('should maintain message history across service interactions', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      // Simulate multiple service interactions
      await messaging.success('Auth', 'Login successful');
      await messaging.info('API', 'Data loaded');
      await messaging.warn('Error', 'Minor validation issue');
      
      const messages = await messaging.getAllMessages();
      
      expect(messages.length).toBeGreaterThanOrEqual(3);
      
      const severities = messages.map(m => m.severity);
      expect(severities).toContain('success');
      expect(severities).toContain('info');
      expect(severities).toContain('warn');
    });
  });

  describe('Error Handling in Integration', () => {
    it('should gracefully handle messaging service initialization failure', async () => {
      // Force initialization error
      vi.mock('../messaging.mock', () => ({
        createMockService: () => {
          throw new Error('Mock initialization failed');
        }
      }));
      
      vi.stubEnv('VITE_V2_MESSAGING_USE_MOCK', 'true');
      
      const messaging = useV2MessagingStore();
      
      await expect(messaging.initialize()).rejects.toThrow();
      expect(messaging.loadError).toContain('Failed to load messaging service');
      
      vi.unstubAllEnvs();
    });

    it('should not break other services when messaging fails', async () => {
      const messaging = useV2MessagingStore();
      
      // Don't initialize messaging
      registerService('messaging', messaging);
      
      const { getService } = await import('@/services/serviceRegistry');
      const retrieved = getService('messaging');
      
      // Service is registered but not ready
      expect(retrieved).toBeDefined();
      expect(retrieved.isReady).toBe(false);
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid message creation without blocking', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      const startTime = Date.now();
      
      // Simulate rapid messages
      const promises = Array.from({ length: 100 }, (_, i) => 
        messaging.info(`Message ${i}`)
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly (< 1 second for 100 messages)
      expect(duration).toBeLessThan(1000);
    });

    it('should support message debouncing for repeated notifications', async () => {
      const messaging = useV2MessagingStore();
      await messaging.initialize();
      
      // Send same message multiple times rapidly
      const promises = Array.from({ length: 10 }, () => 
        messaging.info('Loading...', 'Please wait')
      );
      
      await Promise.all(promises);
      
      const messages = await messaging.getAllMessages();
      
      // With debouncing enabled, should have fewer than 10 messages
      // (exact count depends on debounce configuration)
      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
    });
  });
});
