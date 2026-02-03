# Voice Agent - n8n Workflow with Claude AI & Eleven Labs

A conversational voice agent workflow for n8n that uses **Claude AI** as the brain and **Eleven Labs** for realistic text-to-speech synthesis.

## Overview

This project provides ready-to-import n8n workflows that create a voice assistant capable of:

- Receiving audio input via webhook
- Transcribing speech to text using OpenAI Whisper
- Processing the text through Claude AI for intelligent responses
- Converting Claude's response to natural speech using Eleven Labs
- Returning audio response to the caller

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Voice Agent Workflow                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  Webhook │───▶│  Whisper │───▶│  Claude  │───▶│  Eleven Labs │  │
│  │  (Audio) │    │   STT    │    │    AI    │    │     TTS      │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘  │
│       │                                                │             │
│       │                                                ▼             │
│       │                                         ┌──────────┐        │
│       └────────────────────────────────────────▶│  Audio   │        │
│                                                 │ Response │        │
│                                                 └──────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before setting up the workflow, you'll need:

1. **n8n instance** - Self-hosted or cloud version
2. **Anthropic API Key** - Get one from [Anthropic Console](https://console.anthropic.com/)
3. **Eleven Labs API Key** - Get one from [Eleven Labs](https://elevenlabs.io/app/settings/api-keys)
4. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys) (for Whisper STT)

## Quick Start

### 1. Import the Workflow

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Select one of the workflow files:
   - `workflows/voice-agent-workflow.json` - Basic voice-to-voice workflow
   - `workflows/voice-agent-text-fallback.json` - Supports both audio and text input

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

### 3. Update Node Credentials

After importing, open each node and assign the corresponding credentials you just created.

### 4. Activate the Workflow

Click **Activate** to enable the webhook endpoint.

## Workflows

### voice-agent-workflow.json

The basic voice agent workflow with the following nodes:

| Node | Purpose |
|------|---------|
| Voice Agent Webhook | Receives POST requests with audio |
| Set Conversation Metadata | Extracts conversation ID and timestamp |
| Has Audio Input? | Validates audio is present |
| Speech to Text (Whisper) | Transcribes audio to text |
| Claude AI Brain | Processes text and generates response |
| Eleven Labs TTS | Converts response to speech |
| Respond with Audio | Returns audio to caller |

### voice-agent-text-fallback.json

Enhanced workflow that supports both audio and text input:

- Send audio for full voice-to-voice experience
- Send JSON with `message` field for text-to-voice
- Set `X-Response-Format: text` header for text-only response

## API Usage

### Voice Input (Audio)

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent' \
  -H 'Content-Type: audio/wav' \
  --data-binary @your-audio-file.wav \
  --output response.mp3
```

### Text Input (v2 workflow)

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello, how are you today?"}' \
  --output response.mp3
```

### Text Response (v2 workflow)

```bash
curl -X POST \
  'http://localhost:5678/webhook/voice-agent-v2' \
  -H 'Content-Type: application/json' \
  -H 'X-Response-Format: text' \
  -d '{"message": "What is the weather like?"}'
```

Response:
```json
{
  "response": "I don't have access to real-time weather data, but I'd be happy to help you find that information! You could check a weather app or website for your location.",
  "model": "claude-sonnet-4-20250514",
  "timestamp": "2026-02-03T12:00:00.000Z"
}
```

## Configuration Options

### Claude AI Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Model | claude-sonnet-4-20250514 | Claude model to use |
| Max Tokens | 500 | Maximum response length |
| Temperature | 0.7 | Response creativity (0-1) |

### Eleven Labs Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Voice ID | 21m00Tcm4TlvDq8ikWAM | Voice to use (Rachel) |
| Model | eleven_multilingual_v2 | TTS model |
| Stability | 0.5 | Voice stability (0-1) |
| Similarity Boost | 0.75 | Voice similarity (0-1) |
| Style | 0.5 | Speaking style intensity |
| Output Format | mp3_44100_128 | Audio format |

### Available Eleven Labs Voices

| Voice | ID | Description |
|-------|-----|-------------|
| Rachel | 21m00Tcm4TlvDq8ikWAM | Calm, clear female |
| Domi | AZnzlk1XvdvUeBnXmlld | Strong, confident female |
| Bella | EXAVITQu4vr4xnSDxMaL | Soft, gentle female |
| Antoni | ErXwobaYiN019PkySvjV | Well-rounded male |
| Josh | TxGEqnHWrfWFTfGW9XjX | Deep, narrative male |
| Arnold | VR6AewLTigWG4xSOukaG | Crisp, bold male |

## Customizing the System Prompt

The Claude AI node includes a system prompt that defines the assistant's behavior. To customize:

1. Open the **Claude AI Brain** node
2. Modify the **System Message** in the options
3. Save the workflow

Current system prompt focuses on:
- Concise responses for voice output
- Natural, conversational language
- Friendly and engaging tone
- Clarity for spoken delivery

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

### Webhook not accessible

- Verify n8n is running and accessible
- Check firewall settings
- Ensure workflow is activated

## File Structure

```
├── README.md
├── .env.example
└── workflows/
    ├── voice-agent-workflow.json
    └── voice-agent-text-fallback.json
```

## License

MIT License - Feel free to use and modify for your projects.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
