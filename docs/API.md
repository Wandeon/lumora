# Lumora Public API

The Lumora Public API allows Studio tier tenants to integrate their gallery data with external applications and services.

## Authentication

All API requests require an API key in the `X-API-Key` header.

```bash
curl -H "X-API-Key: lum_your_api_key_here" \
  https://your-studio.lumora.io/api/v1/galleries
```

### Obtaining an API Key

API keys are available for **Studio tier** tenants only.

1. Log in to your Lumora dashboard
2. Navigate to **Settings > API**
3. Click **Generate API Key**
4. Copy and securely store your key (it will only be shown once)

### Key Security

- API keys should be kept secret and never exposed in client-side code
- Store keys in environment variables or secure secret management systems
- If you believe your key has been compromised, regenerate it immediately

## Base URL

All API endpoints are relative to your tenant's domain:

```
https://{tenant-slug}.lumora.io/api/v1/
```

For custom domains:

```
https://your-custom-domain.com/api/v1/
```

## Endpoints

### GET /api/v1/galleries

List all published galleries for your studio.

**Headers:**

| Header    | Required | Description  |
| --------- | -------- | ------------ |
| X-API-Key | Yes      | Your API key |

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "SCDY0028",
      "title": "Summer Wedding 2024",
      "photoCount": 150,
      "createdAt": "2024-06-15T10:00:00.000Z"
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "code": "MYST1234",
      "title": "Family Portrait Session",
      "photoCount": 45,
      "createdAt": "2024-07-20T14:30:00.000Z"
    }
  ]
}
```

**Response Fields:**

| Field      | Type   | Description                      |
| ---------- | ------ | -------------------------------- |
| id         | string | Unique gallery identifier (UUID) |
| code       | string | Gallery access code              |
| title      | string | Gallery title                    |
| photoCount | number | Number of photos in the gallery  |
| createdAt  | string | ISO 8601 timestamp of creation   |

**Example:**

```bash
curl -X GET \
  -H "X-API-Key: lum_your_api_key_here" \
  https://mystudio.lumora.io/api/v1/galleries
```

## Error Responses

The API uses standard HTTP status codes to indicate success or failure.

### Error Format

```json
{
  "error": "Error message describing the issue"
}
```

### Status Codes

| Code | Description                                |
| ---- | ------------------------------------------ |
| 200  | Success                                    |
| 400  | Bad Request - Invalid parameters           |
| 401  | Unauthorized - Invalid or missing API key  |
| 403  | Forbidden - Feature not available for tier |
| 404  | Not Found - Resource does not exist        |
| 429  | Too Many Requests - Rate limit exceeded    |
| 500  | Internal Server Error                      |

### Common Errors

**Missing API Key:**

```json
{
  "error": "API key required"
}
```

**Invalid API Key:**

```json
{
  "error": "Invalid API key"
}
```

**Feature Not Available:**

```json
{
  "error": "API access requires Studio tier"
}
```

## Rate Limits

To ensure fair usage and platform stability, the API enforces rate limits:

| Limit               | Value  |
| ------------------- | ------ |
| Requests per minute | 100    |
| Requests per day    | 10,000 |

When you exceed a rate limit, you'll receive a `429 Too Many Requests` response. Wait for the limit window to reset before retrying.

### Rate Limit Headers

Responses include headers to help you track your usage:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Best Practices

1. **Cache responses** - Gallery data doesn't change frequently. Cache responses for at least 5 minutes.

2. **Handle errors gracefully** - Implement retry logic with exponential backoff for transient errors.

3. **Use connection pooling** - If making multiple requests, reuse connections to improve performance.

4. **Monitor your usage** - Keep track of your rate limit consumption to avoid hitting limits.

## Support

For API support, please contact us at support@lumora.io or visit our [documentation](https://docs.lumora.io).

## Changelog

### v1 (Current)

- Initial release
- `GET /api/v1/galleries` endpoint for listing published galleries
