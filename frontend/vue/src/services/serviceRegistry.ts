import type { ServiceName, ServiceRegistry, ServiceWaiter } from './serviceTypes';

/**
 * Global service registry for dependency injection
 * Allows services to access each other without circular dependencies
 */
class Registry implements ServiceRegistry {
  private services = new Map<ServiceName, any>();
  private waiters = new Map<ServiceName, ServiceWaiter[]>();
  private readonly WAIT_TIMEOUT = 10000; // 10 seconds

  /**
   * Register a service in the registry
   */
  register(name: ServiceName, service: any): void {
    if (this.services.has(name)) {
      console.warn(`Service "${name}" is already registered. Overwriting.`);
    }

    this.services.set(name, service);
    console.log(`✅ Service registered: ${name}`);

    // Resolve any waiting promises
    this.resolveWaiters(name, service);
  }

  /**
   * Get a service synchronously (may return undefined if not yet registered)
   */
  get<T = any>(name: ServiceName): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  /**
   * Get a service asynchronously (waits for registration if not available)
   * This is the preferred method for cross-service communication
   */
  async getAsync<T = any>(name: ServiceName): Promise<T> {
    // If service is already registered, return it immediately
    const service = this.services.get(name);
    if (service) {
      return service as T;
    }

    // Otherwise, wait for it to be registered
    return new Promise<T>((resolve, reject) => {
      if (!this.waiters.has(name)) {
        this.waiters.set(name, []);
      }

      // Setup timeout
      const timeout = setTimeout(() => {
        const waiterList = this.waiters.get(name) || [];
        const index = waiterList.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          waiterList.splice(index, 1);
        }

        reject(
          new Error(
            `Timeout waiting for service "${name}" to be registered (${this.WAIT_TIMEOUT}ms)`
          )
        );
      }, this.WAIT_TIMEOUT);

      this.waiters.get(name)!.push({
        resolve,
        reject,
        timeout,
      });
    });
  }

  /**
   * Check if a service is registered
   */
  has(name: ServiceName): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all services (mainly for testing)
   */
  clear(): void {
    // Clear all timeout timers
    for (const waiterList of this.waiters.values()) {
      for (const waiter of waiterList) {
        if (waiter.timeout) {
          clearTimeout(waiter.timeout);
        }
      }
    }

    this.services.clear();
    this.waiters.clear();
    console.log('🧹 Service registry cleared');
  }

  /**
   * Get all registered services (for debugging)
   */
  getAll(): Map<ServiceName, any> {
    return new Map(this.services);
  }

  /**
   * Resolve all promises waiting for a specific service
   */
  private resolveWaiters(name: ServiceName, service: any): void {
    const waiterList = this.waiters.get(name);
    if (!waiterList || waiterList.length === 0) {
      return;
    }

    console.log(`⏳ Resolving ${waiterList.length} waiters for service "${name}"`);

    for (const waiter of waiterList) {
      if (waiter.timeout) {
        clearTimeout(waiter.timeout);
      }
      waiter.resolve(service);
    }

    // Clear the waiter list
    this.waiters.delete(name);
  }

  /**
   * Get statistics about the registry (for debugging)
   */
  getStats() {
    return {
      registeredServices: Array.from(this.services.keys()),
      servicesCount: this.services.size,
      waitingServices: Array.from(this.waiters.keys()),
      waitersCount: Array.from(this.waiters.values()).reduce(
        (sum, list) => sum + list.length,
        0
      ),
    };
  }
}

// Global singleton instance
const registry = new Registry();

// Export the registry instance
export default registry;

// Export convenience functions
export const registerService = (name: ServiceName, service: any) => {
  registry.register(name, service);
};

export const getService = <T = any>(name: ServiceName): T | undefined => {
  return registry.get<T>(name);
};

export const getServiceAsync = async <T = any>(name: ServiceName): Promise<T> => {
  return registry.getAsync<T>(name);
};

export const hasService = (name: ServiceName): boolean => {
  return registry.has(name);
};

export const clearRegistry = () => {
  registry.clear();
};

export const getRegistryStats = () => {
  return registry.getStats();
};

// For debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).__serviceRegistry = registry;
}
