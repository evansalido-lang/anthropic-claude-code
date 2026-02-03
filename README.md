# Voice Agent - n8n Workflow with Claude AI & Eleven Labs

A conversational voice agent workflow for n8n that uses **Claude AI** as the brain (with custom knowledge base support) and **Eleven Labs** for realistic text-to-speech synthesis.

## Overview

This project provides ready-to-import n8n workflows that create a voice assistant capable of:

- Receiving audio input via webhook
- Transcribing speech to text using OpenAI Whisper
- Processing the text through Claude AI with your custom knowledge base
- Converting Claude's response to natural speech using Eleven Labs
- Returning audio response to the caller

## Architecture

### Basic Workflow
```
┌─────────────────────────────────────────────────────────────────────┐
│                        Voice Agent Workflow                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  Webhook │───▶│  Whisper │───▶│  Claude  │───▶│  Eleven Labs │  │
│  │  (Audio) │    │   STT    │    │    AI    │    │     TTS      │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Knowledge Base Workflow (RAG)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   Voice Agent with Knowledge Base                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐    ┌────────────────┐    ┌──────────────┐    │
│  │  Webhook │───▶│  Whisper │───▶│  Vector Store  │───▶│    Claude    │    │
│  │  (Audio) │    │   STT    │    │   Retrieval    │    │  + Context   │    │
│  └──────────┘    └──────────┘    └────────────────┘    └──────────────┘    │
│                                          │                    │             │
│                                          │                    ▼             │
│                                   ┌──────────────┐    ┌──────────────┐     │
│                                   │   Your Docs  │    │  Eleven Labs │     │
│                                   │  (Knowledge) │    │     TTS      │     │
│                                   └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Workflow Options

| Workflow | Description | Knowledge Base |
|----------|-------------|----------------|
| `voice-agent-workflow.json` | Basic voice-to-voice | No |
| `voice-agent-text-fallback.json` | Audio + text input support | No |
| `voice-agent-knowledge-base.json` | RAG with Pinecone vector DB | Yes (Pinecone) |
| `voice-agent-inmemory-kb.json` | RAG with in-memory storage | Yes (Code-based) |
| `document-ingestion.json` | Upload docs to knowledge base | Ingestion helper |

## Prerequisites

Before setting up the workflow, you'll need:

1. **n8n instance** - Self-hosted or cloud version
2. **Anthropic API Key** - Get one from [Anthropic Console](https://console.anthropic.com/)
3. **Eleven Labs API Key** - Get one from [Eleven Labs](https://elevenlabs.io/app/settings/api-keys)
4. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys) (for Whisper STT + Embeddings)
5. **Pinecone API Key** (optional) - For persistent vector storage: [Pinecone](https://www.pinecone.io/)

## Quick Start

### 1. Import the Workflow

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Select the workflow that fits your needs (see table above)

### 2. Configure Credentials

In n8n, create the following credentials:

#### Anthropic API Credentials
1. Go to **Credentials** → **Add Credential**
2. Search for "Anthropic"
3. Enter your Anthropic API key

#### Eleven Labs API Credentials
1. Go to **Credentials** → **Add Credential**
2. Search for "Eleven Labs"
3. Enter your Eleven Labs API key

#### OpenAI API Credentials
1. Go to **Credentials** → **Add Credential**
2. Search for "OpenAI"
3. Enter your OpenAI API key

#### Pinecone Credentials (for knowledge-base workflow)
1. Go to **Credentials** → **Add Credential**
2. Search for "Pinecone"
3. Enter your Pinecone API key and environment

### 3. Update Node Credentials

After importing, open each node and assign the corresponding credentials you just created.

### 4. Activate the Workflow

Click **Activate** to enable the webhook endpoint.

---

## Knowledge Base Setup

### Option 1: In-Memory Knowledge Base (Simple)

Use `voice-agent-inmemory-kb.json` for a simple setup without external databases.

1. Import the workflow
2. Open the **Knowledge Base Content** code node
3. Edit the `knowledgeBase` variable with your content:

```javascript
const knowledgeBase = `
# Your Company Knowledge Base

## Products
- Product A: Description here
- Product B: Description here

## FAQ
Q: Common question?
A: Answer here.

## Support
Contact: support@yourcompany.com
`;
```

4. Save and activate the workflow

**Pros:** No external services needed, easy to edit
**Cons:** Content resets when workflow restarts, limited scalability

### Option 2: Pinecone Vector Database (Production)

Use `voice-agent-knowledge-base.json` + `document-ingestion.json` for a scalable solution.

#### Step 1: Set up Pinecone

1. Create a free account at [Pinecone](https://www.pinecone.io/)
2. Create an index named `knowledge-base`:
   - Dimensions: `1536` (for OpenAI text-embedding-3-small)
   - Metric: `cosine`

#### Step 2: Import Both Workflows

1. Import `document-ingestion.json` - for uploading documents
2. Import `voice-agent-knowledge-base.json` - for the voice agent

#### Step 3: Ingest Your Documents

Upload documents to build your knowledge base:

```bash
# Upload a PDF
curl -X POST \
  'http://localhost:5678/webhook/ingest-documents' \
  -F 'file=@your-document.pdf'

# Upload a text file
curl -X POST \
  'http://localhost:5678/webhook/ingest-documents' \
  -F 'file=@knowledge.txt'
```

Supported formats: PDF, TXT, DOCX, CSV, JSON

#### Step 4: Query Your Voice Agent

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent-kb' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What are your products?"}' \
  --output response.mp3
```

---

## API Usage

### Voice Input (Audio)

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent' \
  -H 'Content-Type: audio/wav' \
  --data-binary @your-audio-file.wav \
  --output response.mp3
```

### Text Input

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello, how are you today?"}' \
  --output response.mp3
```

### Knowledge Base Query

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent-kb' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What products do you offer?"}' \
  --output response.mp3
```

### Document Ingestion

```bash
curl -X POST \
  'http://localhost:5678/webhook/ingest-documents' \
  -F 'file=@company-info.pdf'
```

Response:
```json
{
  "success": true,
  "message": "Document processed and added to knowledge base",
  "chunks": 15
}
```

---

## Configuration Options

### Claude AI Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Model | claude-sonnet-4-20250514 | Claude model to use |
| Max Tokens | 500 | Maximum response length |
| Temperature | 0.3 (KB) / 0.7 (basic) | Lower for factual KB responses |

### Eleven Labs Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Voice ID | 21m00Tcm4TlvDq8ikWAM | Voice to use (Rachel) |
| Model | eleven_multilingual_v2 | TTS model |
| Stability | 0.5 | Voice stability (0-1) |
| Similarity Boost | 0.75 | Voice similarity (0-1) |
| Style | 0.5 | Speaking style intensity |
| Output Format | mp3_44100_128 | Audio format |

### Knowledge Base Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Chunk Size | 1000 | Characters per document chunk |
| Chunk Overlap | 200 | Overlap between chunks |
| Embedding Model | text-embedding-3-small | OpenAI embedding model |
| Top K Results | 4 | Number of relevant chunks to retrieve |

### Available Eleven Labs Voices

| Voice | ID | Description |
|-------|-----|-------------|
| Rachel | 21m00Tcm4TlvDq8ikWAM | Calm, clear female |
| Domi | AZnzlk1XvdvUeBnXmlld | Strong, confident female |
| Bella | EXAVITQu4vr4xnSDxMaL | Soft, gentle female |
| Antoni | ErXwobaYiN019PkySvjV | Well-rounded male |
| Josh | TxGEqnHWrfWFTfGW9XjX | Deep, narrative male |
| Arnold | VR6AewLTigWG4xSOukaG | Crisp, bold male |

---

## Customizing the System Prompt

The Claude AI node includes a system prompt that defines the assistant's behavior. To customize:

1. Open the **Claude AI Brain** or **Knowledge Base QA** node
2. Modify the **System Message** in the options
3. Save the workflow

### Knowledge Base System Prompt

The KB workflow uses a specialized prompt that:
- Prioritizes information from your documents
- Admits when information isn't in the knowledge base
- Keeps responses concise for voice output
- Uses natural, conversational language

---

## Troubleshooting

### No audio in response

- Verify Eleven Labs credentials are correct
- Check that the voice ID exists and is available
- Ensure you have sufficient Eleven Labs credits

### Transcription fails

- Verify OpenAI credentials are correct
- Ensure audio format is supported (WAV, MP3, M4A, etc.)
- Check audio file isn't corrupted

### Claude not responding

- Verify Anthropic credentials are correct
- Check API rate limits haven't been exceeded
- Ensure the model specified is available

### Knowledge base not finding answers

- Verify documents were ingested successfully
- Check Pinecone index has vectors (Pinecone dashboard)
- Try rephrasing the question
- Ensure embedding model matches between ingestion and retrieval

### Webhook not accessible

- Verify n8n is running and accessible
- Check firewall settings
- Ensure workflow is activated

---

## File Structure

```
├── README.md
├── .env.example
└── workflows/
    ├── voice-agent-workflow.json        # Basic voice agent
    ├── voice-agent-text-fallback.json   # Audio + text support
    ├── voice-agent-knowledge-base.json  # RAG with Pinecone
    ├── voice-agent-inmemory-kb.json     # RAG with in-memory store
    └── document-ingestion.json          # Document upload for KB
```

---

## License

MIT License - Feel free to use and modify for your projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
