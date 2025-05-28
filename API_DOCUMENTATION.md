# Smart Carbon Monitoring Platform API Documentation

## Overview

This document provides detailed information about the API endpoints available in the Smart Carbon Monitoring Platform. The API follows REST principles and uses JSON for data exchange.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication for development purposes. In a production environment, authentication would be implemented using Bearer tokens or API keys.

## Error Handling

The API returns appropriate HTTP status codes for different types of errors:

- `400 Bad Request` - The request was invalid or malformed
- `404 Not Found` - The requested resource was not found
- `500 Internal Server Error` - An unexpected server error occurred

Error responses include a JSON body with an error message:

```json
{
  "message": "Error message describing the issue"
}
```

## Endpoints

### Carbon Emissions Data

#### GET /carbon

Retrieve all carbon emission data entries.

**Query Parameters:**

- `buildingId` (optional) - Filter by building ID
- `startDate` (optional) - Filter by start date (YYYY-MM-DD)
- `endDate` (optional) - Filter by end date (YYYY-MM-DD)

**Example Request:**

```
GET /api/carbon?buildingId=B-101&startDate=2025-05-01&endDate=2025-05-28
```

**Example Response:**

```json
[
  {
    "id": "abc123",
    "timestamp": "2025-05-15T10:30:00Z",
    "buildingId": "B-101",
    "deviceId": "D-001",
    "energyConsumption": 45.7,
    "carbonEmissions": 12.3,
    "temperature": 22.5,
    "humidity": 55,
    "metadata": {
      "buildingName": "City Hall",
      "buildingType": "government",
      "deviceType": "hvac"
    }
  },
  {
    "id": "def456",
    "timestamp": "2025-05-15T11:00:00Z",
    "buildingId": "B-101",
    "deviceId": "D-002",
    "energyConsumption": 32.1,
    "carbonEmissions": 8.5,
    "temperature": 21.8,
    "humidity": 52,
    "metadata": {
      "buildingName": "City Hall",
      "buildingType": "government",
      "deviceType": "lighting"
    }
  }
]
```

#### GET /carbon/:id

Retrieve a specific carbon emission data entry by ID.

**Example Request:**

```
GET /api/carbon/abc123
```

**Example Response:**

```json
{
  "id": "abc123",
  "timestamp": "2025-05-15T10:30:00Z",
  "buildingId": "B-101",
  "deviceId": "D-001",
  "energyConsumption": 45.7,
  "carbonEmissions": 12.3,
  "temperature": 22.5,
  "humidity": 55,
  "metadata": {
    "buildingName": "City Hall",
    "buildingType": "government",
    "deviceType": "hvac"
  }
}
```

#### POST /carbon

Create a new carbon emission data entry.

**Request Body:**

```json
{
  "buildingId": "B-102",
  "deviceId": "D-003",
  "energyConsumption": 28.9,
  "carbonEmissions": 7.2,
  "temperature": 23.1,
  "humidity": 48,
  "metadata": {
    "buildingName": "Community Center",
    "buildingType": "public",
    "deviceType": "power"
  }
}
```

**Example Response:**

```json
{
  "id": "ghi789",
  "timestamp": "2025-05-28T14:25:12Z",
  "buildingId": "B-102",
  "deviceId": "D-003",
  "energyConsumption": 28.9,
  "carbonEmissions": 7.2,
  "temperature": 23.1,
  "humidity": 48,
  "metadata": {
    "buildingName": "Community Center",
    "buildingType": "public",
    "deviceType": "power"
  }
}
```

#### PUT /carbon/:id

Update an existing carbon emission data entry.

**Example Request:**

```
PUT /api/carbon/abc123
```

**Request Body:**

```json
{
  "energyConsumption": 50.2,
  "carbonEmissions": 15.8
}
```

**Example Response:**

```json
{
  "id": "abc123",
  "timestamp": "2025-05-15T10:30:00Z",
  "buildingId": "B-101",
  "deviceId": "D-001",
  "energyConsumption": 50.2,
  "carbonEmissions": 15.8,
  "temperature": 22.5,
  "humidity": 55,
  "metadata": {
    "buildingName": "City Hall",
    "buildingType": "government",
    "deviceType": "hvac"
  }
}
```

#### DELETE /carbon/:id

Delete a carbon emission data entry.

**Example Request:**

```
DELETE /api/carbon/abc123
```

**Example Response:**

```json
{
  "message": "Carbon data deleted"
}
```

## Data Model

### Carbon Data Schema

| Field             | Type     | Description                                      |
|-------------------|----------|--------------------------------------------------|
| id                | String   | Unique identifier for the carbon data entry      |
| timestamp         | Date     | Date and time when the reading was taken         |
| buildingId        | String   | Identifier for the building                      |
| deviceId          | String   | Identifier for the device                        |
| energyConsumption | Number   | Energy consumption in kilowatt-hours (kWh)       |
| carbonEmissions   | Number   | Carbon emissions in kilograms of CO2             |
| temperature       | Number   | Temperature in degrees Celsius (optional)        |
| humidity          | Number   | Humidity percentage (optional)                   |
| metadata          | Object   | Additional information about the reading         |

### Validation Rules

- `buildingId` is required for all entries
- `energyConsumption` and `carbonEmissions` must be non-negative values

## Using the API Client

The platform includes a JavaScript client for easy interaction with the API:

```javascript
// Create a new client instance
const client = new CarbonApiClient('/api/carbon');

// Fetch all data
const allData = await client.getAllData();

// Fetch data for a specific building
const buildingData = await client.getBuildingData('B-101');

// Fetch data for a date range
const dateRangeData = await client.getDataByDateRange('2025-05-01', '2025-05-28');

// Create a new data entry
const newData = await client.createData({
  buildingId: 'B-102',
  deviceId: 'D-003',
  energyConsumption: 28.9,
  carbonEmissions: 7.2
});
```

## Rate Limiting

In a production environment, rate limiting would be implemented to prevent abuse. The current development environment does not include rate limiting.

## Versioning

API versioning will be implemented in future releases using URL paths (e.g., `/api/v1/carbon`).

---

For additional questions or support, please contact the development team.
