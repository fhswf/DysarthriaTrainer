/**
 * Promise Queue
 * 
 * A concurrency-limiting queue for managing parallel async operations.
 * Ensures a maximum number of promises execute simultaneously.
 * 
 * @example
 * ```typescript
 * const queue = new PromiseQueue(3); // Max 3 concurrent requests
 * 
 * // Add 10 requests - only 3 run at a time
 * for (let i = 0; i < 10; i++) {
 *   queue.add(() => fetch(`/api/data/${i}`));
 * }
 * ```
 * 
 * @template T - The type of value the promises resolve to
 */
export class PromiseQueue<T> {
  /**
   * Maximum number of promises that can run concurrently
   */
  private readonly concurrency: number;

  /**
   * Current number of running promises
   */
  private runningCount: number;

  /**
   * Queue of pending promise functions
   */
  private queue: (() => Promise<T | void>)[];

  /**
   * Create a new Promise Queue
   * 
   * @param concurrency - Maximum number of concurrent promises (default: 5)
   */
  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
    this.runningCount = 0;
    this.queue = [];
  }

  /**
   * Add a promise-returning function to the queue
   * 
   * If the concurrency limit hasn't been reached, the promise executes immediately.
   * Otherwise, it's queued and will execute when a slot becomes available.
   * 
   * @param promiseFn - Function that returns a promise to execute
   * @returns Promise that resolves when the function executes
   * 
   * @example
   * ```typescript
   * const result = await queue.add(() => 
   *   fetch('/api/data').then(r => r.json())
   * );
   * ```
   */
  add(promiseFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        this.runningCount++;
        try {
          const result = await promiseFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.runningCount--;
          this.runNext();
        }
      };

      this.queue.push(task);
      if (this.runningCount < this.concurrency) {
        this.runNext();
      }
    });
  }

  /**
   * Execute the next queued task (internal)
   * 
   * Called automatically after a task completes to start the next one
   */
  private runNext() {
    if (this.runningCount < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      task!();
    }
  }

  /**
   * Clear all queued tasks
   * 
   * Running tasks are NOT cancelled - they will complete normally.
   * Only pending tasks in the queue are removed.
   * 
   * @example
   * ```typescript
   * queue.clear(); // Remove all pending tasks
   * ```
   */
  clear() {
    this.queue = [];
  }

  /**
   * Get the current number of running tasks
   * 
   * @returns Number of currently executing promises
   */
  get running(): number {
    return this.runningCount;
  }

  /**
   * Get the current number of queued tasks
   * 
   * @returns Number of tasks waiting to execute
   */
  get pending(): number {
    return this.queue.length;
  }
}
