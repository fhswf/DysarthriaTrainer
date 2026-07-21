import asyncio
import httpx

async def test_sessions():
    # Login first
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "Admin123!"}
        )
        login_response.raise_for_status()
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get current user info
        user_response = await client.get("/api/v1/users/me", headers=headers)
        user_response.raise_for_status()
        user = user_response.json()
        print(f"Logged in as: {user['email']} (ID: {user['id']})")
        
        # Get sessions with results
        sessions_response = await client.get(
            "/api/v1/practice/sessions/with-results",
            headers=headers,
            params={"limit": 100, "offset": 0}
        )
        sessions_response.raise_for_status()
        data = sessions_response.json()
        
        print(f"\nTotal sessions for this user: {data['count']}")
        print(f"Sessions returned: {len(data['results'])}")
        
        for session in data['results'][:5]:
            print(f"  - {session['id']}: status={session['status']}, results={len(session['results'])}")

asyncio.run(test_sessions())
