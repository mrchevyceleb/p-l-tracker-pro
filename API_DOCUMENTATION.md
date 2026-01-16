# P&L Tracker Pro REST API

REST API hosted on Supabase Edge Functions for the P&L Tracker Pro application.

## Base URL

```
https://dkaogxskwflaycwxogyi.supabase.co/functions/v1
```

## Authentication

All endpoints (except health checks) require authentication using a Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your-supabase-jwt-token>
```

You can obtain a JWT token by signing in through Supabase Auth. The token identifies the user and ensures all operations are scoped to their data.

## Endpoints

### Transactions

#### List All Transactions
```http
GET /transactions
```

Returns all transactions for the authenticated user, ordered by date (newest first).

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "date": "2026-01-15",
    "name": "Client Payment",
    "type": "income",
    "amount": 5000,
    "category_id": "uuid",
    "notes": "Q1 consulting work",
    "recurring_id": null
  }
]
```

#### Get Single Transaction
```http
GET /transactions/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "date": "2026-01-15",
  "name": "Client Payment",
  "type": "income",
  "amount": 5000,
  "category_id": "uuid",
  "notes": "Q1 consulting work",
  "recurring_id": null
}
```

#### Create Transaction
```http
POST /transactions
```

**Request Body:**
```json
{
  "date": "2026-01-15",
  "name": "Client Payment",
  "type": "income",
  "amount": 5000,
  "category_id": "uuid",
  "notes": "Q1 consulting work"
}
```

**Response:** Returns the created transaction with `201` status.

#### Bulk Import Transactions
```http
POST /transactions/import
```

**Request Body:**
```json
{
  "transactions": [
    {
      "date": "2026-01-15",
      "name": "Client Payment",
      "type": "income",
      "amount": 5000,
      "category_id": "uuid",
      "notes": ""
    },
    {
      "date": "2026-01-14",
      "name": "Office Supplies",
      "type": "expense",
      "amount": 150,
      "category_id": "uuid",
      "notes": "Staples"
    }
  ]
}
```

**Response:**
```json
{
  "imported": 2,
  "transactions": [...]
}
```

#### Update Transaction
```http
PUT /transactions/{id}
```

**Request Body:** (partial updates supported)
```json
{
  "name": "Updated Name",
  "amount": 6000,
  "notes": "Updated notes"
}
```

**Response:** Returns the updated transaction.

#### Delete Transaction
```http
DELETE /transactions/{id}
```

**Response:** `204 No Content`

---

### Categories

#### List All Categories
```http
GET /categories
```

Returns all categories for the authenticated user. If the user has no categories, automatically seeds 11 default categories.

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Sales",
    "type": "income",
    "deductibility_percentage": 0
  },
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Software & Tools",
    "type": "expense",
    "deductibility_percentage": 100
  }
]
```

#### Get Single Category
```http
GET /categories/{id}
```

#### Create Category
```http
POST /categories
```

**Request Body:**
```json
{
  "name": "Advertising",
  "type": "expense",
  "deductibility_percentage": 100
}
```

#### Update Category
```http
PUT /categories/{id}
```

**Request Body:**
```json
{
  "name": "Updated Category Name",
  "deductibility_percentage": 50
}
```

#### Delete Category
```http
DELETE /categories/{id}
```

**Response:** `204 No Content`

---

### Recurring Transactions

#### List All Recurring Series
```http
GET /recurring
```

Returns a summary of all recurring transaction series.

**Response:**
```json
[
  {
    "recurring_id": "uuid",
    "name": "Netflix Subscription",
    "type": "expense",
    "amount": 15.99,
    "category_id": "uuid",
    "transaction_count": 12,
    "first_date": "2026-01-01",
    "last_date": "2026-12-01"
  }
]
```

#### Get Series Transactions
```http
GET /recurring/{recurringId}
```

Returns all transactions in a recurring series.

**Response:**
```json
{
  "recurring_id": "uuid",
  "transactions": [...]
}
```

#### Create Recurring Series
```http
POST /recurring
```

Creates a recurring series of transactions with specified frequency.

**Request Body:**
```json
{
  "transaction": {
    "date": "2026-01-01",
    "name": "Netflix Subscription",
    "type": "expense",
    "amount": 15.99,
    "category_id": "uuid",
    "notes": "Monthly streaming"
  },
  "frequency": "monthly",
  "endDate": "2026-12-31"
}
```

**Frequencies:** `weekly`, `monthly`, `yearly`

**Response:**
```json
{
  "recurring_id": "uuid",
  "created": 12,
  "transactions": [...]
}
```

#### Update Series
```http
PUT /recurring/{recurringId}
```

Updates all transactions in a series (except dates).

**Request Body:**
```json
{
  "name": "Updated Subscription Name",
  "amount": 19.99,
  "notes": "Price increase"
}
```

**Response:**
```json
{
  "recurring_id": "uuid",
  "updated": 12,
  "transactions": [...]
}
```

#### Update End Date
```http
PUT /recurring/{recurringId}/end-date
```

Extends or truncates a recurring series by changing its end date.

**Request Body:**
```json
{
  "endDate": "2027-12-31"
}
```

**Response:**
```json
{
  "recurring_id": "uuid",
  "deleted": 0,
  "added": 12,
  "addedTransactions": [...]
}
```

#### End Subscription
```http
POST /recurring/{recurringId}/end
```

Ends a subscription by deleting all future transactions (keeps historical ones).

**Response:**
```json
{
  "recurring_id": "uuid",
  "deleted_future_transactions": 8
}
```

#### Delete Entire Series
```http
DELETE /recurring/{recurringId}
```

Deletes all transactions in the series (historical and future).

**Response:** `204 No Content`

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Example Usage

### cURL

```bash
# Get all transactions
curl -X GET \
  https://dkaogxskwflaycwxogyi.supabase.co/functions/v1/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a transaction
curl -X POST \
  https://dkaogxskwflaycwxogyi.supabase.co/functions/v1/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-15",
    "name": "Consulting Income",
    "type": "income",
    "amount": 5000,
    "category_id": "YOUR_CATEGORY_ID",
    "notes": "January client work"
  }'
```

### JavaScript (Fetch)

```javascript
const token = 'YOUR_JWT_TOKEN';
const baseUrl = 'https://dkaogxskwflaycwxogyi.supabase.co/functions/v1';

// Get all categories
const response = await fetch(`${baseUrl}/categories`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const categories = await response.json();

// Create a transaction
const response = await fetch(`${baseUrl}/transactions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    date: '2026-01-15',
    name: 'Office Rent',
    type: 'expense',
    amount: 1500,
    category_id: 'CATEGORY_ID',
    notes: 'January rent'
  }),
});
const transaction = await response.json();
```

---

## Deployment

The Edge Functions are deployed on Supabase. To redeploy after changes:

```bash
# Deploy all functions
supabase functions deploy transactions
supabase functions deploy categories
supabase functions deploy recurring

# Or deploy all at once
supabase functions deploy
```

---

## Local Development

To test Edge Functions locally:

```bash
# Start local Supabase (requires Docker)
supabase start

# Serve functions locally
supabase functions serve

# Functions will be available at:
# http://localhost:54321/functions/v1/{function-name}
```

---

## Notes

- All operations are automatically scoped to the authenticated user
- Date format is `YYYY-MM-DD`
- Amount is stored as a number (not cents)
- Categories are automatically seeded on first GET request if none exist
- Recurring series use a shared `recurring_id` to group transactions
