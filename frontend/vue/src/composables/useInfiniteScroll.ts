import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'

interface UseInfiniteScrollOptions {
  threshold?: number
  disabled?: Ref<boolean>
}

/**
 * Simple debounce function
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Composable for detecting when user scrolls near bottom to trigger loading more content
 *
 * @param onLoadMore - Callback to execute when user scrolls near bottom
 * @param options - Configuration options
 * @returns Object with scrollContainer ref
 */
export function useInfiniteScroll(
  onLoadMore: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 300, disabled } = options

  const scrollContainer = ref<HTMLElement | null>(null)

  /**
   * Check if scroll position is near bottom of container
   */
  function isNearBottom(): boolean {
    if (!scrollContainer.value) return false

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  /**
   * Handle scroll event with debouncing
   */
  const handleScroll = debounce(() => {
    if (disabled?.value) return
    if (isNearBottom()) {
      void onLoadMore()
    }
  }, 100)

  /**
   * Setup scroll listener on mount
   */
  onMounted(() => {
    scrollContainer.value?.addEventListener('scroll', handleScroll)
  })

  /**
   * Cleanup on unmount
   */
  onBeforeUnmount(() => {
    scrollContainer.value?.removeEventListener('scroll', handleScroll)
  })

  return {
    scrollContainer,
  }
}
