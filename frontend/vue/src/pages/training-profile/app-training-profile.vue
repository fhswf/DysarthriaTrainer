<template>
    <div class="training-profile-container max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {{ t('trainingProfile.title') }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
                {{ t('trainingProfile.subtitle') }}
            </p>
        </div>

        <!-- Stats Overview Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <!-- Total Sessions -->
            <Card class="stat-card">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="stat-icon bg-blue-100 text-blue-600">
                            <i class="pi pi-calendar text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.totalSessions }}</p>
                            <p class="text-sm text-gray-500">{{ t('trainingProfile.stats.totalSessions') }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Total Practice Time -->
            <Card class="stat-card">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="stat-icon bg-green-100 text-green-600">
                            <i class="pi pi-clock text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.totalMinutes }}
                                <span class="text-base font-normal">min</span>
                            </p>
                            <p class="text-sm text-gray-500">{{ t('trainingProfile.stats.practiceTime') }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Exercises Completed -->
            <Card class="stat-card">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="stat-icon bg-purple-100 text-purple-600">
                            <i class="pi pi-check-circle text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.exercisesCompleted
                                }}
                            </p>
                            <p class="text-sm text-gray-500">{{ t('trainingProfile.stats.exercisesCompleted') }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Current Streak -->
            <Card class="stat-card">
                <template #content>
                    <div class="flex items-center gap-4">
                        <div class="stat-icon bg-orange-100 text-orange-600">
                            <i class="pi pi-bolt text-2xl"></i>
                        </div>
                        <div>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.currentStreak }}
                                <span class="text-base font-normal">{{ t('trainingProfile.stats.days') }}</span>
                            </p>
                            <p class="text-sm text-gray-500">{{ t('trainingProfile.stats.currentStreak') }}</p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Sessions -->
            <div class="lg:col-span-2">
                <Card>
                    <template #header>
                        <div class="flex items-center justify-between px-6 pt-6">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                <i class="pi pi-history mr-2"></i>
                                {{ t('trainingProfile.recentSessions.title') }}
                            </h2>
                            <Button :label="t('trainingProfile.recentSessions.viewAll')" text size="small"
                                icon="pi pi-arrow-right" icon-pos="right" disabled />
                        </div>
                    </template>
                    <template #content>
                        <div v-if="recentSessions.length > 0" class="space-y-4">
                            <div v-for="session in recentSessions" :key="session.id"
                                class="session-item flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                                <div class="session-icon flex-shrink-0">
                                    <i :class="getSessionIcon(session.type)"
                                        class="text-xl p-2 rounded-full bg-primary-100 text-primary-600"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {{ session.exerciseName }}
                                    </p>
                                    <p class="text-sm text-gray-500">
                                        {{ formatDate(session.date) }} • {{ session.duration }} min
                                    </p>
                                </div>
                                <div class="flex-shrink-0">
                                    <Tag :value="getScoreLabel(session.score)"
                                        :severity="getScoreSeverity(session.score)" rounded />
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            <i class="pi pi-inbox text-4xl mb-4 block opacity-50"></i>
                            <p>{{ t('trainingProfile.recentSessions.empty') }}</p>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Achievements -->
            <div class="lg:col-span-1">
                <Card>
                    <template #header>
                        <div class="flex items-center justify-between px-6 pt-6">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                <i class="pi pi-star mr-2"></i>
                                {{ t('trainingProfile.achievements.title') }}
                            </h2>
                        </div>
                    </template>
                    <template #content>
                        <div v-if="achievements.length > 0" class="space-y-4">
                            <div v-for="achievement in achievements" :key="achievement.id"
                                class="achievement-item flex items-center gap-3 p-3 rounded-lg"
                                :class="achievement.unlocked ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-100 dark:bg-gray-800 opacity-60'">
                                <div class="achievement-icon text-2xl">
                                    {{ achievement.icon }}
                                </div>
                                <div class="flex-1">
                                    <p class="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {{ achievement.name }}
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        {{ achievement.description }}
                                    </p>
                                </div>
                                <i v-if="achievement.unlocked" class="pi pi-check-circle text-green-500"></i>
                                <i v-else class="pi pi-lock text-gray-400"></i>
                            </div>
                        </div>
                        <div v-else class="text-center py-8 text-gray-500">
                            <i class="pi pi-trophy text-4xl mb-4 block opacity-50"></i>
                            <p>{{ t('trainingProfile.achievements.empty') }}</p>
                        </div>
                    </template>
                </Card>

                <!-- Training Results Summary -->
                <Card class="mt-6">
                    <template #header>
                        <div class="px-6 pt-6">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                <i class="pi pi-chart-bar mr-2"></i>
                                {{ t('trainingProfile.results.title') }}
                            </h2>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <!-- Accuracy -->
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-600 dark:text-gray-400">{{
                                        t('trainingProfile.results.accuracy') }}</span>
                                    <span class="font-medium">{{ results.accuracy }}%</span>
                                </div>
                                <ProgressBar :value="results.accuracy" :show-value="false" class="h-2" />
                            </div>

                            <!-- Pronunciation -->
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-600 dark:text-gray-400">{{
                                        t('trainingProfile.results.pronunciation') }}</span>
                                    <span class="font-medium">{{ results.pronunciation }}%</span>
                                </div>
                                <ProgressBar :value="results.pronunciation" :show-value="false" class="h-2" />
                            </div>

                            <!-- Fluency -->
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span class="text-gray-600 dark:text-gray-400">{{
                                        t('trainingProfile.results.fluency') }}</span>
                                    <span class="font-medium">{{ results.fluency }}%</span>
                                </div>
                                <ProgressBar :value="results.fluency" :show-value="false" class="h-2" />
                            </div>
                        </div>

                        <Divider />

                        <div class="text-center">
                            <p class="text-sm text-gray-500 mb-2">{{ t('trainingProfile.results.overallScore') }}</p>
                            <p class="text-4xl font-bold text-primary-600">{{ results.overallScore }}%</p>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Placeholder Notice -->
        <div
            class="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div class="flex items-start gap-3">
                <i class="pi pi-info-circle text-yellow-600 text-xl flex-shrink-0 mt-0.5"></i>
                <div>
                    <p class="font-medium text-yellow-800 dark:text-yellow-200">
                        {{ t('trainingProfile.placeholder.title') }}
                    </p>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {{ t('trainingProfile.placeholder.description') }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useLocalizationStore } from '@/stores/localization';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Divider from 'primevue/divider';

const loc = useLocalizationStore();

// Translation helper
const t = (key: string) => loc.t(key);

// Mock data - will be replaced with real API calls
const stats = ref({
    totalSessions: 24,
    totalMinutes: 186,
    exercisesCompleted: 42,
    currentStreak: 5,
});

const recentSessions = ref([
    {
        id: '1',
        exerciseName: 'Lippenbewegung Grundübung',
        type: 'movement',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        duration: 8,
        score: 85,
    },
    {
        id: '2',
        exerciseName: 'Zungenübung Level 2',
        type: 'speech',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
        duration: 12,
        score: 72,
    },
    {
        id: '3',
        exerciseName: 'Atemübung Entspannung',
        type: 'breathing',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        duration: 15,
        score: 90,
    },
    {
        id: '4',
        exerciseName: 'Silbentraining /pa/ /ta/ /ka/',
        type: 'speech',
        date: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
        duration: 10,
        score: 65,
    },
]);

const achievements = ref([
    {
        id: '1',
        name: 'Erste Schritte',
        description: 'Erste Übung abgeschlossen',
        icon: '🎯',
        unlocked: true,
    },
    {
        id: '2',
        name: 'Durchhalter',
        description: '7 Tage in Folge trainiert',
        icon: '🔥',
        unlocked: true,
    },
    {
        id: '3',
        name: 'Perfektionist',
        description: '100% in einer Übung',
        icon: '⭐',
        unlocked: false,
    },
    {
        id: '4',
        name: 'Marathonläufer',
        description: '30 Minuten Training',
        icon: '🏃',
        unlocked: true,
    },
    {
        id: '5',
        name: 'Meister',
        description: 'Alle Übungen einer Kategorie',
        icon: '🏆',
        unlocked: false,
    },
]);

const results = ref({
    accuracy: 78,
    pronunciation: 82,
    fluency: 71,
    overallScore: 77,
});

// Helper functions
const getSessionIcon = (type: string): string => {
    switch (type) {
        case 'movement':
            return 'pi pi-sync';
        case 'speech':
            return 'pi pi-volume-up';
        case 'breathing':
            return 'pi pi-heart';
        default:
            return 'pi pi-play';
    }
};

const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
        return loc.currentLocale === 'de' ? 'Gerade eben' : 'Just now';
    } else if (diffHours < 24) {
        return loc.currentLocale === 'de' ? `Vor ${diffHours} Stunden` : `${diffHours}h ago`;
    } else if (diffDays === 1) {
        return loc.currentLocale === 'de' ? 'Gestern' : 'Yesterday';
    } else if (diffDays < 7) {
        return loc.currentLocale === 'de' ? `Vor ${diffDays} Tagen` : `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString(loc.currentLocale === 'de' ? 'de-DE' : 'en-US');
    }
};

const getScoreLabel = (score: number): string => {
    if (score >= 90) return loc.currentLocale === 'de' ? 'Exzellent' : 'Excellent';
    if (score >= 75) return loc.currentLocale === 'de' ? 'Gut' : 'Good';
    if (score >= 60) return loc.currentLocale === 'de' ? 'OK' : 'OK';
    return loc.currentLocale === 'de' ? 'Üben' : 'Practice';
};

const getScoreSeverity = (score: number): 'success' | 'info' | 'warn' | 'danger' => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warn';
    return 'danger';
};
</script>

<style scoped>
.training-profile-container {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.session-item {
    transition: background-color 0.2s ease;
}

.session-item:hover {
    background-color: var(--surface-100);
}

.achievement-item {
    transition: transform 0.2s ease;
}

.achievement-item:hover {
    transform: translateX(4px);
}

/* Override ProgressBar height */
:deep(.p-progressbar) {
    height: 8px !important;
    border-radius: 4px;
}

:deep(.p-progressbar-value) {
    border-radius: 4px;
}
</style>
