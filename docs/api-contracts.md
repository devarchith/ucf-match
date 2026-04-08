# API Contracts (Draft)

## Current
- `GET /api/health`
  - `200 OK`
  - Response: `{ "status": "ok" }`

## Profile
- `PUT /api/profile`
  - Request
    - `firstName: string`
    - `lastName: string`
    - `major?: string`
    - `graduationYear?: number`
    - `bio?: string`
  - Response
    - `id: string`
    - `userId: string`
    - `firstName: string`
    - `lastName: string`
    - `major: string | null`
    - `graduationYear: number | null`
    - `bio: string | null`
    - `updatedAt: string`

## Questionnaire Submission
- `POST /api/questionnaire`
  - Request
    - `answers: Record<string, unknown>`
  - Response
    - `id: string`
    - `userId: string`
    - `answers: Record<string, unknown>`
    - `submittedAt: string`
    - `updatedAt: string`

## Preference Submission
- `PUT /api/preferences`
  - Request
    - `preferredGenders: string[]`
    - `interests: string[]`
    - `communicationStyle?: string`
  - Response
    - `id: string`
    - `userId: string`
    - `preferredGenders: string[]`
    - `interests: string[]`
    - `communicationStyle: string | null`
    - `updatedAt: string`

## Weekly Status
- `PUT /api/weeks/{weekId}/status`
  - Request
    - `status: "OPTED_IN" | "OPTED_OUT"`
  - Response
    - `id: string`
    - `userId: string`
    - `weekId: string`
    - `status: "OPTED_IN" | "OPTED_OUT" | "MATCHED"`
    - `optedInAt: string | null`
    - `updatedAt: string`

## Match Response
- `POST /api/matches/{matchId}/response`
  - Request
    - `response: "ACCEPTED" | "DECLINED"`
  - Response
    - `id: string`
    - `weekId: string`
    - `status: "PENDING" | "ACTIVE" | "CLOSED"`
    - `userAResponse: "PENDING" | "ACCEPTED" | "DECLINED"`
    - `userBResponse: "PENDING" | "ACCEPTED" | "DECLINED"`
    - `updatedAt: string`

## Report / Block
- `POST /api/reports`
  - Request
    - `reportedUserId: string`
    - `weekId?: string`
    - `matchId?: string`
    - `reason: "HARASSMENT" | "SPAM" | "SAFETY_CONCERN" | "OTHER"`
    - `details?: string`
  - Response
    - `id: string`
    - `reporterUserId: string`
    - `reportedUserId: string`
    - `status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED"`
    - `createdAt: string`

- `POST /api/blocks`
  - Request
    - `blockedUserId: string`
    - `reason?: string`
  - Response
    - `id: string`
    - `blockerUserId: string`
    - `blockedUserId: string`
    - `createdAt: string`
