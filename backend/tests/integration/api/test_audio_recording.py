"""
Integration tests for Audio Recording REST API endpoints.

Tests analyze, quality check, and recording management endpoints.
"""

import base64

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.mark.integration
class TestAudioRecordingAPI:
    """Integration tests for audio recording REST endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self, test_users):
        """Get authorization headers for therapist user."""
        therapist = test_users["therapist"]
        # In real implementation: obtain JWT token via login endpoint
        # For now, mock the token (in real tests, call /api/v1/auth/login first)
        return {"Authorization": f"Bearer mock_token_{therapist['id']}"}
    
    def encode_audio(self, audio_bytes: bytes) -> str:
        """Encode audio to base64."""
        return base64.b64encode(audio_bytes).decode("utf-8")
    
    @pytest.mark.asyncio
    async def test_analyze_audio_success(self, client, auth_headers, clean_speech_audio):
        """Should analyze audio successfully."""
        payload = {
            "audio_data": self.encode_audio(clean_speech_audio),
            "language": "de",
            "apply_noise_reduction": True
        }
        
        response = client.post(
            "/api/v1/audio/analyze",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "transcription" in data
        assert "quality_metrics" in data
        assert "warnings" in data
        assert "language" in data
        assert "confidence" in data
        assert "processing_time_ms" in data
        
        # Check quality metrics
        metrics = data["quality_metrics"]
        assert "snr_db" in metrics
        assert "rms_energy" in metrics
        assert "clipping_detected" in metrics
        assert "spectral_flatness" in metrics
    
    @pytest.mark.asyncio
    async def test_analyze_audio_without_noise_reduction(self, client, auth_headers, clean_speech_audio):
        """Should analyze audio without noise reduction."""
        payload = {
            "audio_data": self.encode_audio(clean_speech_audio),
            "language": "de",
            "apply_noise_reduction": False
        }
        
        response = client.post(
            "/api/v1/audio/analyze",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "transcription" in data
    
    @pytest.mark.asyncio
    async def test_analyze_audio_invalid_base64(self, client, auth_headers):
        """Should return 400 for invalid base64."""
        payload = {
            "audio_data": "invalid_base64!!!",
            "language": "de",
            "apply_noise_reduction": True
        }
        
        response = client.post(
            "/api/v1/audio/analyze",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 400
    
    @pytest.mark.asyncio
    async def test_analyze_audio_noisy_warnings(self, client, auth_headers, noisy_speech_audio):
        """Should include warnings for noisy audio."""
        payload = {
            "audio_data": self.encode_audio(noisy_speech_audio),
            "language": "de",
            "apply_noise_reduction": True
        }
        
        response = client.post(
            "/api/v1/audio/analyze",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "warnings" in data
        assert len(data["warnings"]) > 0
        
        # Check warning structure
        warning = data["warnings"][0]
        assert "type" in warning
        assert "message" in warning
        assert "severity" in warning
    
    @pytest.mark.asyncio
    async def test_quality_check_success(self, client, auth_headers, clean_speech_audio):
        """Should check audio quality successfully."""
        payload = {
            "audio_data": self.encode_audio(clean_speech_audio)
        }
        
        response = client.post(
            "/api/v1/audio/quality-check",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "quality_metrics" in data
        assert "warnings" in data
        assert "quality_ok" in data
        
        # Should NOT have transcription (quality check only)
        assert "transcription" not in data or data.get("transcription") == ""
    
    @pytest.mark.asyncio
    async def test_quality_check_poor_quality(self, client, auth_headers, noisy_speech_audio):
        """Should detect poor quality audio."""
        payload = {
            "audio_data": self.encode_audio(noisy_speech_audio)
        }
        
        response = client.post(
            "/api/v1/audio/quality-check",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["quality_ok"] is False
        assert len(data["warnings"]) > 0
    
    @pytest.mark.asyncio
    async def test_quality_check_clipped_audio(self, client, auth_headers, clipped_speech_audio):
        """Should detect clipping in audio."""
        payload = {
            "audio_data": self.encode_audio(clipped_speech_audio)
        }
        
        response = client.post(
            "/api/v1/audio/quality-check",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["quality_ok"] is False
        assert data["quality_metrics"]["clipping_detected"] is True
        
        # Should have clipping warning
        clipping_warnings = [
            w for w in data["warnings"]
            if w["type"] == "CLIPPING_DETECTED"
        ]
        assert len(clipping_warnings) > 0
        assert clipping_warnings[0]["severity"] == "critical"
    
    @pytest.mark.asyncio
    async def test_create_recording_success(self, client, auth_headers, clean_speech_audio, test_users, db_session):
        """Should create recording successfully."""
        therapist = test_users["therapist"]
        patient = test_users["patient"]
        
        payload = {
            "audio_data": self.encode_audio(clean_speech_audio),
            "user_id": patient["id"],
            "exercise_id": 1,  # Assume exercise exists
            "transcription": "Test transcription",
            "quality_metrics": {
                "snr_db": 20.0,
                "rms_energy": 0.05,
                "clipping_detected": False,
                "spectral_flatness": 0.3
            }
        }
        
        response = client.post(
            "/api/v1/audio/recordings",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert "id" in data
        assert data["user_id"] == patient["id"]
        assert data["exercise_id"] == 1
        assert data["transcription"] == "Test transcription"
        assert "audio_url" in data
        assert "created_at" in data
    
    @pytest.mark.asyncio
    async def test_get_recording_success(self, client, auth_headers, clean_speech_audio, test_users, db_session):
        """Should retrieve recording by ID."""
        # First create a recording
        patient = test_users["patient"]
        create_payload = {
            "audio_data": self.encode_audio(clean_speech_audio),
            "user_id": patient["id"],
            "exercise_id": 1,
            "transcription": "Test transcription",
            "quality_metrics": {
                "snr_db": 20.0,
                "rms_energy": 0.05,
                "clipping_detected": False,
                "spectral_flatness": 0.3
            }
        }
        
        create_response = client.post(
            "/api/v1/audio/recordings",
            json=create_payload,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        recording_id = create_response.json()["id"]
        
        # Now retrieve it
        response = client.get(
            f"/api/v1/audio/recordings/{recording_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == recording_id
        assert data["transcription"] == "Test transcription"
    
    @pytest.mark.asyncio
    async def test_get_recording_not_found(self, client, auth_headers):
        """Should return 404 for non-existent recording."""
        response = client.get(
            "/api/v1/audio/recordings/99999",
            headers=auth_headers
        )
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_list_recordings_success(self, client, auth_headers, clean_speech_audio, test_users, db_session):
        """Should list recordings with filters."""
        patient = test_users["patient"]
        
        # Create two recordings
        for i in range(2):
            payload = {
                "audio_data": self.encode_audio(clean_speech_audio),
                "user_id": patient["id"],
                "exercise_id": 1,
                "transcription": f"Test {i}",
                "quality_metrics": {
                    "snr_db": 20.0,
                    "rms_energy": 0.05,
                    "clipping_detected": False,
                    "spectral_flatness": 0.3
                }
            }
            client.post("/api/v1/audio/recordings", json=payload, headers=auth_headers)
        
        # List all recordings
        response = client.get(
            "/api/v1/audio/recordings",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) >= 2
    
    @pytest.mark.asyncio
    async def test_list_recordings_filter_by_user(self, client, auth_headers, clean_speech_audio, test_users, db_session):
        """Should filter recordings by user_id."""
        patient = test_users["patient"]
        
        # Create recording for patient
        payload = {
            "audio_data": self.encode_audio(clean_speech_audio),
            "user_id": patient["id"],
            "exercise_id": 1,
            "transcription": "Test",
            "quality_metrics": {
                "snr_db": 20.0,
                "rms_energy": 0.05,
                "clipping_detected": False,
                "spectral_flatness": 0.3
            }
        }
        client.post("/api/v1/audio/recordings", json=payload, headers=auth_headers)
        
        # Filter by user
        response = client.get(
            f"/api/v1/audio/recordings?user_id={patient['id']}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned recordings should belong to patient
        for item in data["items"]:
            assert item["user_id"] == patient["id"]
    
    @pytest.mark.asyncio
    async def test_list_recordings_filter_by_exercise(self, client, auth_headers, clean_speech_audio, test_users, db_session):
        """Should filter recordings by exercise_id."""
        patient = test_users["patient"]
        
        # Create recording for exercise 1
        payload = {
            "audio_data": self.encode_audio(clean_speech_audio),
            "user_id": patient["id"],
            "exercise_id": 1,
            "transcription": "Test",
            "quality_metrics": {
                "snr_db": 20.0,
                "rms_energy": 0.05,
                "clipping_detected": False,
                "spectral_flatness": 0.3
            }
        }
        client.post("/api/v1/audio/recordings", json=payload, headers=auth_headers)
        
        # Filter by exercise
        response = client.get(
            "/api/v1/audio/recordings?exercise_id=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned recordings should belong to exercise 1
        for item in data["items"]:
            assert item["exercise_id"] == 1
    
    @pytest.mark.asyncio
    async def test_list_recordings_pagination(self, client, auth_headers, clean_speech_audio, test_users, db_session):
        """Should support pagination."""
        patient = test_users["patient"]
        
        # Create 5 recordings
        for i in range(5):
            payload = {
                "audio_data": self.encode_audio(clean_speech_audio),
                "user_id": patient["id"],
                "exercise_id": 1,
                "transcription": f"Test {i}",
                "quality_metrics": {
                    "snr_db": 20.0,
                    "rms_energy": 0.05,
                    "clipping_detected": False,
                    "spectral_flatness": 0.3
                }
            }
            client.post("/api/v1/audio/recordings", json=payload, headers=auth_headers)
        
        # Get first page (limit 2)
        response = client.get(
            "/api/v1/audio/recordings?skip=0&limit=2",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["items"]) == 2
        assert data["total"] >= 5
    
    @pytest.mark.asyncio
    async def test_unauthorized_access(self, client):
        """Should require authentication."""
        response = client.get("/api/v1/audio/recordings")
        
        assert response.status_code == 401
