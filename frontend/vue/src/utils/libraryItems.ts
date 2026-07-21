/**
 * Library Items Utility Functions
 *
 * Helper functions for library items (type guards, formatters, etc.)
 *
 * @module utils/libraryItems
 */

import type { LibraryItem, LibraryItemType, LibraryItemContent } from '@/api/exercises'

/**
 * Type guard for LibraryItemType
 */
export function isLibraryItemType(value: unknown): value is LibraryItemType {
  return (
    typeof value === 'string' &&
    [
      'movement',
      'speech_practice',
      'information',
      'minimal_pair',
      'word',
      'sentence',
      'breathing',
      'vocalization',
      'articulation',
      'rhythm',
      'intonation',
    ].includes(value)
  )
}

/**
 * Type guard for LibraryItem
 */
export function isLibraryItem(value: unknown): value is LibraryItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'item_type' in value &&
    'contents' in value &&
    isLibraryItemType((value as LibraryItem).item_type)
  )
}

/**
 * Format duration in seconds to human-readable format
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1:30", "45s")
 *
 * @example
 * formatDuration(90) // "1:30"
 * formatDuration(45) // "45s"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '-'

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes}:00`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format repetitions with localized unit
 *
 * @param repetitions - Number of repetitions
 * @param locale - Locale for translation (default: 'de')
 * @returns Formatted string (e.g., "3×", "5 times")
 *
 * @example
 * formatRepetitions(3) // "3×"
 * formatRepetitions(null) // "-"
 */
export function formatRepetitions(repetitions: number | null | undefined): string {
  if (repetitions == null) return '-'
  return `${repetitions}×`
}

/**
 * Get icon class for item type
 *
 * @param itemType - The library item type
 * @returns PrimeIcons class name
 *
 * @example
 * getItemTypeIcon('movement') // "pi pi-arrow-right-arrow-left"
 */
export function getItemTypeIcon(itemType: LibraryItemType): string {
  const iconMap: Record<LibraryItemType, string> = {
    movement: 'pi pi-arrow-right-arrow-left',
    speech_practice: 'pi pi-microphone',
    information: 'pi pi-info-circle',
    minimal_pair: 'pi pi-sort-alt',
    word: 'pi pi-tag',
    sentence: 'pi pi-align-left',
    breathing: 'pi pi-circle',
    vocalization: 'pi pi-volume-up',
    articulation: 'pi pi-comments',
    rhythm: 'pi pi-chart-bar',
    intonation: 'pi pi-chart-line',
  }

  return iconMap[itemType] || 'pi pi-question-circle'
}

/**
 * Get severity for item type badge
 *
 * @param itemType - The library item type
 * @returns PrimeVue severity level
 */
export function getItemTypeSeverity(
  itemType: LibraryItemType
): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
  const severityMap: Record<LibraryItemType, 'success' | 'info' | 'warn' | 'secondary'> = {
    movement: 'info',
    speech_practice: 'success',
    information: 'secondary',
    minimal_pair: 'warn',
    word: 'info',
    sentence: 'info',
    breathing: 'success',
    vocalization: 'success',
    articulation: 'success',
    rhythm: 'info',
    intonation: 'info',
  }

  return severityMap[itemType] || 'secondary'
}

/**
 * Get languages from library item contents
 *
 * @param item - Library item with contents
 * @returns Array of language codes
 *
 * @example
 * getItemLanguages(item) // ["de", "en"]
 */
export function getItemLanguages(item: LibraryItem): string[] {
  return item.contents.map((content) => content.language)
}

/**
 * Get content for specific language
 *
 * @param item - Library item
 * @param language - Language code
 * @returns Content for language or undefined
 *
 * @example
 * getContentForLanguage(item, 'de') // { language: 'de', text_content: '...' }
 */
export function getContentForLanguage(
  item: LibraryItem,
  language: string
): LibraryItemContent | undefined {
  return item.contents.find((content) => content.language === language)
}

/**
 * Get primary text content (first language)
 *
 * @param item - Library item
 * @returns Text content of first language or empty string
 *
 * @example
 * getPrimaryTextContent(item) // "Mund öffnen"
 */
export function getPrimaryTextContent(item: LibraryItem): string {
  return item.contents[0]?.text_content ?? ''
}

/**
 * Check if item has audio content
 *
 * @param item - Library item
 * @returns True if any content has audio
 */
export function hasAudioContent(item: LibraryItem): boolean {
  return item.contents.some((content) => content.audio_file_url != null)
}

/**
 * Check if item has video content
 *
 * @param item - Library item
 * @returns True if any content has video
 */
export function hasVideoContent(item: LibraryItem): boolean {
  return item.contents.some((content) => content.video_file_url != null)
}

/**
 * Check if item has image content
 *
 * @param item - Library item
 * @returns True if any content has image
 */
export function hasImageContent(item: LibraryItem): boolean {
  return item.contents.some((content) => content.image_file_url != null)
}

/**
 * Get language display name
 *
 * @param code - Language code (ISO 639-1)
 * @returns Display name
 *
 * @example
 * getLanguageDisplayName('de') // "Deutsch"
 */
export function getLanguageDisplayName(code: string): string {
  const languageNames: Record<string, string> = {
    de: 'Deutsch',
    en: 'English',
    fr: 'Français',
    es: 'Español',
    it: 'Italiano',
  }

  return languageNames[code] || code.toUpperCase()
}

/**
 * Validate metadata JSON
 *
 * @param metadata - Metadata object or JSON string
 * @returns True if valid JSON object
 */
export function isValidMetadata(metadata: unknown): boolean {
  if (typeof metadata === 'object' && metadata !== null) {
    return true
  }

  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      return typeof parsed === 'object' && parsed !== null
    } catch {
      return false
    }
  }

  return false
}

/**
 * Sort library items by display order
 *
 * @param items - Array of library items
 * @returns Sorted array
 */
export function sortByDisplayOrder(items: LibraryItem[]): LibraryItem[] {
  return [...items].sort((a, b) => a.display_order - b.display_order)
}

/**
 * Group items by type
 *
 * @param items - Array of library items
 * @returns Map of type to items
 */
export function groupByType(items: LibraryItem[]): Map<LibraryItemType, LibraryItem[]> {
  const groups = new Map<LibraryItemType, LibraryItem[]>()

  for (const item of items) {
    const existing = groups.get(item.item_type) ?? []
    groups.set(item.item_type, [...existing, item])
  }

  return groups
}

/**
 * Filter items by language availability
 *
 * @param items - Array of library items
 * @param language - Language code to filter by
 * @returns Items that have content in specified language
 */
export function filterByLanguage(items: LibraryItem[], language: string): LibraryItem[] {
  return items.filter((item) => getItemLanguages(item).includes(language))
}
