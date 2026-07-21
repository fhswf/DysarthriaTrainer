/**
 * Exercises API Unit Tests
 *
 * Tests for exercise and exercise item API operations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { exercisesApi, exerciseItemsApi } from '@/api/exercises'
import { useApiStore } from '@/stores/api'
import type {
  ExerciseCreateDto,
  ExerciseUpdateDto,
  ExerciseListParams,
  ExerciseItemCreateDto,
  ExerciseItemUpdateDto,
  ExerciseItemListParams,
} from '@/api/exercises'

describe('ExercisesApi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubEnv('VITE_USE_MOCK_API', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(exercisesApi).toBeDefined()
    })
  })

  describe('list()', () => {
    it('should fetch list of exercises without parameters', async () => {
      const response = await exercisesApi.list()

      expect(response).toBeDefined()
      expect(response).toHaveProperty('exercises')
      expect(response).toHaveProperty('total')
      expect(response).toHaveProperty('page')
      expect(response).toHaveProperty('page_size')
    })

    it('should fetch list with category filter', async () => {
      const params: ExerciseListParams = {
        category_id: '123',
        active_only: true,
      }

      const response = await exercisesApi.list(params)
      expect(response).toBeDefined()
    })

    it('should fetch list with pagination', async () => {
      const params: ExerciseListParams = {
        page: 2,
        page_size: 20,
      }

      const response = await exercisesApi.list(params)
      expect(response).toBeDefined()
    })

    it('should support abort signal', async () => {
      const controller = new AbortController()
      const promise = exercisesApi.list(undefined, controller.signal)

      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('getById()', () => {
    it('should fetch exercise by ID', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const exercise = await exercisesApi.getById(exerciseId)

      expect(exercise).toBeDefined()
      expect(exercise).toHaveProperty('id')
      expect(exercise).toHaveProperty('category_id')
      expect(exercise).toHaveProperty('title')
    })

    it('should fetch exercise with instructions', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const exercise = await exercisesApi.getById(exerciseId, {
        load_instructions: true,
      })

      expect(exercise).toBeDefined()
      expect(exercise).toHaveProperty('instructions')
    })

    it('should fetch exercise with items', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const exercise = await exercisesApi.getById(exerciseId, {
        load_items: true,
        language: 'de',
      })

      expect(exercise).toBeDefined()
      expect(exercise).toHaveProperty('items')
    })

    it('should support abort signal', async () => {
      const controller = new AbortController()
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const promise = exercisesApi.getById(exerciseId, undefined, controller.signal)

      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('getByCode()', () => {
    it('should fetch exercise by code', async () => {
      const exercise = await exercisesApi.getByCode('LT001')

      expect(exercise).toBeDefined()
      expect(exercise).toHaveProperty('exercise_code')
    })

    it('should support abort signal', async () => {
      const controller = new AbortController()
      const promise = exercisesApi.getByCode('LT001', controller.signal)

      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('create()', () => {
    it('should create a new exercise', async () => {
      const newExercise: ExerciseCreateDto = {
        category_id: '123',
        exercise_code: 'LT999',
        title: 'Test Exercise',
        difficulty_level: 'beginner',
        is_active: true,
      }

      const created = await exercisesApi.create(newExercise)

      expect(created).toBeDefined()
      expect(created).toHaveProperty('id')
    })

    it('should create exercise with all optional fields', async () => {
      const newExercise: ExerciseCreateDto = {
        category_id: '123',
        exercise_code: 'LT998',
        title: 'Complete Exercise',
        subtitle: 'Test Subtitle',
        description: 'Test Description',
        difficulty_level: 'intermediate',
        estimated_duration_minutes: 30,
        instructions: ['Step 1', 'Step 2'],
        is_active: true,
      }

      const created = await exercisesApi.create(newExercise)
      expect(created).toBeDefined()
    })
  })

  describe('update()', () => {
    it('should update exercise with partial data', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: ExerciseUpdateDto = {
        title: 'Updated Title',
      }

      const updated = await exercisesApi.update(exerciseId, updateData)
      expect(updated).toBeDefined()
    })

    it('should update multiple fields', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: ExerciseUpdateDto = {
        title: 'Multi Update',
        difficulty_level: 'advanced',
        estimated_duration_minutes: 45,
        is_active: false,
      }

      const updated = await exercisesApi.update(exerciseId, updateData)
      expect(updated).toBeDefined()
    })
  })

  describe('delete()', () => {
    it('should delete exercise by ID', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'

      await expect(exercisesApi.delete(exerciseId)).resolves.toBeUndefined()
    })
  })

  describe('getWithItems()', () => {
    it('should fetch exercise with all items (convenience method)', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const exercise = await exercisesApi.getWithItems(exerciseId)

      expect(exercise).toBeDefined()
      expect(exercise).toHaveProperty('items')
      expect(exercise).toHaveProperty('instructions')
    })

    it('should fetch exercise with items in specific language', async () => {
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'
      const exercise = await exercisesApi.getWithItems(exerciseId, 'en')

      expect(exercise).toBeDefined()
    })
  })

  describe('Endpoint Construction', () => {
    it('should use correct base endpoint', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')

      await exercisesApi.list()

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/exercise/exercises',
        expect.any(Object)
      )
    })

    it('should construct correct endpoint for getById', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'

      await exercisesApi.getById(exerciseId)

      expect(getSpy).toHaveBeenCalledWith(
        `/api/v1/exercise/exercises/${exerciseId}`,
        expect.any(Object)
      )
    })

    it('should construct correct endpoint for getByCode', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')

      await exercisesApi.getByCode('LT001')

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/exercise/exercises/code/LT001',
        expect.any(Object)
      )
    })

    it('should construct correct endpoint for create', async () => {
      const apiStore = useApiStore()
      const postSpy = vi.spyOn(apiStore, 'post')

      const exerciseData: ExerciseCreateDto = {
        category_id: '123',
        exercise_code: 'LT999',
        title: 'Test',
        difficulty_level: 'beginner',
      }

      await exercisesApi.create(exerciseData)

      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/exercise/exercises',
        exerciseData
      )
    })

    it('should construct correct endpoint for update', async () => {
      const apiStore = useApiStore()
      const patchSpy = vi.spyOn(apiStore, 'patch')
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'

      await exercisesApi.update(exerciseId, { title: 'Updated' })

      expect(patchSpy).toHaveBeenCalledWith(
        `/api/v1/exercise/exercises/${exerciseId}`,
        { title: 'Updated' }
      )
    })

    it('should construct correct endpoint for delete', async () => {
      const apiStore = useApiStore()
      const deleteSpy = vi.spyOn(apiStore, 'delete')
      const exerciseId = '550e8400-e29b-41d4-a716-446655440000'

      await exercisesApi.delete(exerciseId)

      expect(deleteSpy).toHaveBeenCalledWith(
        `/api/v1/exercise/exercises/${exerciseId}`
      )
    })
  })
})

describe('ExerciseItemsApi', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubEnv('VITE_USE_MOCK_API', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(exerciseItemsApi).toBeDefined()
    })
  })

  describe('list()', () => {
    it('should fetch list of items for exercise', async () => {
      const params: ExerciseItemListParams = {
        exercise_id: '123',
      }

      const items = await exerciseItemsApi.list(params)
      expect(items).toBeDefined()
      expect(Array.isArray(items)).toBe(true)
    })

    it('should filter by item type', async () => {
      const params: ExerciseItemListParams = {
        exercise_id: '123',
        item_type: 'speech_practice',
      }

      const items = await exerciseItemsApi.list(params)
      expect(items).toBeDefined()
    })

    it('should filter by language', async () => {
      const params: ExerciseItemListParams = {
        exercise_id: '123',
        language: 'de',
      }

      const items = await exerciseItemsApi.list(params)
      expect(items).toBeDefined()
    })

    it('should support abort signal', async () => {
      const controller = new AbortController()
      const params: ExerciseItemListParams = {
        exercise_id: '123',
      }
      const promise = exerciseItemsApi.list(params, controller.signal)

      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('getById()', () => {
    it('should fetch item by ID', async () => {
      const itemId = '550e8400-e29b-41d4-a716-446655440000'
      const item = await exerciseItemsApi.getById(itemId)

      expect(item).toBeDefined()
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('item_type')
      expect(item).toHaveProperty('content')
    })

    it('should support abort signal', async () => {
      const controller = new AbortController()
      const itemId = '550e8400-e29b-41d4-a716-446655440000'
      const promise = exerciseItemsApi.getById(itemId, controller.signal)

      controller.abort()

      await expect(promise).rejects.toThrow()
    })
  })

  describe('create()', () => {
    it('should create a movement item', async () => {
      const newItem: ExerciseItemCreateDto = {
        exercise_id: '123',
        item_type: 'movement',
        sort_order: 1,
        content: {
          instruction: 'Move your lips',
          duration_seconds: 30,
          repetitions: 5,
        },
      }

      const created = await exerciseItemsApi.create(newItem)
      expect(created).toBeDefined()
      expect(created).toHaveProperty('id')
    })

    it('should create a speech practice item', async () => {
      const newItem: ExerciseItemCreateDto = {
        exercise_id: '123',
        item_type: 'speech_practice',
        sort_order: 2,
        content: {
          text: 'Peter piper',
          phonetic_target: 'p',
          difficulty: 'intermediate',
        },
      }

      const created = await exerciseItemsApi.create(newItem)
      expect(created).toBeDefined()
    })

    it('should create an information item', async () => {
      const newItem: ExerciseItemCreateDto = {
        exercise_id: '123',
        item_type: 'information',
        sort_order: 3,
        content: {
          text: 'Important safety tip',
          info_type: 'safety',
        },
      }

      const created = await exerciseItemsApi.create(newItem)
      expect(created).toBeDefined()
    })
  })

  describe('update()', () => {
    it('should update item with partial data', async () => {
      const itemId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: ExerciseItemUpdateDto = {
        sort_order: 5,
      }

      const updated = await exerciseItemsApi.update(itemId, updateData)
      expect(updated).toBeDefined()
    })

    it('should update item content', async () => {
      const itemId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: ExerciseItemUpdateDto = {
        content: {
          instruction: 'Updated instruction',
        },
      }

      const updated = await exerciseItemsApi.update(itemId, updateData)
      expect(updated).toBeDefined()
    })
  })

  describe('delete()', () => {
    it('should delete item by ID', async () => {
      const itemId = '550e8400-e29b-41d4-a716-446655440000'

      await expect(exerciseItemsApi.delete(itemId)).resolves.toBeUndefined()
    })
  })

  describe('reorder()', () => {
    it('should reorder items for exercise', async () => {
      const exerciseId = '123'
      const itemIds = ['item-1', 'item-2', 'item-3']

      const reordered = await exerciseItemsApi.reorder(exerciseId, itemIds)

      expect(reordered).toBeDefined()
      expect(Array.isArray(reordered)).toBe(true)
    })

    it('should send correct payload for reorder', async () => {
      const apiStore = useApiStore()
      const postSpy = vi.spyOn(apiStore, 'post')

      const exerciseId = '123'
      const itemIds = ['a', 'b', 'c']

      await exerciseItemsApi.reorder(exerciseId, itemIds)

      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/exercise/items/reorder',
        { item_ids: itemIds },
        { params: { exercise_id: exerciseId } }
      )
    })
  })

  describe('Endpoint Construction', () => {
    it('should use correct base endpoint', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')

      await exerciseItemsApi.list({ exercise_id: '123' })

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/exercise/items',
        expect.any(Object)
      )
    })

    it('should construct correct endpoint for getById', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')
      const itemId = '550e8400-e29b-41d4-a716-446655440000'

      await exerciseItemsApi.getById(itemId)

      expect(getSpy).toHaveBeenCalledWith(
        `/api/v1/exercise/items/${itemId}`,
        expect.any(Object)
      )
    })

    it('should construct correct endpoint for create', async () => {
      const apiStore = useApiStore()
      const postSpy = vi.spyOn(apiStore, 'post')

      const itemData: ExerciseItemCreateDto = {
        exercise_id: '123',
        item_type: 'movement',
        content: {},
      }

      await exerciseItemsApi.create(itemData)

      expect(postSpy).toHaveBeenCalledWith(
        '/api/v1/exercise/items',
        itemData
      )
    })

    it('should construct correct endpoint for update', async () => {
      const apiStore = useApiStore()
      const putSpy = vi.spyOn(apiStore, 'put')
      const itemId = '550e8400-e29b-41d4-a716-446655440000'

      await exerciseItemsApi.update(itemId, { sort_order: 2 })

      expect(putSpy).toHaveBeenCalledWith(
        `/api/v1/exercise/items/${itemId}`,
        { sort_order: 2 }
      )
    })

    it('should construct correct endpoint for delete', async () => {
      const apiStore = useApiStore()
      const deleteSpy = vi.spyOn(apiStore, 'delete')
      const itemId = '550e8400-e29b-41d4-a716-446655440000'

      await exerciseItemsApi.delete(itemId)

      expect(deleteSpy).toHaveBeenCalledWith(
        `/api/v1/exercise/items/${itemId}`
      )
    })
  })
})
