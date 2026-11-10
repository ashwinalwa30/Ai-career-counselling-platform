from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_success_and_llm_unconfigured():
    response = client.get("/ai/health")
    body = response.json()

    assert response.status_code == 200
    assert body["success"] is True
    assert body["data"]["status"] == "ok"
    assert body["data"]["llm_configured"] is False
    assert isinstance(body["message"], str) and body["message"]


def test_unknown_route_uses_error_envelope():
    response = client.get("/ai/missing")
    body = response.json()

    assert response.status_code == 404
    assert body == {
        "success": False,
        "data": None,
        "message": "Not Found",
    }
