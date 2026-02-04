# n8n Voice AI Assistant Workflow

A complete voice-enabled AI assistant workflow that takes text queries and returns spoken audio responses powered by RAG (Retrieval-Augmented Generation).

## Workflow Overview

```
[Webhook] → [Extract Data] → [AI Agent + RAG] → [Prepare TTS] → [ElevenLabs] → [Audio Response]
```

## Nodes

| Node | Purpose |
|------|---------|
| **Webhook** | Receives POST requests with `query`, `voice_id`, `user_id` |
| **Extract Webhook Data** | Parses request body and provides defaults |
| **Generate Answer** | AI Agent with Qdrant RAG and conversation memory |
| **Prepare ElevenLabs Request** | Formats text and voice settings for TTS API |
| **ElevenLabs Text-to-Speech** | Converts text to audio (MP3) |
| **Respond to Webhook** | Returns audio blob to client |

## Setup Instructions

### 1. Import the Workflow

1. Open n8n
2. Go to **Workflows** → **Import from File**
3. Select `n8n-voice-ai-workflow.json`

### 2. Configure Credentials

You'll need to set up 4 credentials in n8n:

#### Google Gemini API
- Go to **Settings** → **Credentials** → **Add Credential**
- Select **Google Gemini API**
- Add your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Qdrant API
- Add **Qdrant API** credential
- Configure your Qdrant URL and API key

#### OpenAI API (for embeddings)
- Add **OpenAI API** credential
- Add your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

#### ElevenLabs API (HTTP Header Auth)
- Add **HTTP Header Auth** credential
- Name: `xi-api-key`
- Value: Your ElevenLabs API key from [ElevenLabs](https://elevenlabs.io/api)

### 3. Update Node References

After importing, update these nodes with your credential IDs:

1. **Google Gemini Chat Model** - Select your Gemini credential
2. **Qdrant Vector Store** - Select your Qdrant credential and update collection name
3. **OpenAI Embeddings** - Select your OpenAI credential
4. **ElevenLabs Text-to-Speech** - Select your ElevenLabs HTTP Header Auth credential

### 4. Configure Qdrant Collection

In the **Qdrant Vector Store** node, update `your-collection-name` to match your actual Qdrant collection.

### 5. Activate the Workflow

1. Click **Save**
2. Toggle the workflow to **Active**
3. Note your webhook URL (shown in the Webhook node)

## API Reference

### Endpoint

```
POST https://your-n8n-instance.com/webhook/voice-assistant
```

### Request Body

```json
{
  "query": "What is the return policy?",
  "voice_id": "EXAVITQu4vr4xnSDxMaL",
  "user_id": "user-123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | The question to ask |
| `voice_id` | string | No | ElevenLabs voice ID (default: Sarah) |
| `user_id` | string | No | User identifier for conversation memory |

### Response

- **Content-Type:** `audio/mpeg`
- **Body:** Binary MP3 audio data

## Popular ElevenLabs Voice IDs

| Voice | ID |
|-------|-----|
| Sarah | `EXAVITQu4vr4xnSDxMaL` |
| Rachel | `21m00Tcm4TlvDq8ikWAM` |
| Domi | `AZnzlk1XvdvUeBnXmlld` |
| Bella | `EXAVITQu4vr4xnSDxMaL` |
| Antoni | `ErXwobaYiN019PkySvjV` |
| Josh | `TxGEqnHWrfWFTfGW9XjX` |
| Arnold | `VR6AewLTigWG4xSOukaG` |
| Adam | `pNInz6obpgDQGcFmaJgB` |

## React Integration Example

```tsx
import { useState, useRef } from 'react';

const VoiceAssistant = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const askQuestion = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch('YOUR_N8N_WEBHOOK_URL/webhook/voice-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
          user_id: 'user-' + Date.now(), // Or use actual user ID
        }),
      });

      if (!response.ok) throw new Error('Request failed');

      // Create blob from audio response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="voice-assistant">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a question..."
        onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
      />
      <button onClick={askQuestion} disabled={isLoading}>
        {isLoading ? 'Thinking...' : 'Ask'}
      </button>
      <audio ref={audioRef} controls />
    </div>
  );
};

export default VoiceAssistant;
```

## Customization

### Change the AI Model

In the **Google Gemini Chat Model** node, you can switch to:
- `gemini-1.5-pro` - More capable, slower
- `gemini-1.5-flash` - Faster, good for most use cases

### Adjust Voice Settings

In the **Prepare ElevenLabs Request** node, modify:

```javascript
voice_settings: {
  stability: 0.5,        // 0-1: Lower = more expressive
  similarity_boost: 0.75, // 0-1: Higher = closer to original voice
  style: 0.0,            // 0-1: Style exaggeration
  use_speaker_boost: true // Enhance voice clarity
}
```

### Modify System Prompt

In the **Generate Answer** (AI Agent) node, update the system message to customize the assistant's personality and behavior.

### Adjust RAG Settings

In the **Vector Store Tool** node:
- `topK`: Number of documents to retrieve (default: 5)

## Troubleshooting

### CORS Issues
The workflow includes CORS headers (`Access-Control-Allow-Origin: *`). For production, restrict this to your domain.

### No Audio Response
1. Check ElevenLabs API key is valid
2. Verify the voice_id exists
3. Check n8n execution logs for errors

### Empty or Wrong Answers
1. Verify Qdrant collection has data
2. Check embeddings model matches your indexed data
3. Review the AI Agent's system prompt

### Memory Not Working
Ensure `user_id` is consistent across requests for the same user.

## License

MIT
