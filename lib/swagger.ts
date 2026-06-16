import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Workload Reminder API",
        version: "1.0.0",
        description: "REST API documentation for Workload Reminder",
      },
      servers: [
        {
          url: "/api/v1",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "token",
          },
        },
        schemas: {
          // ─── Enums ───────────────────────────────────────────────
          TaskStatus: {
            type: "string",
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"],
          },
          TaskPriority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
          },
          Difficulty: {
            type: "string",
            enum: ["EASY", "MEDIUM", "HARD", "VERY_HARD"],
          },
          SuggestionStatus: {
            type: "string",
            enum: ["ACTIVE", "ACCEPTED", "DISMISSED"],
          },
          NotificationType: {
            type: "string",
            enum: [
              "DEADLINE_ALERT",
              "AI_REMINDER",
              "SYSTEM",
              "STREAK_UPDATE",
              "BURNOUT_ALERT",
              "PUSH_TEST",
            ],
          },

          // ─── Auth ────────────────────────────────────────────────
          RegisterRequest: {
            type: "object",
            required: ["email", "password", "name"],
            properties: {
              email: { type: "string", format: "email", example: "user@example.com" },
              password: { type: "string", minLength: 8, example: "password123" },
              name: { type: "string", example: "Jane Doe" },
            },
          },
          LoginRequest: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: { type: "string", format: "email", example: "user@example.com" },
              password: { type: "string", example: "password123" },
            },
          },
          AuthResponse: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  user: { $ref: "#/components/schemas/User" },
                  token: { type: "string" },
                },
              },
            },
          },

          // ─── User ────────────────────────────────────────────────
          User: {
            type: "object",
            properties: {
              user_id: { type: "string" },
              email: { type: "string", format: "email" },
              name: { type: "string" },
              role: { type: "string", enum: ["USER", "ADMIN"] },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },

          // ─── Task ────────────────────────────────────────────────
          Task: {
            type: "object",
            properties: {
              task_id: { type: "string" },
              title: { type: "string" },
              description: { type: "string", nullable: true },
              status: { $ref: "#/components/schemas/TaskStatus" },
              priority: { $ref: "#/components/schemas/TaskPriority" },
              difficulty: { $ref: "#/components/schemas/Difficulty" },
              due_date: { type: "string", format: "date-time", nullable: true },
              completed_at: { type: "string", format: "date-time", nullable: true },
              estimated_hours: { type: "number", nullable: true },
              actual_hours: { type: "number", nullable: true },
              workload_score: { type: "number", nullable: true },
              user_id: { type: "string" },
              category_id: { type: "string", nullable: true },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          CreateTaskRequest: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string", maxLength: 255, example: "Finish report" },
              description: { type: "string", example: "Write the Q2 report" },
              priority: { $ref: "#/components/schemas/TaskPriority" },
              difficulty: { $ref: "#/components/schemas/Difficulty" },
              due_date: { type: "string", format: "date-time" },
              estimated_hours: { type: "number", minimum: 0 },
              category_id: { type: "string" },
            },
          },
          UpdateTaskRequest: {
            type: "object",
            properties: {
              title: { type: "string", maxLength: 255 },
              description: { type: "string" },
              status: { $ref: "#/components/schemas/TaskStatus" },
              priority: { $ref: "#/components/schemas/TaskPriority" },
              difficulty: { $ref: "#/components/schemas/Difficulty" },
              due_date: { type: "string", format: "date-time" },
              estimated_hours: { type: "number", minimum: 0 },
              actual_hours: { type: "number", minimum: 0 },
              category_id: { type: "string" },
            },
          },

          // ─── Category ────────────────────────────────────────────
          Category: {
            type: "object",
            properties: {
              category_id: { type: "string" },
              name: { type: "string" },
              color: { type: "string", example: "#6366f1" },
              user_id: { type: "string" },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          CreateCategoryRequest: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string", example: "School" },
              color: { type: "string", example: "#6366f1" },
            },
          },

          // ─── Study Session ───────────────────────────────────────
          StudySession: {
            type: "object",
            properties: {
              study_session_id: { type: "string" },
              user_id: { type: "string" },
              task_id: { type: "string" },
              session_type: {
                type: "string",
                enum: [
                  "FOCUS", "REVIEW", "PRACTICE", "READING",
                  "LECTURE", "DISCUSSION", "PLANNING", "BREAK", "ADMIN",
                ],
              },
              start_time: { type: "string", format: "date-time" },
              end_time: { type: "string", format: "date-time", nullable: true },
              duration_mins: { type: "integer", nullable: true },
              focus_score: { type: "integer", nullable: true },
              notes: { type: "string", nullable: true },
              created_at: { type: "string", format: "date-time" },
            },
          },
          CreateSessionRequest: {
            type: "object",
            required: ["task_id", "start_time"],
            properties: {
              task_id: { type: "string" },
              start_time: { type: "string", format: "date-time" },
              session_type: {
                type: "string",
                enum: [
                  "FOCUS", "REVIEW", "PRACTICE", "READING",
                  "LECTURE", "DISCUSSION", "PLANNING", "BREAK", "ADMIN",
                ],
              },
              notes: { type: "string" },
            },
          },

          // ─── Pomodoro ────────────────────────────────────────────
          PomodoroSettings: {
            type: "object",
            properties: {
              pomodoro_settings_id: { type: "string" },
              user_id: { type: "string" },
              work_duration: { type: "integer", example: 25 },
              short_break: { type: "integer", example: 5 },
              long_break: { type: "integer", example: 15 },
              cycles_before_long_break: { type: "integer", example: 4 },
              auto_start_breaks: { type: "boolean" },
              auto_start_pomodoros: { type: "boolean" },
            },
          },
          PomodoroCycle: {
            type: "object",
            properties: {
              pomodoro_cycle_id: { type: "string" },
              user_id: { type: "string" },
              study_session_id: { type: "string", nullable: true },
              start_time: { type: "string", format: "date-time" },
              end_time: { type: "string", format: "date-time", nullable: true },
              duration_mins: { type: "integer", nullable: true },
              is_completed: { type: "boolean" },
              cycle_number: { type: "integer" },
            },
          },

          // ─── Analytics ───────────────────────────────────────────
          ProgressResponse: {
            type: "object",
            properties: {
              totalTasks: { type: "integer" },
              completedTasks: { type: "integer" },
              pendingTasks: { type: "integer" },
              inProgressTasks: { type: "integer" },
              overdueTasks: { type: "integer" },
              completionRate: { type: "number" },
            },
          },
          ProductivityResponse: {
            type: "object",
            properties: {
              totalStudyMins: { type: "integer" },
              avgSessionMins: { type: "number" },
              avgFocusScore: { type: "number", nullable: true },
              sessionCount: { type: "integer" },
              studyDaysCount: { type: "integer" },
            },
          },
          WorkloadResponse: {
            type: "object",
            properties: {
              upcomingTasks: {
                type: "array",
                items: { $ref: "#/components/schemas/Task" },
              },
              totalEstimatedHours: { type: "number" },
            },
          },
          StreakResponse: {
            type: "object",
            properties: {
              currentStreak: { type: "integer" },
              longestStreak: { type: "integer" },
              lastStudyDate: { type: "string", format: "date-time" },
            },
          },

          // ─── AI BURNOUT──────────────────────────────────────────────────
          BurnoutAnalysisResponse: {
            type: "object",
            properties: {
              burnoutRiskScore: {
                type: "number",
                example: 74,
                description: "Calculated burnout risk score",
              },
              riskLevel: {
                type: "string",
                enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"],
                example: "HIGH",
              },
              reasons: {
                type: "array",
                items: {
                  type: "string",
                },
                example: [
                  "High number of overdue tasks",
                  "Low task completion rate",
                ],
              },
              recommendations: {
                type: "array",
                items: {
                  type: "string",
                },
                example: [
                  "Prioritize urgent tasks first",
                  "Break large tasks into smaller steps",
                ],
              },
              generatedAt: {
                type: "string",
                format: "date-time",
                example: "2026-06-16T10:30:00.000Z",
              },
            },
          },

BurnoutAnalysisNotFoundResponse: {
  nullable: true,
  description:
    "Returns null when the user does not have a previously saved burnout analysis",
  example: null,
},

// ─── AI Task Prioritization ───────────────────────────────────
TaskRanking: {
  type: "object",
  required: ["task_id", "score", "assignedPriority"],
  properties: {
    task_id: {
      type: "string",
      description: "ID of the ranked task",
      example: "cm123abc456",
    },
    score: {
      type: "number",
      description:
        "AI priority score. The route supports either decimal scores from 0 to 1 or percentage scores from 0 to 100.",
      example: 87,
    },
    reason: {
      type: "string",
      nullable: true,
      description: "Optional explanation for the AI ranking",
      example: "The task is difficult and has an approaching deadline.",
    },
    assignedPriority: {
      type: "string",
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      description: "Priority assigned from the AI score",
      example: "URGENT",
    },
  },
},

PrioritizationResponse: {
  type: "object",
  required: ["success", "tasks", "rankings"],
  properties: {
    success: {
      type: "boolean",
      example: true,
    },
    tasks: {
      type: "array",
      description:
        "All tasks belonging to the user after their priorities have been updated",
      items: {
        $ref: "#/components/schemas/Task",
      },
    },
    rankings: {
      type: "array",
      description: "AI rankings and assigned priorities",
      items: {
        $ref: "#/components/schemas/TaskRanking",
      },
    },
  },
},

PrioritizationErrorResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: false,
    },
    error: {
      type: "string",
      example: "AI prioritization failed",
    },
    message: {
      type: "string",
      example: "Unable to prioritize tasks",
    },
  },
},




          // ─── Shared ──────────────────────────────────────────────
          SuccessResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object" },
            },
          },
          ErrorResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Bad Request" },
              message: { type: "string" },
            },
          },
        },
      },

      // ─── Paths ─────────────────────────────────────────────────────
      paths: {
        // AUTH
        "/auth/register": {
          post: {
            tags: ["Authentication"],
            summary: "Register a new user",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RegisterRequest" },
                },
              },
            },
            responses: {
              201: {
                description: "User created successfully",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/AuthResponse" },
                  },
                },
              },
              400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
              409: { description: "Email already registered", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/auth/login": {
          post: {
            tags: ["Authentication"],
            summary: "Login and receive a session cookie",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginRequest" },
                },
              },
            },
            responses: {
              200: {
                description: "Login successful",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/AuthResponse" },
                  },
                },
              },
              401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/auth/me": {
          get: {
            tags: ["Authentication"],
            summary: "Get current authenticated user",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Current user profile",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { $ref: "#/components/schemas/User" },
                      },
                    },
                  },
                },
              },
              401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },

        // TASKS
        "/tasks": {
          get: {
            tags: ["Tasks"],
            summary: "List all tasks for the authenticated user",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Array of tasks",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: {
                          type: "object",
                          properties: {
                            tasks: { type: "array", items: { $ref: "#/components/schemas/Task" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
              401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
          post: {
            tags: ["Tasks"],
            summary: "Create a new task",
            security: [{ cookieAuth: [] }],
            parameters: [
              {
                in: "header",
                name: "x-csrf-token",
                required: true,
                schema: { type: "string" },
                description: "CSRF token",
              },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateTaskRequest" },
                },
              },
            },
            responses: {
              201: {
                description: "Task created",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { type: "object", properties: { task: { $ref: "#/components/schemas/Task" } } },
                      },
                    },
                  },
                },
              },
              400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
              403: { description: "Missing or invalid CSRF token", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/tasks/{taskId}": {
          get: {
            tags: ["Tasks"],
            summary: "Get a task by ID",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "path", name: "taskId", required: true, schema: { type: "string" } },
            ],
            responses: {
              200: {
                description: "Task object",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { type: "object", properties: { task: { $ref: "#/components/schemas/Task" } } },
                      },
                    },
                  },
                },
              },
              404: { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
          put: {
            tags: ["Tasks"],
            summary: "Update a task",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "path", name: "taskId", required: true, schema: { type: "string" } },
              { in: "header", name: "x-csrf-token", required: true, schema: { type: "string" } },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UpdateTaskRequest" },
                },
              },
            },
            responses: {
              200: {
                description: "Task updated",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { type: "object", properties: { task: { $ref: "#/components/schemas/Task" } } },
                      },
                    },
                  },
                },
              },
              400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
              404: { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
          delete: {
            tags: ["Tasks"],
            summary: "Delete a task",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "path", name: "taskId", required: true, schema: { type: "string" } },
              { in: "header", name: "x-csrf-token", required: true, schema: { type: "string" } },
            ],
            responses: {
              204: { description: "Task deleted" },
              404: { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },

        // CATEGORIES
        "/categories": {
          get: {
            tags: ["Categories"],
            summary: "List all categories",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Array of categories",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: {
                          type: "object",
                          properties: {
                            categories: { type: "array", items: { $ref: "#/components/schemas/Category" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ["Categories"],
            summary: "Create a new category",
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateCategoryRequest" },
                },
              },
            },
            responses: {
              201: { description: "Category created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
              409: { description: "Duplicate category name", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },
        "/categories/{categoryId}": {
          put: {
            tags: ["Categories"],
            summary: "Update a category",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "path", name: "categoryId", required: true, schema: { type: "string" } },
            ],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateCategoryRequest" },
                },
              },
            },
            responses: {
              200: { description: "Category updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
              404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
          delete: {
            tags: ["Categories"],
            summary: "Delete a category",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "path", name: "categoryId", required: true, schema: { type: "string" } },
            ],
            responses: {
              204: { description: "Category deleted" },
              404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },

        // STUDY SESSIONS
        "/sessions": {
          get: {
            tags: ["Study Sessions"],
            summary: "List all study sessions",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Array of sessions",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: {
                          type: "object",
                          properties: {
                            sessions: { type: "array", items: { $ref: "#/components/schemas/StudySession" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: ["Study Sessions"],
            summary: "Start a new study session",
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateSessionRequest" },
                },
              },
            },
            responses: {
              201: { description: "Session created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
              400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
            },
          },
        },

        // POMODORO
        "/pomodoro/settings": {
          get: {
            tags: ["Pomodoro"],
            summary: "Get pomodoro settings",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Pomodoro settings",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { $ref: "#/components/schemas/PomodoroSettings" },
                      },
                    },
                  },
                },
              },
            },
          },
          put: {
            tags: ["Pomodoro"],
            summary: "Update pomodoro settings",
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PomodoroSettings" },
                },
              },
            },
            responses: {
              200: { description: "Settings updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            },
          },
        },
        "/pomodoro/cycle": {
          post: {
            tags: ["Pomodoro"],
            summary: "Log a pomodoro cycle",
            security: [{ cookieAuth: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["cycle_number", "start_time"],
                    properties: {
                      study_session_id: { type: "string" },
                      start_time: { type: "string", format: "date-time" },
                      end_time: { type: "string", format: "date-time" },
                      duration_mins: { type: "integer" },
                      is_completed: { type: "boolean" },
                      cycle_number: { type: "integer" },
                    },
                  },
                },
              },
            },
            responses: {
              201: { description: "Cycle logged", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            },
          },
        },
        "/pomodoro/cycles": {
          get: {
            tags: ["Pomodoro"],
            summary: "Get all logged pomodoro cycles",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Array of cycles",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: {
                          type: "object",
                          properties: {
                            cycles: { type: "array", items: { $ref: "#/components/schemas/PomodoroCycle" } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // ANALYTICS
        "/analytics/progress": {
          get: {
            tags: ["Analytics"],
            summary: "Get task progress overview",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Progress stats",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { $ref: "#/components/schemas/ProgressResponse" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/analytics/productivity": {
          get: {
            tags: ["Analytics"],
            summary: "Get productivity trends",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "query", name: "days", schema: { type: "integer", default: 7 }, description: "Number of days to look back" },
            ],
            responses: {
              200: {
                description: "Productivity data",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { $ref: "#/components/schemas/ProductivityResponse" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/analytics/workload": {
          get: {
            tags: ["Analytics"],
            summary: "Get workload density",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "query", name: "days", schema: { type: "integer", default: 14 }, description: "Number of days to look ahead" },
            ],
            responses: {
              200: {
                description: "Workload data",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { $ref: "#/components/schemas/WorkloadResponse" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/analytics/completion": {
          get: {
            tags: ["Analytics"],
            summary: "Get completion rates",
            security: [{ cookieAuth: [] }],
            parameters: [
              { in: "query", name: "days", schema: { type: "integer", default: 30 } },
            ],
            responses: {
              200: { description: "Completion rate data", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            },
          },
        },
        "/analytics/streak": {
          get: {
            tags: ["Analytics"],
            summary: "Get study streak",
            security: [{ cookieAuth: [] }],
            responses: {
              200: {
                description: "Streak data",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean" },
                        data: { $ref: "#/components/schemas/StreakResponse" },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // AI

// AI TASK PRIORITIZATION
"/ai/prioritize": {
  servers: [
    {
      url: "/api",
      description: "Development AI API server",
    },
  ],

  post: {
    security: [],
    tags: ["AI"],
    summary: "Prioritize all tasks using AI",
    description:
      "Analyzes the authenticated user's workload, generates AI priority scores, converts each score into LOW, MEDIUM, HIGH, or URGENT, updates the matching tasks in the database, and returns the updated tasks and rankings.",
    parameters: [
      {
        in: "header",
        name: "x-user-id",
        required: true,
        schema: {
          type: "string",
        },
        description: "ID of the user whose tasks will be prioritized",
      },
    ],
    responses: {
      200: {
        description: "Tasks prioritized and updated successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/PrioritizationResponse",
            },
            example: {
              success: true,
              tasks: [
                {
                  task_id: "cm123abc456",
                  title: "Complete project report",
                  description: "Finish and submit the final report",
                  status: "PENDING",
                  priority: "URGENT",
                  difficulty: "HARD",
                  due_date: "2026-06-18T12:00:00.000Z",
                  user_id: "user123",
                },
              ],
              rankings: [
                {
                  task_id: "cm123abc456",
                  score: 87,
                  reason:
                    "The task is difficult and has an approaching deadline.",
                  assignedPriority: "URGENT",
                },
              ],
            },
          },
        },
      },

      401: {
        description: "The x-user-id header is missing",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/PrioritizationErrorResponse",
            },
            example: {
              success: false,
              error: "Missing user id",
            },
          },
        },
      },

      429: {
        description: "The external AI service rate limit has been reached",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/PrioritizationErrorResponse",
            },
            example: {
              success: false,
              error: "AI rate limit reached",
              message:
                "The AI token limit has been reached. Your task was saved, but its urgency could not be recalculated.",
            },
          },
        },
      },

      500: {
        description:
          "Analytics calculation, AI prioritization, or database update failed",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/PrioritizationErrorResponse",
            },
            example: {
              success: false,
              error: "AI prioritization failed",
              message: "Prioritization service unavailable",
            },
          },
        },
      },
    },
  },
},


        
// AI BURNOUT ANALYSIS
"/ai/burnout": {
  servers: [
    {
      url: "/api",
      description: "Development AI API server",
    },
  ],

  get: {
    security: [],
    tags: ["AI"],
    summary: "Get the most recently saved burnout analysis",
    description:
      "Returns the user's latest saved burnout analysis without calling the AI service.",
    parameters: [
      {
        in: "header",
        name: "x-user-id",
        required: true,
        schema: {
          type: "string",
        },
        description: "ID of the user whose burnout analysis is requested",
      },
    ],
    responses: {
      200: {
        description:
          "The latest saved burnout analysis, or null if no analysis has been generated",
        content: {
          "application/json": {
            schema: {
              oneOf: [
                {
                  $ref: "#/components/schemas/BurnoutAnalysisResponse",
                },
                {
                  $ref: "#/components/schemas/BurnoutAnalysisNotFoundResponse",
                },
              ],
            },
          },
        },
      },
      401: {
        description: "The x-user-id header is missing",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Missing user id",
            },
          },
        },
      },
      500: {
        description: "Failed to load the saved burnout analysis",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Failed to load burnout analysis",
              details: "Error details",
            },
          },
        },
      },
    },
  },

  post: {
    security: [], 
    tags: ["AI"],
    summary: "Generate and save a new burnout analysis",
    description:
      "Calculates user analytics, calls the burnout detection AI, saves the result, and returns the newly generated analysis. This endpoint should be called after a task is created, updated, completed, or deleted.",
    parameters: [
      {
        in: "header",
        name: "x-user-id",
        required: true,
        schema: {
          type: "string",
        },
        description: "ID of the user whose burnout analysis will be generated",
      },
    ],
    responses: {
      200: {
        description: "Burnout analysis generated and saved successfully",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/BurnoutAnalysisResponse",
            },
            example: {
              burnoutRiskScore: 74,
              riskLevel: "HIGH",
              reasons: [
                "High number of active pending tasks",
                "High number of overdue tasks",
                "Low completion rate",
              ],
              recommendations: [
                "Prioritize urgent and difficult tasks",
                "Break large tasks into smaller steps",
                "Create a manageable study schedule",
              ],
              generatedAt: "2026-06-16T10:30:00.000Z",
            },
          },
        },
      },
      401: {
        description: "The x-user-id header is missing",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Missing user id",
            },
          },
        },
      },
      500: {
        description:
          "The analytics calculation, AI generation, or database operation failed",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Burnout analysis failed",
              details: "Error details",
            },
          },
        },
      },
    },
  },
},



      },

      security: [{ cookieAuth: [] }],
    },
  });
  return spec;
};