/**
 * Exercise and Item Type Icon Utilities
 *
 * Provides consistent icon mapping for exercise types and item types.
 * All icons use PrimeIcons with the two-class format: 'pi pi-{icon}'
 */

/**
 * Get icon class for exercise type
 * ⚠️ CRITICAL: Always use two classes 'pi pi-{icon}'
 */
export function getExerciseTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    mouth: 'pi pi-comment',
    breathing: 'pi pi-cloud',
    voice: 'pi pi-volume-up',
    articulation: 'pi pi-microphone',
  }
  return iconMap[type] || 'pi pi-circle'
}

/**
 * Get color class for exercise type
 */
export function getExerciseTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    mouth: 'text-blue-600',
    breathing: 'text-cyan-600',
    voice: 'text-purple-600',
    articulation: 'text-pink-600',
  }
  return colorMap[type] || 'text-gray-500'
}

/**
 * Get icon class for exercise item type
 * ⚠️ CRITICAL: Always use two classes 'pi pi-{icon}'
 */
export function getItemTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    movement: 'pi pi-directions',
    speech_practice: 'pi pi-volume-down',
    information: 'pi pi-info-circle',
  }
  return iconMap[type] || 'pi pi-circle'
}

/**
 * Get color class for exercise item type
 */
export function getItemTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    movement: 'text-green-600',
    speech_practice: 'text-orange-600',
    information: 'text-gray-600',
  }
  return colorMap[type] || 'text-gray-500'
}

/**
 * Get severity for PrimeVue Tag component
 */
export function getItemTypeSeverity(
  type: string
): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
  const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
    movement: 'success',
    speech_practice: 'warning',
    information: 'info',
  }
  return severityMap[type] || 'secondary'
}
