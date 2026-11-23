def test_health_and_openapi(client):
    assert client.get("/health").json()["status"] == "ok"
    spec = client.get("/openapi.json").json()
    assert spec["info"]["title"].startswith("Bloomé Floral")
    paths = spec["paths"]
    for path in ["/api/v1/products", "/api/v1/site", "/api/v1/auth/login", "/api/v1/webhooks/stripe", "/api/v1/admin/orders"]:
        assert path in paths, path
