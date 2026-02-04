/**
 * n8n ElevenLabs Voice Agent Workflow Builder
 *
 * This script builds and exports an n8n workflow for connecting
 * ElevenLabs Conversational AI to a Qdrant knowledge base.
 *
 * Usage:
 *   node n8n-voice-ai-workflow.js > workflow.json
 *
 * Or import and customize:
 *   const { buildWorkflow, createNodes } = require('./n8n-voice-ai-workflow.js');
 */

// Configuration - Update these values for your setup
const CONFIG = {
  // Workflow settings
  workflowName: 'ElevenLabs Voice Agent - RAG Knowledge Base',
  webhookPath: 'elevenlabs-voice-agent',

  // Qdrant settings
  qdrantCollection: 'your-collection-name',

  // AI settings
  geminiModel: 'gemini-1.5-flash',
  temperature: 0.7,
  embeddingsModel: 'text-embedding-3-small',
  topK: 5,

  // System prompt for the AI agent
  systemPrompt: `You are a helpful voice assistant answering phone calls. Your responses will be spoken aloud to callers.

IMPORTANT GUIDELINES:
- ALWAYS use the knowledge_base tool to search for relevant information before answering
- Keep responses concise and conversational (2-3 sentences max)
- Speak naturally as if talking on the phone
- Avoid technical jargon, bullet points, or formatting
- If you can't find relevant information, politely say you don't have that information
- Be friendly and professional`
};

/**
 * Creates the ElevenLabs Webhook node
 */
function createWebhookNode() {
  return {
    parameters: {
      httpMethod: 'POST',
      path: CONFIG.webhookPath,
      responseMode: 'responseNode',
      options: {}
    },
    id: 'webhook-entry',
    name: 'ElevenLabs Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [0, 0],
    webhookId: 'elevenlabs-voice-agent'
  };
}

/**
 * Creates the Extract Caller Query code node
 */
function createExtractDataNode() {
  const jsCode = `// Extract data from ElevenLabs Conversational AI webhook
// ElevenLabs sends the caller's transcribed speech
const webhookData = $input.first().json.body;

// ElevenLabs webhook payload structure
const query = webhookData.text || webhookData.transcript || webhookData.message || '';
const conversation_id = webhookData.conversation_id || webhookData.call_id || 'default';
const caller_id = webhookData.caller_id || webhookData.from || 'anonymous';

// Log for debugging
console.log('Received query:', query);
console.log('Conversation ID:', conversation_id);

return [{
  json: {
    query: query,
    conversation_id: conversation_id,
    caller_id: caller_id
  }
}];`;

  return {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: jsCode
    },
    id: 'extract-elevenlabs-data',
    name: 'Extract Caller Query',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [220, 0]
  };
}

/**
 * Creates the AI Agent node
 */
function createAIAgentNode() {
  return {
    parameters: {
      promptType: 'define',
      text: '={{ $json.query }}',
      options: {
        systemMessage: CONFIG.systemPrompt
      }
    },
    id: 'ai-agent',
    name: 'Generate Answer from Knowledge Base',
    type: '@n8n/n8n-nodes-langchain.agent',
    typeVersion: 1.7,
    position: [440, 0]
  };
}

/**
 * Creates the Google Gemini Chat Model node
 */
function createGeminiNode(credentialId = 'your-gemini-credential-id') {
  return {
    parameters: {
      model: CONFIG.geminiModel,
      options: {
        temperature: CONFIG.temperature
      }
    },
    id: 'google-gemini',
    name: 'Google Gemini Chat Model',
    type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
    typeVersion: 1,
    position: [340, 220],
    credentials: {
      googleGeminiApi: {
        id: credentialId,
        name: 'Google Gemini API'
      }
    }
  };
}

/**
 * Creates the Qdrant Vector Store node
 */
function createQdrantNode(credentialId = 'your-qdrant-credential-id') {
  return {
    parameters: {
      qdrantCollection: {
        __rl: true,
        mode: 'list',
        value: CONFIG.qdrantCollection
      },
      options: {}
    },
    id: 'qdrant-vector-store',
    name: 'Qdrant Vector Store',
    type: '@n8n/n8n-nodes-langchain.vectorStoreQdrant',
    typeVersion: 1,
    position: [640, 400],
    credentials: {
      qdrantApi: {
        id: credentialId,
        name: 'Qdrant API'
      }
    }
  };
}

/**
 * Creates the OpenAI Embeddings node
 */
function createEmbeddingsNode(credentialId = 'your-openai-credential-id') {
  return {
    parameters: {
      model: CONFIG.embeddingsModel,
      options: {}
    },
    id: 'openai-embeddings',
    name: 'OpenAI Embeddings',
    type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
    typeVersion: 1,
    position: [640, 560],
    credentials: {
      openAiApi: {
        id: credentialId,
        name: 'OpenAI API'
      }
    }
  };
}

/**
 * Creates the Vector Store Tool node
 */
function createVectorStoreToolNode() {
  return {
    parameters: {
      name: 'knowledge_base',
      description: 'Search the knowledge base for information to answer caller questions. Always use this tool before responding to find accurate information.',
      topK: CONFIG.topK
    },
    id: 'vector-store-tool',
    name: 'Vector Store Tool',
    type: '@n8n/n8n-nodes-langchain.toolVectorStore',
    typeVersion: 1,
    position: [540, 220]
  };
}

/**
 * Creates the Window Buffer Memory node
 */
function createMemoryNode() {
  return {
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: '={{ $json.conversation_id }}'
    },
    id: 'window-buffer-memory',
    name: 'Conversation Memory',
    type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
    typeVersion: 1.3,
    position: [440, 220]
  };
}

/**
 * Creates the Format Response code node
 */
function createFormatResponseNode() {
  const jsCode = `// Format response for ElevenLabs Conversational AI
const aiResponse = $input.first().json.output;

// ElevenLabs expects a JSON response with the text to speak
return [{
  json: {
    response: aiResponse,
    text: aiResponse
  }
}];`;

  return {
    parameters: {
      mode: 'runOnceForAllItems',
      jsCode: jsCode
    },
    id: 'format-response',
    name: 'Format Response for ElevenLabs',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [660, 0]
  };
}

/**
 * Creates the Respond to Webhook node
 */
function createRespondNode() {
  return {
    parameters: {
      respondWith: 'json',
      responseBody: '={{ JSON.stringify($json) }}',
      options: {
        responseCode: 200,
        responseHeaders: {
          entries: [
            {
              name: 'Content-Type',
              value: 'application/json'
            }
          ]
        }
      }
    },
    id: 'respond-to-elevenlabs',
    name: 'Respond to ElevenLabs',
    type: 'n8n-nodes-base.respondToWebhook',
    typeVersion: 1.1,
    position: [880, 0]
  };
}

/**
 * Creates all nodes for the workflow
 */
function createNodes(credentials = {}) {
  return [
    createWebhookNode(),
    createExtractDataNode(),
    createAIAgentNode(),
    createGeminiNode(credentials.gemini),
    createQdrantNode(credentials.qdrant),
    createEmbeddingsNode(credentials.openai),
    createVectorStoreToolNode(),
    createMemoryNode(),
    createFormatResponseNode(),
    createRespondNode()
  ];
}

/**
 * Creates the connections between nodes
 */
function createConnections() {
  return {
    'ElevenLabs Webhook': {
      main: [[{ node: 'Extract Caller Query', type: 'main', index: 0 }]]
    },
    'Extract Caller Query': {
      main: [[{ node: 'Generate Answer from Knowledge Base', type: 'main', index: 0 }]]
    },
    'Generate Answer from Knowledge Base': {
      main: [[{ node: 'Format Response for ElevenLabs', type: 'main', index: 0 }]]
    },
    'Google Gemini Chat Model': {
      ai_languageModel: [[{ node: 'Generate Answer from Knowledge Base', type: 'ai_languageModel', index: 0 }]]
    },
    'Conversation Memory': {
      ai_memory: [[{ node: 'Generate Answer from Knowledge Base', type: 'ai_memory', index: 0 }]]
    },
    'Vector Store Tool': {
      ai_tool: [[{ node: 'Generate Answer from Knowledge Base', type: 'ai_tool', index: 0 }]]
    },
    'Qdrant Vector Store': {
      ai_vectorStore: [[{ node: 'Vector Store Tool', type: 'ai_vectorStore', index: 0 }]]
    },
    'OpenAI Embeddings': {
      ai_embedding: [[{ node: 'Qdrant Vector Store', type: 'ai_embedding', index: 0 }]]
    },
    'Format Response for ElevenLabs': {
      main: [[{ node: 'Respond to ElevenLabs', type: 'main', index: 0 }]]
    }
  };
}

/**
 * Builds the complete workflow object
 */
function buildWorkflow(options = {}) {
  const credentials = options.credentials || {};

  // Override config if provided
  if (options.config) {
    Object.assign(CONFIG, options.config);
  }

  return {
    name: CONFIG.workflowName,
    nodes: createNodes(credentials),
    connections: createConnections(),
    settings: {
      executionOrder: 'v1'
    },
    staticData: null,
    tags: [],
    triggerCount: 1,
    pinData: {}
  };
}

/**
 * Exports workflow as JSON string
 */
function exportWorkflow(options = {}) {
  const workflow = buildWorkflow(options);
  return JSON.stringify(workflow, null, 2);
}

// CLI usage - output JSON when run directly
if (require.main === module) {
  console.log(exportWorkflow());
}

// Module exports
module.exports = {
  CONFIG,
  buildWorkflow,
  exportWorkflow,
  createNodes,
  createConnections,
  // Individual node creators for customization
  createWebhookNode,
  createExtractDataNode,
  createAIAgentNode,
  createGeminiNode,
  createQdrantNode,
  createEmbeddingsNode,
  createVectorStoreToolNode,
  createMemoryNode,
  createFormatResponseNode,
  createRespondNode
};
