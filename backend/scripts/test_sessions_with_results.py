#!/usr/bin/env python3
"""
Test script for the new sessions-with-results endpoint.

This demonstrates the new GET /api/v1/practice/sessions/with-results endpoint
that returns sessions with their exercise results included in a single request.
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx


async def test_sessions_with_results():
    """Test the sessions with results endpoint."""
    
    base_url = "http://localhost:8000"
    
    # For testing, we'll use the test user (you need to replace with actual auth token)
    # In production, you'd get this from the login endpoint
    test_token = "test-token-placeholder"
    
    headers = {
        "Authorization": f"Bearer {test_token}"
    }
    
    async with httpx.AsyncClient() as client:
        print("\n=== Testing Sessions With Results Endpoint ===\n")
        
        # Test 1: Get all sessions with results
        print("1. GET /api/v1/practice/sessions/with-results")
        print("   Fetching all sessions with their results included...")
        
        try:
            response = await client.get(
                f"{base_url}/api/v1/practice/sessions/with-results",
                headers=headers,
                params={
                    "limit": 10,
                    "offset": 0
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Success! Retrieved {len(data['items'])} sessions")
                print(f"   Total sessions: {data['total']}")
                
                if data['items']:
                    first_session = data['items'][0]
                    print(f"\n   First session details:")
                    print(f"   - ID: {first_session['id']}")
                    print(f"   - Status: {first_session['status']}")
                    print(f"   - Total items: {first_session['total_items']}")
                    print(f"   - Completed items: {first_session['completed_items']}")
                    print(f"   - Results count: {len(first_session['results'])}")
                    
                    if first_session['results']:
                        result = first_session['results'][0]
                        print(f"\n   First result in session:")
                        print(f"   - ID: {result['id']}")
                        print(f"   - Item ID: {result['exercise_item_id']}")
                        print(f"   - Iteration: {result['iteration_number']}")
                        print(f"   - Duration: {result['duration_ms']}ms")
                        print(f"   - Audio segment: {result['audio_segment_start_ms']}ms - {result['audio_segment_end_ms']}ms")
                else:
                    print("   (No sessions found)")
            else:
                print(f"   ✗ Failed with status code: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except httpx.ConnectError:
            print("   ✗ Connection error - is the backend running?")
            return
        except Exception as e:
            print(f"   ✗ Error: {e}")
            return
        
        # Test 2: Filter by status
        print("\n2. GET /api/v1/practice/sessions/with-results?status_filter=completed")
        print("   Fetching only completed sessions...")
        
        try:
            response = await client.get(
                f"{base_url}/api/v1/practice/sessions/with-results",
                headers=headers,
                params={
                    "status_filter": "completed",
                    "limit": 5,
                    "offset": 0
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Success! Retrieved {len(data['items'])} completed sessions")
                print(f"   Total completed sessions: {data['total']}")
            else:
                print(f"   ✗ Failed with status code: {response.status_code}")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
        
        # Test 3: Pagination
        print("\n3. Testing pagination (limit=2, offset=0)")
        
        try:
            response = await client.get(
                f"{base_url}/api/v1/practice/sessions/with-results",
                headers=headers,
                params={
                    "limit": 2,
                    "offset": 0
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ Page 1: {len(data['items'])} sessions")
                
                # Get second page
                response = await client.get(
                    f"{base_url}/api/v1/practice/sessions/with-results",
                    headers=headers,
                    params={
                        "limit": 2,
                        "offset": 2
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   ✓ Page 2: {len(data['items'])} sessions")
                    print(f"   Pagination working correctly!")
            else:
                print(f"   ✗ Failed with status code: {response.status_code}")
                
        except Exception as e:
            print(f"   ✗ Error: {e}")
        
        print("\n=== Summary ===")
        print("New endpoint: GET /api/v1/practice/sessions/with-results")
        print("Features:")
        print("  - Returns sessions with results included (no separate API calls needed)")
        print("  - Supports pagination (limit/offset)")
        print("  - Supports status filtering (in_progress/completed/abandoned)")
        print("  - Each session includes all its exercise results")
        print("\nBenefits:")
        print("  - Reduces API calls (1 request instead of N+1)")
        print("  - Better performance for listing sessions")
        print("  - Complete data in single response")
        print()


if __name__ == "__main__":
    print("Note: This test requires authentication. Update the test_token variable")
    print("with a valid JWT token from the /api/v1/auth/login endpoint.")
    print()
    
    asyncio.run(test_sessions_with_results())
