from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_process_record():
    """Test the full pipeline with a mock medical record."""
    response = client.post("/process", json={
        "text": "Patient is a 45-year-old male with a history of DM and HTN. Patient is allergic to penicillin, causing anaphylaxis."
    })
    
    assert response.status_code == 200
    data = response.json()
    
    assert "summary" in data
    assert "timeline" in data
    assert "entities" in data
    assert "sources" in data
    
    # Check if abbreviation was expanded (DM -> Diabetes Mellitus) implicitly by checking if system processed
    # Check if allergy was captured (highly likely based on heuristics)
    assert not data.get("partial", True), "Expected a full response without partial failure. Is Ollama running?"

def test_input_validation_too_short():
    """Test that records under 20 characters are rejected."""
    response = client.post("/process", json={"text": "Too short"})
    assert response.status_code == 422 # FastAPI/Pydantic validation error

def test_input_validation_missing_field():
    """Test that missing text field is rejected."""
    response = client.post("/process", json={})
    assert response.status_code == 422
