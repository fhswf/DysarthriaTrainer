"""Simple WebSocket test to debug connection issues."""

from starlette.testclient import TestClient
from src.main import app

def test_websocket_simple():
    """Test basic WebSocket connection."""
    client = TestClient(app)
    
    print("\n=== Testing WebSocket Connection ===")
    print(f"App routes: {[r.path for r in app.routes if hasattr(r, 'path')]}")
    
    # Try to connect
    try:
        print("\n1. Attempting connection...")
        with client.websocket_connect("/api/v1/ws/audio/stream") as ws:
            print("2. Connected successfully!")
            
            # Send test message
            print("3. Sending test message...")
            ws.send_text('{"audio_data": "dGVzdA==", "chunk_index": 0, "is_final": false}')
            
            # Receive response
            print("4. Waiting for response...")
            response = ws.receive_json()
            print(f"5. Response: {response}")
            
    except Exception as e:
        print(f"\n❌ Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
        # Check if it's a route issue
        print("\n=== Checking Routes ===")
        for route in app.routes:
            if hasattr(route, 'path'):
                print(f"  {route.path}")

if __name__ == "__main__":
    test_websocket_simple()
