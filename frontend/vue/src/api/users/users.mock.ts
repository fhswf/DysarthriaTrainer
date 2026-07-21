/**
 * Mock User Data
 *
 * Test fixtures for development and testing.
 */

import type { User } from './users.types'

/**
 * Mock users for testing
 */
export const mockUsers: User[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'johndoe',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    username: 'janedoe',
    email: 'jane.doe@example.com',
    full_name: 'Jane Doe',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    username: 'admin',
    email: 'admin@example.com',
    full_name: 'System Administrator',
  },
]

/**
 * Get mock user by username
 */
export function getMockUserByUsername(username: string): User | undefined {
  return mockUsers.find((u) => u.username === username)
}

/**
 * Get mock user by email
 */
export function getMockUserByEmail(email: string): User | undefined {
  return mockUsers.find((u) => u.email === email)
}
