#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const N8N_URL = process.env.N8N_URL || 'https://ptrw0311-n8n-free.hf.space';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDgxZTM5My1lYzJjLTRlOTUtODU1NS0yOGQ4Y2VjNThhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY2MTIzMjY2fQ.KWe_vyYS3oN9GGOWmhwv9kgmyNqh7rXADNdH8xZf86U';

class N8NServer {
  constructor() {
    this.server = new Server(
      {
        name: 'n8n-hf-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'trigger_webhook',
            description: '觸發 n8n webhook 工作流程',
            inputSchema: {
              type: 'object',
              properties: {
                webhookPath: {
                  type: 'string',
                  description: 'Webhook 路徑 (例如: subtitle-fetcher)',
                },
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE'],
                  default: 'POST',
                  description: 'HTTP 方法',
                },
                data: {
                  type: 'object',
                  description: '要發送的數據',
                },
              },
              required: ['webhookPath'],
            },
          },
          {
            name: 'import_workflow',
            description: '匯入工作流程到 n8n',
            inputSchema: {
              type: 'object',
              properties: {
                workflowJson: {
                  type: 'string',
                  description: '工作流程 JSON 字串',
                },
              },
              required: ['workflowJson'],
            },
          },
          {
            name: 'get_workflow_status',
            description: '取得工作流程執行狀態',
            inputSchema: {
              type: 'object',
              properties: {
                executionId: {
                  type: 'string',
                  description: '執行 ID',
                },
              },
              required: ['executionId'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'trigger_webhook':
            return await this.triggerWebhook(args);
          case 'import_workflow':
            return await this.importWorkflow(args);
          case 'get_workflow_status':
            return await this.getWorkflowStatus(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `錯誤: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async triggerWebhook({ webhookPath, method = 'POST', data = {} }) {
    const url = `${N8N_URL}/webhook/${webhookPath}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: `成功觸發 webhook: ${webhookPath}\n\n回應:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `觸發 webhook 失敗: ${error.message}`,
          },
        ],
      };
    }
  }

  async importWorkflow({ workflowJson }) {
    try {
      const workflow = JSON.parse(workflowJson);
      const url = `${N8N_URL}/rest/workflows`;

      const headers = {
        'Content-Type': 'application/json',
      };

      // 添加 API Key 認證
      if (N8N_API_KEY) {
        headers['Authorization'] = `Bearer ${N8N_API_KEY}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: `成功匯入工作流程\n\n回應:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `匯入工作流程失敗: ${error.message}`,
          },
        ],
      };
    }
  }

  async getWorkflowStatus({ executionId }) {
    try {
      const url = `${N8N_URL}/rest/executions/${executionId}`;

      const headers = {};

      // 添加 API Key 認證
      if (N8N_API_KEY) {
        headers['Authorization'] = `Bearer ${N8N_API_KEY}`;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: `工作流程執行狀態:\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `取得工作流程狀態失敗: ${error.message}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('n8n MCP server running on stdio');
  }
}

const server = new N8NServer();
server.run().catch(console.error);