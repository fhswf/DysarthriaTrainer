/**
 * Audio Quality Composable
 *
 * Monitors real-time audio quality metrics during recording.
 * Provides warnings for poor audio quality.
 */

import { ref, computed } from 'vue'

export interface QualityMetrics {
  snr_db: number | null
  rms_energy: number | null
  clipping_detected: boolean
  spectral_flatness: number | null
}

export interface QualityThresholds {
  minSnrDb: number
  minRmsEnergy: number
  maxSpectralFlatness: number
}

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor'

export function useAudioQuality() {
  const metrics = ref<QualityMetrics | null>(null)
  const warnings = ref<string[]>([])
  const isAcceptable = ref(true)

  // Rolling average of last N metrics (for smoothing)
  const metricsHistory = ref<QualityMetrics[]>([])
  const historySize = 5 // Keep last 5 seconds
  const minEnergyThreshold = 0.005 // Ignore samples below this threshold (silence)

  // Default quality thresholds
  const thresholds: QualityThresholds = {
    minSnrDb: 15,
    minRmsEnergy: 0.02,
    maxSpectralFlatness: 0.5,
  }

  /**
   * Update quality metrics with rolling average
   */
  const updateMetrics = (newMetrics: QualityMetrics): void => {
    console.log('[AudioQuality] Updating metrics:', newMetrics)

    // Add to history if it's not silence (has meaningful energy)
    const hasSignal = newMetrics.rms_energy !== null && newMetrics.rms_energy > minEnergyThreshold

    if (hasSignal) {
      metricsHistory.value.push(newMetrics)

      // Keep only last N entries
      if (metricsHistory.value.length > historySize) {
        metricsHistory.value.shift()
      }

      // Calculate averaged metrics from history
      if (metricsHistory.value.length > 0) {
        const avgMetrics: QualityMetrics = {
          snr_db: average(metricsHistory.value.map((m) => m.snr_db)),
          rms_energy: average(metricsHistory.value.map((m) => m.rms_energy)),
          clipping_detected: metricsHistory.value.some((m) => m.clipping_detected),
          spectral_flatness: average(metricsHistory.value.map((m) => m.spectral_flatness)),
        }

        metrics.value = avgMetrics
        console.log(
          '[AudioQuality] Averaged metrics from',
          metricsHistory.value.length,
          'samples:',
          avgMetrics
        )
      } else {
        metrics.value = newMetrics
      }
    } else {
      console.log('[AudioQuality] Skipping silent chunk (RMS:', newMetrics.rms_energy, ')')
      // Keep previous metrics during silence
      if (!metrics.value) {
        metrics.value = newMetrics // First chunk even if silent
      }
    }

    analyzeQuality()
    console.log('[AudioQuality] Metrics updated. Quality level:', qualityLevel.value)
  }

  /**
   * Helper to calculate average of nullable numbers
   */
  const average = (values: (number | null)[]): number | null => {
    const validValues = values.filter((v): v is number => v !== null)
    if (validValues.length === 0) return null
    return validValues.reduce((sum, v) => sum + v, 0) / validValues.length
  }

  /**
   * Analyze quality and generate warnings
   */
  const analyzeQuality = (): void => {
    if (!metrics.value) return

    const newWarnings: string[] = []
    let acceptable = true

    // Check SNR
    if (metrics.value.snr_db !== null) {
      if (metrics.value.snr_db < 10) {
        newWarnings.push(
          'Sehr schlechte Audioqualität: Hohes Hintergrundrauschen. Bitte reduzieren Sie Umgebungsgeräusche.'
        )
        acceptable = false
      } else if (metrics.value.snr_db < thresholds.minSnrDb) {
        newWarnings.push(
          'Mäßige Audioqualität: Hintergrundrauschen erkannt. Für beste Ergebnisse in ruhiger Umgebung aufnehmen.'
        )
      }
    }

    // Check clipping
    if (metrics.value.clipping_detected) {
      newWarnings.push(
        'Audio-Verzerrung erkannt (Clipping). Bitte reduzieren Sie die Mikrofon-Lautstärke oder den Abstand.'
      )
      acceptable = false
    }

    // Check RMS energy (volume)
    if (metrics.value.rms_energy !== null && metrics.value.rms_energy < thresholds.minRmsEnergy) {
      newWarnings.push(
        'Audio zu leise. Bitte sprechen Sie lauter oder bewegen Sie sich näher zum Mikrofon.'
      )
    }

    // Check spectral flatness (noisiness)
    if (
      metrics.value.spectral_flatness !== null &&
      metrics.value.spectral_flatness > thresholds.maxSpectralFlatness
    ) {
      newWarnings.push(
        'Starkes Rauschen erkannt. Bitte verwenden Sie ein besseres Mikrofon oder reduzieren Sie Umgebungsgeräusche.'
      )
    }

    warnings.value = newWarnings
    isAcceptable.value = acceptable
  }

  /**
   * Get overall quality level
   */
  const qualityLevel = computed((): QualityLevel => {
    if (!metrics.value) return 'poor'

    let score = 0
    let maxScore = 0

    // SNR scoring
    if (metrics.value.snr_db !== null) {
      maxScore += 40
      if (metrics.value.snr_db >= 20) score += 40
      else if (metrics.value.snr_db >= 15) score += 30
      else if (metrics.value.snr_db >= 10) score += 15
    }

    // Clipping scoring
    maxScore += 30
    if (!metrics.value.clipping_detected) score += 30

    // RMS energy scoring
    if (metrics.value.rms_energy !== null) {
      maxScore += 15
      if (metrics.value.rms_energy >= 0.1) score += 15
      else if (metrics.value.rms_energy >= 0.05) score += 10
      else if (metrics.value.rms_energy >= 0.02) score += 5
    }

    // Spectral flatness scoring
    if (metrics.value.spectral_flatness !== null) {
      maxScore += 15
      if (metrics.value.spectral_flatness <= 0.3) score += 15
      else if (metrics.value.spectral_flatness <= 0.5) score += 10
      else if (metrics.value.spectral_flatness <= 0.7) score += 5
    }

    // Calculate percentage
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

    // Determine level
    if (percentage >= 85) return 'excellent'
    if (percentage >= 70) return 'good'
    if (percentage >= 50) return 'fair'
    return 'poor'
  })

  /**
   * Get quality level color
   */
  const qualityColor = computed((): string => {
    switch (qualityLevel.value) {
      case 'excellent':
        return '#4CAF50' // Green
      case 'good':
        return '#8BC34A' // Light green
      case 'fair':
        return '#FFC107' // Amber
      case 'poor':
        return '#F44336' // Red
      default:
        return '#9E9E9E' // Grey
    }
  })

  /**
   * Get quality level label
   */
  const qualityLabel = computed((): string => {
    switch (qualityLevel.value) {
      case 'excellent':
        return 'Ausgezeichnet'
      case 'good':
        return 'Gut'
      case 'fair':
        return 'Ausreichend'
      case 'poor':
        return 'Schlecht'
      default:
        return 'Unbekannt'
    }
  })

  /**
   * Clear metrics and warnings
   */
  const clear = (): void => {
    metrics.value = null
    warnings.value = []
    isAcceptable.value = true
    metricsHistory.value = []
  }

  /**
   * Check if quality is acceptable for speech therapy
   */
  const isSuitableForTherapy = computed((): boolean => {
    return qualityLevel.value === 'excellent' || qualityLevel.value === 'good'
  })

  return {
    // State
    metrics,
    warnings,
    isAcceptable,
    qualityLevel,
    qualityColor,
    qualityLabel,
    isSuitableForTherapy,

    // Actions
    updateMetrics,
    clear,
  }
}
