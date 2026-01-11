import swaggerJsdoc from "swagger-jsdoc"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BrokerFlow CRM API",
      version: "1.0.0",
      description: "Plataforma CRM Imobiliária com Multi-tenant, RBAC e Gestão de Leads",
      contact: {
        name: "BrokerFlow",
        email: "vendas@brokerflow.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local Development",
      },
      {
        url: "https://api.brokerflow.com",
        description: "Production",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Authorization header using Bearer token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "AUTONOMO", "GESTOR", "CORRETOR"] },
            agenciaId: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Lead: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            status: { type: "string", enum: ["novo", "contato", "qualificacao", "proposta", "negociacao", "fechado"] },
            propertyInterest: { type: "string" },
            assignedTo: { type: "number" },
            agenciaId: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Equipe: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            agenciaId: { type: "number" },
            gestorId: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Plan: {
          type: "object",
          properties: {
            id: { type: "string", enum: ["SOLO", "ESSENTIAL", "SCALE"] },
            name: { type: "string" },
            price: { type: "number" },
            features: {
              type: "object",
              properties: {
                maxUsers: { type: "number" },
                maxProperties: { type: "number" },
                teamManagement: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
}

export const specs = swaggerJsdoc(options)
