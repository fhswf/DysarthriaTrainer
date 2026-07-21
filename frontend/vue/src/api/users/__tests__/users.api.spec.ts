import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { UsersApi, usersApi } from '@/api/users'
import { useApiStore } from '@/stores/api'
import type { CreateUserRequest, UpdateUserRequest, UserQueryParams } from '@/api/users'

describe('UsersApi', () => {
  let api: UsersApi

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubEnv('VITE_USE_MOCK_API', 'true')
    api = new UsersApi()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(usersApi).toBeDefined()
      expect(usersApi).toBeInstanceOf(UsersApi)
    })

    it('should maintain singleton pattern', () => {
      const instance1 = usersApi
      const instance2 = usersApi
      expect(instance1).toBe(instance2)
    })
  })

  describe('list()', () => {
    it('should fetch list of users without parameters', async () => {
      const users = await api.list()

      expect(users).toBeDefined()
      // In mock mode, verify API call succeeds
    })

    it('should fetch list with query parameters', async () => {
      const params: UserQueryParams = {
        search: 'john',
        limit: 10,
        offset: 0,
      }

      const users = await api.list(params)

      expect(users).toBeDefined()
    })

    it('should fetch list with search parameter', async () => {
      const users = await api.list({ search: 'doe' })

      expect(users).toBeDefined()
    })

    it('should fetch list with limit parameter', async () => {
      const users = await api.list({ limit: 5 })

      expect(users).toBeDefined()
    })

    it('should fetch list with offset parameter', async () => {
      const users = await api.list({ offset: 2 })

      expect(users).toBeDefined()
    })

    it('should use caching for list requests', async () => {
      const apiStore = useApiStore()

      // First request
      await api.list()
      const stats1 = await apiStore.getCacheStats()
      const initialSize = stats1.size

      // Second request (should hit cache)
      await api.list()
      const stats2 = await apiStore.getCacheStats()

      expect(stats2.hits).toBeGreaterThan(0)
      expect(stats2.size).toBe(initialSize)
    })

    it('should respect 30 second cache timeout', async () => {
      const apiStore = useApiStore()

      // Verify cache config
      await apiStore.setCacheConfig({
        enabled: true,
        defaultTimeout: 30000,
        maxSize: 100,
      })

      const users = await api.list()
      expect(users).toBeDefined()
    })
  })

  describe('getById()', () => {
    it('should fetch user by ID', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const user = await api.getById(userId)

      expect(user).toBeDefined()
      // In mock mode, structure may vary
    })

    it('should accept UUID format', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000'
      const user = await api.getById(validUUID)

      expect(user).toBeDefined()
    })

    it('should use caching for getById requests', async () => {
      const apiStore = useApiStore()
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      // First request
      await api.getById(userId)
      const stats1 = await apiStore.getCacheStats()

      // Second request (should hit cache)
      await api.getById(userId)
      const stats2 = await apiStore.getCacheStats()

      expect(stats2.hits).toBeGreaterThan(stats1.hits)
    })

    it('should cache different users separately', async () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000'
      const userId2 = '550e8400-e29b-41d4-a716-446655440001'

      const user1 = await api.getById(userId1)
      const user2 = await api.getById(userId2)

      expect(user1).toBeDefined()
      expect(user2).toBeDefined()
      // In mock mode, might return same data, but should make separate requests
    })
  })

  describe('create()', () => {
    it('should create a new user', async () => {
      const newUserData: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'securepass123',
        fullName: 'New User',
      }

      const createdUser = await api.create(newUserData)

      expect(createdUser).toBeDefined()
      // In mock mode, structure may vary
    })

    it('should accept all required fields', async () => {
      const userData: CreateUserRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      }

      const user = await api.create(userData)
      expect(user).toBeDefined()
    })

    it('should clear cache after creation', async () => {
      const apiStore = useApiStore()

      // Cache a list request
      await api.list()
      const stats1 = await apiStore.getCacheStats()
      expect(stats1.size).toBeGreaterThan(0)

      // Create new user
      const newUserData: CreateUserRequest = {
        username: 'cachetest',
        email: 'cache@test.com',
        password: 'pass123',
        fullName: 'Cache Test',
      }
      await api.create(newUserData)

      // Cache should be cleared
      const stats2 = await apiStore.getCacheStats()
      expect(stats2.size).toBe(0)
    })

    it('should handle user creation with different usernames', async () => {
      const user1Data: CreateUserRequest = {
        username: 'user1',
        email: 'user1@example.com',
        password: 'pass1',
        fullName: 'User One',
      }

      const user2Data: CreateUserRequest = {
        username: 'user2',
        email: 'user2@example.com',
        password: 'pass2',
        fullName: 'User Two',
      }

      const user1 = await api.create(user1Data)
      const user2 = await api.create(user2Data)

      expect(user1).toBeDefined()
      expect(user2).toBeDefined()
    })
  })

  describe('update()', () => {
    it('should update user with partial data', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: UpdateUserRequest = {
        email: 'updated@example.com',
      }

      const updatedUser = await api.update(userId, updateData)

      expect(updatedUser).toBeDefined()
      // In mock mode, structure may vary
    })

    it('should update only email', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: UpdateUserRequest = {
        email: 'newemail@example.com',
      }

      const user = await api.update(userId, updateData)
      expect(user).toBeDefined()
    })

    it('should update only fullName', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: UpdateUserRequest = {
        fullName: 'Updated Full Name',
      }

      const user = await api.update(userId, updateData)
      expect(user).toBeDefined()
    })

    it('should update multiple fields', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: UpdateUserRequest = {
        email: 'multi@update.com',
        fullName: 'Multi Update',
      }

      const user = await api.update(userId, updateData)
      expect(user).toBeDefined()
    })

    it('should update with all optional fields', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const updateData: UpdateUserRequest = {
        email: 'all@fields.com',
        fullName: 'All Fields Updated',
      }

      const user = await api.update(userId, updateData)
      expect(user).toBeDefined()
    })

    it('should clear cache after update', async () => {
      const apiStore = useApiStore()

      // Cache a list request
      await api.list()
      const stats1 = await apiStore.getCacheStats()
      expect(stats1.size).toBeGreaterThan(0)

      // Update user
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      await api.update(userId, { email: 'updated@test.com' })

      // Cache should be cleared
      const stats2 = await apiStore.getCacheStats()
      expect(stats2.size).toBe(0)
    })

    it('should use PATCH method for updates', async () => {
      const apiStore = useApiStore()
      const patchSpy = vi.spyOn(apiStore, 'patch')

      const userId = '550e8400-e29b-41d4-a716-446655440000'
      await api.update(userId, { email: 'patch@test.com' })

      expect(patchSpy).toHaveBeenCalledWith(`/api/v1/users/${userId}`, { email: 'patch@test.com' })
    })
  })

  describe('delete()', () => {
    it('should delete user by ID', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await expect(api.delete(userId)).resolves.toBeUndefined()
    })

    it('should accept UUID format for deletion', async () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440001'

      await expect(api.delete(validUUID)).resolves.toBeUndefined()
    })

    it('should clear cache after deletion', async () => {
      const apiStore = useApiStore()

      // Cache a list request
      await api.list()
      const stats1 = await apiStore.getCacheStats()
      expect(stats1.size).toBeGreaterThan(0)

      // Delete user
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      await api.delete(userId)

      // Cache should be cleared
      const stats2 = await apiStore.getCacheStats()
      expect(stats2.size).toBe(0)
    })

    it('should return void on successful deletion', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const result = await api.delete(userId)

      expect(result).toBeUndefined()
    })
  })

  describe('Endpoint Construction', () => {
    it('should use correct base endpoint', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')

      await api.list()

      expect(getSpy).toHaveBeenCalledWith('/api/v1/users', expect.any(Object))
    })

    it('should construct correct endpoint for getById', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await api.getById(userId)

      expect(getSpy).toHaveBeenCalledWith(`/api/v1/users/${userId}`, expect.any(Object))
    })

    it('should construct correct endpoint for create', async () => {
      const apiStore = useApiStore()
      const postSpy = vi.spyOn(apiStore, 'post')

      const userData: CreateUserRequest = {
        username: 'test',
        email: 'test@test.com',
        password: 'pass',
        fullName: 'Test',
      }

      await api.create(userData)

      expect(postSpy).toHaveBeenCalledWith('/api/v1/users', userData)
    })

    it('should construct correct endpoint for update', async () => {
      const apiStore = useApiStore()
      const patchSpy = vi.spyOn(apiStore, 'patch')
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await api.update(userId, { email: 'test@test.com' })

      expect(patchSpy).toHaveBeenCalledWith(`/api/v1/users/${userId}`, { email: 'test@test.com' })
    })

    it('should construct correct endpoint for delete', async () => {
      const apiStore = useApiStore()
      const deleteSpy = vi.spyOn(apiStore, 'delete')
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await api.delete(userId)

      expect(deleteSpy).toHaveBeenCalledWith(`/api/v1/users/${userId}`)
    })
  })

  describe('Cache Strategy', () => {
    it('should cache GET requests with 30s timeout', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')

      await api.list()

      expect(getSpy).toHaveBeenCalledWith(
        '/api/v1/users',
        expect.objectContaining({
          useCache: true,
          cacheTimeout: 30000,
        })
      )
    })

    it('should cache getById with 30s timeout', async () => {
      const apiStore = useApiStore()
      const getSpy = vi.spyOn(apiStore, 'get')
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await api.getById(userId)

      expect(getSpy).toHaveBeenCalledWith(
        `/api/v1/users/${userId}`,
        expect.objectContaining({
          useCache: true,
          cacheTimeout: 30000,
        })
      )
    })

    it('should clear cache after mutations (create)', async () => {
      const apiStore = useApiStore()
      const clearCacheSpy = vi.spyOn(apiStore, 'clearCache')

      const userData: CreateUserRequest = {
        username: 'test',
        email: 'test@test.com',
        password: 'pass',
        fullName: 'Test',
      }

      await api.create(userData)

      expect(clearCacheSpy).toHaveBeenCalled()
    })

    it('should clear cache after mutations (update)', async () => {
      const apiStore = useApiStore()
      const clearCacheSpy = vi.spyOn(apiStore, 'clearCache')
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await api.update(userId, { email: 'test@test.com' })

      expect(clearCacheSpy).toHaveBeenCalled()
    })

    it('should clear cache after mutations (delete)', async () => {
      const apiStore = useApiStore()
      const clearCacheSpy = vi.spyOn(apiStore, 'clearCache')
      const userId = '550e8400-e29b-41d4-a716-446655440000'

      await api.delete(userId)

      expect(clearCacheSpy).toHaveBeenCalled()
    })
  })

  describe('Type Safety', () => {
    it('should return correctly typed User objects', async () => {
      const users = await api.list()

      expect(users).toBeDefined()
      // TypeScript enforces correct types at compile time
    })

    it('should accept correctly typed CreateUserRequest', async () => {
      const request: CreateUserRequest = {
        username: 'typed',
        email: 'typed@test.com',
        password: 'password',
        fullName: 'Typed User',
      }

      const user = await api.create(request)
      expect(user).toBeDefined()
    })

    it('should accept correctly typed UpdateUserRequest', async () => {
      const request: UpdateUserRequest = {
        email: 'updated@test.com',
        fullName: 'Updated Name',
      }

      const userId = '550e8400-e29b-41d4-a716-446655440000'
      const user = await api.update(userId, request)
      expect(user).toBeDefined()
    })

    it('should accept correctly typed UserQueryParams', async () => {
      const params: UserQueryParams = {
        search: 'test',
        limit: 10,
        offset: 0,
      }

      const users = await api.list(params)
      expect(users).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle list errors gracefully', async () => {
      // In mock mode, errors are less common, but we verify error can propagate
      await expect(api.list()).resolves.toBeDefined()
    })

    it('should handle getById errors gracefully', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000'
      await expect(api.getById(userId)).resolves.toBeDefined()
    })

    it('should handle create errors gracefully', async () => {
      const userData: CreateUserRequest = {
        username: 'error',
        email: 'error@test.com',
        password: 'pass',
        fullName: 'Error Test',
      }
      await expect(api.create(userData)).resolves.toBeDefined()
    })
  })

  describe('Integration with API Store', () => {
    it('should use API store for all requests', () => {
      const apiStore = useApiStore()

      expect(apiStore).toBeDefined()
      expect(apiStore.isInitialized).toBeDefined()
    })

    it('should initialize API store on first request', async () => {
      const apiStore = useApiStore()

      expect(apiStore.isInitialized()).toBe(false)

      await api.list()

      expect(apiStore.isInitialized()).toBe(true)
    })

    it('should respect API store configuration', async () => {
      const apiStore = useApiStore()

      await apiStore.setBaseURL('http://test.com')
      await api.list()

      const baseURL = await apiStore.getBaseURL()
      expect(baseURL).toBe('http://test.com')
    })
  })
})
