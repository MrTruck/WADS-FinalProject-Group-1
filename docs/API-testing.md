# API Testing Results Documentation

## 10. Testing Documentation

**Important**
* This documentation is incomplete and will be updated.
* API Postman Collection link available at:
* All test cases screenshots available at: 


### 10.1 Frontend Testing

*(To be completed )*

| Test Case | Scenario | Expected Result | Status |
|-----------|----------|-----------------|--------|

### 10.2 Backend & API Testing

| Test Case | Method | Endpoint | Description | Expected Result | Status |
|-----------|--------|----------|-------------|-----------------|--------|
| **Authentication** | | | | | |
| TC‑01 | POST | `/api/auth/register` | Valid email, password, name | 201 Created | PASS |
| TC‑02 | POST | `/api/auth/register` | Missing password field | 400 Bad Request | PASS |
| TC‑03 | POST | `/api/auth/register` | Email as number (invalid type) | 400 Bad Request / validation error | NOT TESTED |
| TC‑04 | POST | `/api/auth/login` | Valid credentials | 200 OK, JWT token & cookie | PASS |
| TC‑05 | POST | `/api/auth/login` | Wrong password | 401 Unauthorized | PASS |
| TC‑06 | POST | `/api/auth/login` | Non‑existent user | 401 Unauthorized | PASS |
| TC‑07 | GET | `/api/auth/me` | No auth header/cookie | 401 Unauthorized | PASS |
| TC‑08 | GET | `/api/auth/me` | Valid session cookie | 200 OK, user profile | PASS |
| TC‑09 | GET | `/api/v1/admin/users` | Regular user token, admin route | 403 Forbidden | NOT TESTED |
| TC‑10 | GET | `/api/v1/admin/users` | Admin token, admin route | 200 OK, user list | NOT TESTED |
| **Tasks (CRUD)** | | | | | |
| TC‑11 | POST | `/api/v1/tasks` | Valid title & priority (CSRF token present) | 201 Created | PASS |
| TC‑12 | POST | `/api/v1/tasks` | Missing `title` field | 400 Bad Request | PASS |
| TC‑13 | POST | `/api/v1/tasks` | Priority as integer (invalid type) | 400 Bad Request | PASS |
| TC‑14 | GET | `/api/v1/tasks/{validId}` | Existing task ID | 200 OK, task object | PASS |
| TC‑15 | GET | `/api/v1/tasks/fake-id-123` | Non‑existent ID | 404 Not Found | PASS |
| TC‑16 | PUT | `/api/v1/tasks/{validId}` | Valid update (title, status) | 200 OK | PASS |
| TC‑17 | PUT | `/api/v1/tasks/{validId}` | Invalid input (empty title) | 400 Bad Request | PASS |
| TC‑18 | DELETE | `/api/v1/tasks/{validId}` | Existing ID (valid CSRF) | 204 No Content | PASS |
| TC‑19 | DELETE | `/api/v1/tasks/non‑existent` | Non‑existent ID (valid CSRF) | 404 Not Found | PASS |
| TC‑20 | GET | `/api/v1/tasks/` | List all tasks (authenticated) | 200 OK, array of tasks | PASS |
| **Categories** | | | | | |
| TC‑40 | POST | `/api/v1/categories` | Valid name & color | 201 Created | PASS |
| TC‑41 | POST | `/api/v1/categories` | Duplicate category name | 409 Conflict | PASS |
| TC‑42 | GET | `/api/v1/categories` | Fetch all categories | 200 OK, array | PASS |
| TC‑43 | PUT | `/api/v1/categories/{id}` | Update category name | 200 OK | PASS |
| TC‑44 | DELETE | `/api/v1/categories/{id}` | Delete existing category | 204 No Content | PASS |
| **Study Sessions** | | | | | |
| TC‑45 | POST | `/api/v1/sessions` | Valid `task_id` & `start_time` | 201 Created | PASS |
| TC‑46 | POST | `/api/v1/sessions` | Invalid / truncated `task_id` | 400 Bad Request | PASS |
| TC‑47 | GET | `/api/v1/sessions` | List all sessions for user | 200 OK, array | PASS |
| **Pomodoro** | | | | | |
| TC‑48 | GET | `/api/v1/pomodoro/settings` | Fetch user settings | 200 OK | PASS |
| TC‑49 | PUT | `/api/v1/pomodoro/settings` | Update work/break durations | 200 OK | PASS |
| TC‑50 | POST | `/api/v1/pomodoro/cycle` | Log a valid Pomodoro cycle | 201 Created | PASS |
| TC‑51 | GET | `/api/v1/pomodoro/cycles` | Get all logged cycles | 200 OK | PASS |
| **Notifications** | | | | | |
| TC‑52 | GET | `/api/v1/notifications/settings` | Get notification preferences | 200 OK | PASS |
| TC‑53 | PUT | `/api/v1/notifications/settings` | Update notification preferences | 200 OK | PASS |
| TC‑54 | GET | `/api/v1/notifications` | Fetch all notifications | 200 OK | PASS |
| TC‑55 | (PATCH) | (mark read) | Mark notification as read | 200 OK | NOT TESTED |
| **Analytics** | | | | | |
| TC‑56 | GET | `/api/v1/analytics/progress` | Progress status | 200 OK | PASS |
| TC‑57 | GET | `/api/v1/analytics/productivity?days=7` | Productivity trends | 200 OK | PASS |
| TC‑58 | GET | `/api/v1/analytics/workload?days=14` | Workload density | 200 OK | PASS |
| TC‑59 | GET | `/api/v1/analytics/completion?days=30` | Completion rates | 200 OK | PASS |
| TC‑60 | GET | `/api/v1/analytics/streak` | Study streak | 200 OK | PASS |
| **AI Modules** (basic endpoint checks) | | | | | |
| TC‑61 | GET | `/api/v1/ai/insights` | Fetch AI insights | 200 OK | PASS |
| TC‑62 | GET | `/api/v1/ai/suggestions` | Fetch AI suggestions | 200 OK | PASS |
| TC‑63 | (POST) | Accept an AI suggestion | – | 200 OK | NOT TESTED |
| TC‑64 | (POST) | Dismiss an AI suggestion | – | 200 OK | NOT TESTED |
| **Admin** | | | | | |
| TC‑65 | POST | `/api/auth/login` | Admin login (`admin@example.com`) | 200 OK, admin token | NOT TESTED |
| TC‑66 | GET | `/api/v1/admin/users` | Admin token, list all users | 200 OK | PASS |
| TC‑67 | DELETE | `/api/v1/admin/users/{userId}` | Admin deletes a user | 204 No Content | PASS |
| TC‑68 | GET | `/api/v1/admin/analytics` | System analytics (admin only) | 200 OK | PASS |

### 10.3 Security Testing

| Test Case | Attack Type / Scenario | Expected Behaviour | Status |
|-----------|------------------------|-------------------|--------|
| TC‑21 | Empty input fields (registration) | 400 Bad Request | NOT TESTED |
| TC‑22 | Boundary – title exactly 255 chars | Accepted, 201 Created | NOT TESTED |
| TC‑23 | Boundary – title > 255 chars | Rejected, 400 | NOT TESTED |
| TC‑24 | Boundary – title 1 char (minimum) | Accepted, 201 | NOT TESTED |
| TC‑25 | Special characters in task title | Accepted, stored safely | NOT TESTED |
| TC‑26 | SQL Injection – email `' OR '1'='1` | Input sanitised, login fails / 400 | NOT TESTED |
| TC‑27 | Stored XSS – name `<script>alert('XSS')</script>` | Output escaped, no script execution | NOT TESTED |
| TC‑28 | XSS in task title (via GET listing) | Rendered as text, not executed | NOT TESTED |
| TC‑29 | Invalid email format (`notanemail`) | 400 Bad Request | NOT TESTED |
| TC‑30 | Invalid `estimated_hours` (negative number) | 400 Bad Request | NOT TESTED |
| TC‑31 | Duplicate email registration | 409 Conflict | PASS |
| TC‑32 | CSRF – POST task without `x-csrf-token` header | 403 Forbidden | PASS |
| TC‑33 | Expired token access | 401 Unauthorized | PASS |
| TC‑34 | Logout – subsequent request with old token | 401 Unauthorized (token invalidated) | PASS |
| TC‑35 | Session timeout (cleared cookie) | 401 Unauthorized | PASS |
| TC‑36 | Correct HTTP status – invalid endpoint | 404 Not Found | PASS |
| TC‑37 | Incorrect HTTP method – DELETE on `/api/v1/tasks` collection | 405 Method Not Allowed | PASS |
| TC‑38 | Concurrent requests (10 rapid GETs) | No crashes, consistent 200 responses | PASS |
| TC‑39 | Password change (placeholder) | Secure flow, old token invalidated | NOT TESTED |

### 10.4 AI Functionality Testing

**Note:** The results above only verify that the AI endpoints respond correctly.  
Detailed AI testing (variation, injection, fallback) will be completed and recorded in the tables below.

**AI Feature 1: AI Study Insights & Productivity Recommendations**

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| AI‑01 | Valid user with study history | Personalised insights | – | NOT TESTED |
| AI‑02 | New user (no data) | Meaningful fallback message | – | NOT TESTED |
| AI‑03 | Invalid request parameters | Graceful error / 400 | – | NOT TESTED |
| AI‑04 | Prompt injection attempt | System sanitises, does not execute | – | NOT TESTED |
| AI‑05 | AI service unavailable (simulated) | Fallback response or 503 | – | NOT TESTED |

**AI Feature 2: Smart Task Suggestions / Study Plan Optimisation**

| Test Case | Input | Expected Output | Actual Result | Status |
|-----------|-------|-----------------|---------------|--------|
| AI‑01 | Valid task list and preferences | Optimised schedule | – | NOT TESTED |
| AI‑02 | Empty task list | “No tasks to optimise” message | – | NOT TESTED |
| AI‑03 | Very large task list | Response within timeout | – | NOT TESTED |
| AI‑04 | Nonsensical / injection input | System handles safely | – | NOT TESTED |
| AI‑05 | AI returns malformed JSON | Error handled, fallback logic | – | NOT TESTED |

