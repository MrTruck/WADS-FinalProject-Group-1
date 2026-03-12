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
          url: "http://localhost:3000/api/v1",
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
      },
      security: [{ cookieAuth: [] }],
    },
  });
  return spec;
};