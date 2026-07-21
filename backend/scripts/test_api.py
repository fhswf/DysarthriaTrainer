#!/usr/bin/env python3
"""
Quick API testing script for development
Usage: python scripts/test_api.py
"""
import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if API is running"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/")
        print(f"✅ Health Check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_endpoint(method: str, endpoint: str, data: Optional[dict] = None, token: Optional[str] = None):
    """Generic endpoint tester"""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"\n{method.upper()} {endpoint}")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response
    except Exception as e:
        print(f"❌ Request Failed: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Testing FastAPI Backend...\n")
    
    # Test health endpoint
    if test_health():
        print("\n" + "="*50)
        print("Backend is running! You can now test your endpoints.")
        print("="*50)
        
        # Add your custom endpoint tests here
        # Example:
        # test_endpoint("GET", "/api/v1/users")
        # test_endpoint("POST", "/api/v1/auth/login", {"email": "test@example.com", "password": "test123"})
