# Notification Decision Service

A small service to handle user notification preferences and decide whether to process or suppress notifications based on event types and "Do Not Disturb" (DND) windows.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## 📖 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns server status.

#### Get User Preferences
```http
GET /preferences/:userId
```

**Response:**
- `200`: User preferences JSON
- `404`: User not found

**Example:**
```bash
curl http://localhost:3000/preferences/user123
```

#### Save User Preferences
```http
POST /preferences/:userId
```

**Request Body:**
```json
{
  "dnd": {
    "start": "22:00",
    "end": "07:00"
  },
  "eventSettings": {
    "item_shipped": { "enabled": true },
    "invoice_generated": { "enabled": false }
  }
}
```

**Response:**
- `201`: `{ "status": "saved", "userId": "user123" }`
- `400`: Validation error

**Example:**
```bash
curl -X POST http://localhost:3000/preferences/user123 \
  -H "Content-Type: application/json" \
  -d '{
    "dnd": { "start": "22:00", "end": "07:00" },
    "eventSettings": {
      "item_shipped": { "enabled": true },
      "invoice_generated": { "enabled": true }
    }
  }'
```

#### Process Event
```http
POST /events
```

**Request Body:**
```json
{
  "eventId": "evt_12345",
  "userId": "user123", 
  "eventType": "item_shipped",
  "timestamp": "2025-08-30T22:30:00Z"
}
```

**Response:**
- `202`: `{ "decision": "PROCESS_NOTIFICATION" }` - Send notification
- `200`: `{ "decision": "DO_NOT_NOTIFY", "reason": "DND_ACTIVE" }` - Suppress notification
- `200`: `{ "decision": "DO_NOT_NOTIFY", "reason": "USER_UNSUBSCRIBED_FROM_EVENT" }` - User unsubscribed
- `400`: Validation error

**Examples:**

1. **Event during DND window (will be suppressed):**
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_001",
    "userId": "user123",
    "eventType": "item_shipped", 
    "timestamp": "2025-08-30T23:00:00Z"
  }'
```

2. **Event outside DND window (will be processed):**
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_002",
    "userId": "user123",
    "eventType": "item_shipped",
    "timestamp": "2025-08-30T08:00:00Z"
  }'
```

3. **Event for unsubscribed type (will be suppressed):**
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_003", 
    "userId": "user123",
    "eventType": "invoice_generated",
    "timestamp": "2025-08-30T12:00:00Z"
  }'
```

## 🕐 DND (Do Not Disturb) Rules

- **Time Format**: `HH:MM` in 24-hour format
- **Timezone**: All times interpreted in **UTC**
- **Midnight Crossing**: Supports windows that cross midnight (e.g., `22:00` to `07:00`)
- **Inactive DND**: When `start === end`, DND is inactive
- **Examples**:
  - `22:00-07:00`: Blocks notifications from 10 PM to 7 AM (crosses midnight)
  - `09:00-17:00`: Blocks notifications from 9 AM to 5 PM (same day)
  - `12:00-12:00`: DND inactive (no blocking)

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)

### Data Storage
- **In-memory storage**: Uses JavaScript `Map` for user preferences
- **Data persistence**: Data is lost when application restarts
- **Production note**: Replace with persistent database in production

## 🎯 Decision Logic

The service uses the following priority order to make decisions:

1. **No preferences**: `PROCESS_NOTIFICATION` (default behavior)
2. **Event type disabled/missing**: `DO_NOT_NOTIFY` with reason `USER_UNSUBSCRIBED_FROM_EVENT`
3. **DND window active**: `DO_NOT_NOTIFY` with reason `DND_ACTIVE`  
4. **All checks pass**: `PROCESS_NOTIFICATION`

## 🧪 Testing

Run the test suite:
```bash
npm test
```

The tests cover:
- Time utility functions (DND window calculations)
- Decision service logic
- Edge cases (midnight crossing, inactive DND)

## 📁 Project Structure

```
src/
├── app.ts                  # Express app setup
├── index.ts               # Server entry point
├── types/
│   └── models.ts          # Zod schemas and TypeScript types
├── store/
│   └── memory.store.ts    # In-memory storage
├── utils/
│   └── time.ts           # Time utility functions
├── services/
│   └── decision.service.ts # Notification decision logic
└── routes/
    ├── preferences.routes.ts # User preferences endpoints
    └── events.routes.ts      # Event processing endpoints
```

## 🚨 Assumptions & Limitations

- **UTC Timezone**: All time operations in UTC
- **No Database**: Uses in-memory storage (data lost on restart)
- **Default Behavior**: Users without preferences receive all notifications
- **Event Validation**: Strict validation using Zod schemas
- **DND Granularity**: Daily DND windows only (no weekly/custom patterns)

## 🔍 Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, suppressed notification |
| 201 | Created | Preferences saved |
| 202 | Accepted | Notification will be processed |
| 400 | Bad Request | Validation error |
| 404 | Not Found | User preferences not found |
| 500 | Internal Server Error | Unexpected server error | 