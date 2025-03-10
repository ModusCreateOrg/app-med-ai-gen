# Reports API Documentation

## Base URL
```
/api/v1/reports
```

## Authentication
All endpoints require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <your_token>
```

## Endpoints

### Create Report
Creates a new medical report.

```http
POST /reports
```

#### Request Body
```json
{
  "title": "Blood Test Results",
  "content": "Detailed blood test analysis..."
}
```

#### Response (200 OK)
```json
{
  "id": "uuid",
  "userId": "user123",
  "title": "Blood Test Results",
  "content": "Detailed blood test analysis...",
  "status": "UNREAD",
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-20T10:00:00Z"
}
```

### Get Latest Reports
Retrieves paginated list of latest reports.

```http
GET /reports/latest?limit=10&page=1&cursor=base64token
```

#### Query Parameters
- `limit` (optional): Number of reports per page (1-100, default: 10)
- `page` (optional): Page number (min: 1, default: 1)
- `cursor` (optional): Pagination cursor for next page

#### Response (200 OK)
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Blood Test Results",
      "content": "Detailed blood test analysis...",
      "status": "UNREAD",
      "createdAt": "2024-03-20T10:00:00Z",
      "updatedAt": "2024-03-20T10:00:00Z"
    }
  ],
  "metadata": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "hasMore": true,
    "nextCursor": "base64token"
  }
}
```

### Get All Reports
Retrieves all reports for the authenticated user.

```http
GET /reports
```

#### Response (200 OK)
```json
[
  {
    "id": "uuid",
    "userId": "user123",
    "title": "Blood Test Results",
    "content": "Detailed blood test analysis...",
    "status": "UNREAD",
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
]
```

### Get Single Report
Retrieves a specific report by ID.

```http
GET /reports/:id
```

#### Response (200 OK)
```json
{
  "id": "uuid",
  "userId": "user123",
  "title": "Blood Test Results",
  "content": "Detailed blood test analysis...",
  "status": "UNREAD",
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-20T10:00:00Z"
}
```

### Update Report
Updates an existing report.

```http
PUT /reports/:id
```

#### Request Body
```json
{
  "title": "Updated Blood Test Results",
  "content": "Updated analysis..."
}
```

#### Response (200 OK)
```json
{
  "id": "uuid",
  "userId": "user123",
  "title": "Updated Blood Test Results",
  "content": "Updated analysis...",
  "status": "UNREAD",
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-20T10:00:00Z"
}
```

### Mark Report as Read
Marks a report as read.

```http
PATCH /reports/:id/read
```

#### Response (200 OK)
```json
{
  "id": "uuid",
  "userId": "user123",
  "title": "Blood Test Results",
  "content": "Detailed blood test analysis...",
  "status": "READ",
  "createdAt": "2024-03-20T10:00:00Z",
  "updatedAt": "2024-03-20T10:00:00Z"
}
```

### Delete Report
Deletes a specific report.

```http
DELETE /reports/:id
```

#### Response (200 OK)
```json
{
  "message": "Report deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Report not found"
}
```

## Data Types

### Report Status
```typescript
enum ReportStatus {
  READ = 'READ',
  UNREAD = 'UNREAD'
}
```

### Report Object
```typescript
{
  id: string;
  userId: string;
  title: string;
  content: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}
```
