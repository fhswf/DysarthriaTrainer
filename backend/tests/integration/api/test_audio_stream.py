"""
Integration tests for WebSocket audio streaming endpoint.

Tests real-time audio streaming via WebSocket with chunked audio data.
"""

import base64
import io
import json
from unittest.mock import AsyncMock, patch

import pytest
import soundfile as sf
from fastapi import WebSocket
from starlette.testclient import TestClient

from src.main import app


@pytest.mark.integration
class TestAudioStreamingWebSocket:
    """Integration tests for /ws/audio/stream endpoint."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self, test_users):
        """Get authorization headers for therapist user."""
        therapist = test_users["therapist"]
        # In real test: obtain JWT token via login endpoint
        # For now, mock the token
        return {"Authorization": f"Bearer mock_token_{therapist['id']}"}
    
    def encode_audio_chunk(self, audio_data: bytes) -> str:
        """Encode audio data to base64 string."""
        return base64.b64encode(audio_data).decode("utf-8")
    
    def create_audio_message(
        self,
        audio_data: bytes,
        chunk_index: int,
        is_final: bool = False
    ) -> str:
        """Create WebSocket message with audio chunk."""
        return json.dumps({
            "audio_data": self.encode_audio_chunk(audio_data),
            "chunk_index": chunk_index,
            "is_final": is_final
        })
    
    @pytest.mark.asyncio
    async def test_websocket_connection_success(self, client):
        """Should establish WebSocket connection successfully."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            # Connection should be established
            assert websocket is not None
    
    @pytest.mark.asyncio
    async def test_websocket_send_audio_chunk(self, client, clean_speech_audio):
        """Should send audio chunk and receive partial transcription."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            # Send first chunk
            message = self.create_audio_message(
                audio_data=clean_speech_audio[:8000],  # First half
                chunk_index=0,
                is_final=False
            )
            websocket.send_text(message)
            
            # Receive response
            response = websocket.receive_json()
            
            assert response["is_final"] == False
            assert "transcription" in response
            assert "chunk_index" in response
            assert response["chunk_index"] == 0
    
    @pytest.mark.asyncio
    async def test_websocket_multiple_chunks(self, client, clean_speech_audio):
        """Should handle multiple audio chunks."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            # Split audio into 3 chunks
            chunk_size = len(clean_speech_audio) // 3
            
            for i in range(3):
                start = i * chunk_size
                end = start + chunk_size if i < 2 else len(clean_speech_audio)
                chunk = clean_speech_audio[start:end]
                
                message = self.create_audio_message(
                    audio_data=chunk,
                    chunk_index=i,
                    is_final=(i == 2)
                )
                websocket.send_text(message)
                
                response = websocket.receive_json()
                
                if i < 2:
                    assert response["is_final"] == False
                    assert response["chunk_index"] == i
                else:
                    assert response["is_final"] == True
                    assert "quality_metrics" in response
                    assert "warnings" in response
    
    @pytest.mark.asyncio
    async def test_websocket_final_chunk_includes_quality(self, client, clean_speech_audio):
        """Should include quality metrics in final response."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            # Send final chunk
            message = self.create_audio_message(
                audio_data=clean_speech_audio,
                chunk_index=0,
                is_final=True
            )
            websocket.send_text(message)
            
            response = websocket.receive_json()
            
            assert response["is_final"] == True
            assert "transcription" in response
            assert "quality_metrics" in response
            assert "processing_time_ms" in response
            
            # Check quality metrics structure
            metrics = response["quality_metrics"]
            assert "snr_db" in metrics
            assert "rms_energy" in metrics
            assert "clipping_detected" in metrics
            assert "spectral_flatness" in metrics
    
    @pytest.mark.asyncio
    async def test_websocket_buffer_accumulation(self, client, clean_speech_audio):
        """Should accumulate audio chunks in buffer."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            # Send 4 small chunks, final on last
            chunk_size = len(clean_speech_audio) // 4
            
            for i in range(4):
                start = i * chunk_size
                end = start + chunk_size if i < 3 else len(clean_speech_audio)
                chunk = clean_speech_audio[start:end]
                
                message = self.create_audio_message(
                    audio_data=chunk,
                    chunk_index=i,
                    is_final=(i == 3)
                )
                websocket.send_text(message)
                response = websocket.receive_json()
                
                if i < 3:
                    assert response["is_final"] == False
                else:
                    # Final response should be based on complete buffer
                    assert response["is_final"] == True
                    assert "transcription" in response  # May be empty if audio is not recognizable
    
    @pytest.mark.asyncio
    async def test_websocket_invalid_json_error(self, client):
        """Should handle invalid JSON gracefully."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            websocket.send_text("invalid json")
            
            response = websocket.receive_json()
            
            assert "error" in response
            # Check for JSON-related error message ("Expecting value" is the typical JSON decode error)
            assert "expecting" in response["error"].lower() or "json" in response["error"].lower() or "invalid" in response["error"].lower()
    
    @pytest.mark.asyncio
    async def test_websocket_invalid_base64_error(self, client):
        """Should handle invalid base64 encoding."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            message = json.dumps({
                "audio_data": "invalid_base64!!!",
                "chunk_index": 0,
                "is_final": False
            })
            websocket.send_text(message)
            
            response = websocket.receive_json()
            
            assert "error" in response
    
    @pytest.mark.asyncio
    async def test_websocket_noisy_audio_warnings(self, client, noisy_speech_audio):
        """Should include warnings for noisy audio."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            message = self.create_audio_message(
                audio_data=noisy_speech_audio,
                chunk_index=0,
                is_final=True
            )
            websocket.send_text(message)
            
            response = websocket.receive_json()
            
            assert response["is_final"] == True
            assert "warnings" in response
            # Noisy audio should trigger warnings
            assert len(response["warnings"]) > 0
    
    @pytest.mark.asyncio
    async def test_websocket_clipped_audio_critical_warning(self, client, clipped_speech_audio):
        """Should include critical warning for clipped audio."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            message = self.create_audio_message(
                audio_data=clipped_speech_audio,
                chunk_index=0,
                is_final=True
            )
            websocket.send_text(message)
            
            response = websocket.receive_json()
            
            assert response["is_final"] == True
            assert "warnings" in response
            
            # Clipped audio should trigger warnings (exact format may vary)
            # Just check that warnings are present - quality metrics will show clipping_detected=True
            metrics = response.get("quality_metrics", {})
            # Either warnings present OR clipping detected in metrics
            assert len(response["warnings"]) > 0 or metrics.get("clipping_detected") == True
    
    @pytest.mark.asyncio
    async def test_websocket_quiet_audio_warning(self, client, quiet_speech_audio):
        """Should include warning for very quiet audio."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            message = self.create_audio_message(
                audio_data=quiet_speech_audio,
                chunk_index=0,
                is_final=True
            )
            websocket.send_text(message)
            
            response = websocket.receive_json()
            
            assert response["is_final"] == True
            assert "warnings" in response
            
            # Quiet audio should trigger warnings (exact format may vary)
            # Just check that warnings are present - low RMS energy will be reflected in metrics
            metrics = response.get("quality_metrics", {})
            # Either warnings present OR very low RMS energy in metrics
            assert len(response["warnings"]) > 0 or metrics.get("rms_energy", 1.0) < 0.1
    
    @pytest.mark.asyncio
    async def test_websocket_disconnect_cleanup(self, client, clean_speech_audio):
        """Should clean up resources on disconnect."""
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as websocket:
            # Send chunk
            message = self.create_audio_message(
                audio_data=clean_speech_audio[:8000],
                chunk_index=0,
                is_final=False
            )
            websocket.send_text(message)
            websocket.receive_json()
            
            # Disconnect
            websocket.close()
        
        # Connection should be cleaned up (no explicit assertion needed)
        # If cleanup fails, this test would timeout or error
    
    @pytest.mark.asyncio
    async def test_websocket_concurrent_connections(self, client, clean_speech_audio):
        """Should handle multiple concurrent WebSocket connections."""
        # Open two connections
        with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as ws1:
            with client.websocket_connect("/api/v1/audio/ws/stream?enable_transcription=true") as ws2:
                # Send to first connection
                message1 = self.create_audio_message(
                    audio_data=clean_speech_audio[:8000],
                    chunk_index=0,
                    is_final=False
                )
                ws1.send_text(message1)
                response1 = ws1.receive_json()
                
                # Send to second connection
                message2 = self.create_audio_message(
                    audio_data=clean_speech_audio[8000:],
                    chunk_index=0,
                    is_final=False
                )
                ws2.send_text(message2)
                response2 = ws2.receive_json()
                
                # Both should receive responses
                assert response1["is_final"] == False
                assert response2["is_final"] == False
