# n8n ElevenLabs Voice Agent - RAG Knowledge Base

A workflow that connects ElevenLabs Conversational AI voice agent to your Qdrant knowledge base. When callers ask questions, the AI searches your knowledge base and responds with accurate answers.

## How It Works

```
Caller speaks → ElevenLabs transcribes → Webhook to n8n → Search Knowledge Base → Generate Answer → Return text → ElevenLabs speaks response
```

## The Flow

| Step | Node | Purpose |
|------|------|---------|
| 1 | **ElevenLabs Webhook** | Receives POST from ElevenLabs with caller's transcribed speech |
| 2 | **Extract Caller Query** | Parses the transcription and conversation_id from webhook |
| 3 | **Generate Answer** | AI Agent searches Qdrant and generates conversational response |
| 4 | **Format Response** | Packages answer in ElevenLabs expected format |
| 5 | **Respond to ElevenLabs** | Returns JSON with text for ElevenLabs to speak |

## Setup Instructions

### 1. Import the Workflow

1. Open n8n
2. Go to **Workflows** → **Import from File**
3. Select `n8n-voice-ai-workflow.json`

### 2. Configure Credentials

#### Google Gemini API
- **Settings** → **Credentials** → **Add Credential** → **Google Gemini API**
- Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Qdrant API
- Add **Qdrant API** credential
- Enter your Qdrant URL and API key

#### OpenAI API (for embeddings)
- Add **OpenAI API** credential
- Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Configure the Workflow

1. **Qdrant Vector Store node**: Update `your-collection-name` to your actual collection
2. **All credential nodes**: Select your configured credentials
3. **Save** and **Activate** the workflow

### 4. Get Your Webhook URL

After activating, copy the webhook URL from the **ElevenLabs Webhook** node. It will look like:

```
https://your-n8n-instance.com/webhook/elevenlabs-voice-agent
```

### 5. Configure ElevenLabs Voice Agent

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/conversational-ai)
2. Create or edit your voice agent
3. In the **Webhook** settings, paste your n8n webhook URL
4. Configure the webhook to send transcribed caller speech

## ElevenLabs Webhook Configuration

In your ElevenLabs agent settings, configure the webhook:

- **URL**: `https://your-n8n-instance.com/webhook/elevenlabs-voice-agent`
- **Method**: POST
- **Payload**: The workflow expects these fields (handles multiple formats):
  - `text` or `transcript` or `message` - The caller's question
  - `conversation_id` or `call_id` - For conversation memory

## Expected Webhook Payload

ElevenLabs will send something like:

```json
{
  "text": "What are your business hours?",
  "conversation_id": "conv_abc123",
  "caller_id": "+1234567890"
}
```

## Response Format

n8n returns:

```json
{
  "response": "Our business hours are Monday through Friday, 9 AM to 5 PM Eastern time.",
  "text": "Our business hours are Monday through Friday, 9 AM to 5 PM Eastern time."
}
```

ElevenLabs then speaks this text back to the caller.

## Key Features

| Feature | How It Works |
|---------|--------------|
| **RAG Knowledge Base** | Searches Qdrant vector store before answering |
| **Conversation Memory** | Remembers context within the same call (by conversation_id) |
| **Natural Responses** | System prompt ensures conversational, phone-friendly answers |
| **Fast LLM** | Uses Gemini 1.5 Flash for quick responses |

## Customization

### Change the AI Model

In **Google Gemini Chat Model** node:
- `gemini-1.5-flash` - Fast (recommended for voice)
- `gemini-1.5-pro` - More capable but slower

### Adjust the System Prompt

In **Generate Answer from Knowledge Base** node, modify the system message to match your use case:

```
You are a helpful voice assistant for [Your Company].
Your responses will be spoken aloud to callers.
...
```

### Change Number of Retrieved Documents

In **Vector Store Tool** node, adjust `topK` (default: 5).

## Troubleshooting

### No Response to Caller
1. Check n8n execution logs for errors
2. Verify webhook URL is correct in ElevenLabs
3. Ensure workflow is **Active**

### Wrong or Generic Answers
1. Verify Qdrant collection name is correct
2. Check that your knowledge base has relevant data
3. Ensure embeddings model matches what you used to index

### Memory Not Working
- Verify ElevenLabs sends a consistent `conversation_id` for the same call

### Slow Responses
- Consider using `gemini-1.5-flash` instead of `pro`
- Reduce `topK` in Vector Store Tool
- Check Qdrant instance performance

## Testing

You can test the webhook manually:

```bash
curl -X POST https://your-n8n-instance.com/webhook/elevenlabs-voice-agent \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is your return policy?",
    "conversation_id": "test-123"
  }'
```

Expected response:
```json
{
  "response": "Our return policy allows returns within 30 days of purchase...",
  "text": "Our return policy allows returns within 30 days of purchase..."
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ElevenLabs Voice Agent                   │
│  (Handles phone calls, speech-to-text, text-to-speech)      │
└─────────────────────────┬───────────────────────────────────┘
                          │ POST webhook
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      n8n Workflow                           │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐   │
│  │ Webhook  │→ │ Extract │→ │ AI Agent │→ │  Respond    │   │
│  └──────────┘  └─────────┘  └────┬─────┘  └─────────────┘   │
│                                  │                          │
│                    ┌─────────────┼─────────────┐            │
│                    │             │             │            │
│                    ▼             ▼             ▼            │
│               ┌────────┐   ┌─────────┐   ┌──────────┐       │
│               │ Gemini │   │ Memory  │   │ KB Tool  │       │
│               └────────┘   └─────────┘   └────┬─────┘       │
│                                               │             │
│                                               ▼             │
│                                         ┌──────────┐        │
│                                         │  Qdrant  │        │
│                                         └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```
