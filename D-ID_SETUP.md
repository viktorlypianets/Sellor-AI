# D-ID Avatar Integration Setup

This document explains how to set up the D-ID avatar integration for the chat widget.

## Overview

The D-ID integration automatically generates talking avatar videos when users send messages to the AI chatbot. The generated video is displayed in a circular avatar next to the chat window.

## Setup Instructions

### 1. Get D-ID API Key

1. Sign up for a D-ID account at https://www.d-id.com/
2. Navigate to your API settings
3. Copy your API key

### 2. Configure Environment Variables

Add the following environment variable to your backend `.env` file:

```env
DID_API_KEY=your_d-id_api_key_here
```

### 3. How It Works

1. **User sends message**: When a user types a message and sends it
2. **AI generates response**: The system gets an AI response from OpenAI
3. **D-ID generates video**: The AI response is sent to D-ID to generate a talking avatar video
4. **Avatar displays**: The generated video is shown in a circular avatar next to the chat window
5. **Video auto-plays**: The video automatically plays and then hides when finished

### 4. Features

- **Automatic video generation**: Videos are generated for all AI responses
- **Circular avatar display**: Videos are displayed in a circular format next to the chat
- **Loading states**: Shows loading spinner while video is being generated
- **Error handling**: Gracefully handles D-ID API errors
- **Responsive design**: Avatar adapts to different screen sizes
- **Auto-hide**: Avatar automatically hides when video finishes playing

### 5. Configuration Options

The D-ID integration uses the following default settings:
- **Presenter ID**: `lily-ldwi8a_LdG` (female avatar)
- **Voice**: Microsoft French voice (`fr-FR-DeniseNeural`)
- **Video format**: MP4
- **Text limit**: 500 characters per video
- **Polling timeout**: 60 seconds (30 attempts × 2 seconds)

### 6. Troubleshooting

**Avatar not showing:**
- Check if `DID_API_KEY` is set in your environment variables
- Verify the API key is valid
- Check browser console for any errors

**Video not generating:**
- Ensure D-ID API key has sufficient credits
- Check network connectivity
- Verify the AI response is not empty

**Performance issues:**
- Video generation can take 10-30 seconds
- Consider implementing a queue system for high-traffic scenarios

### 7. Customization

To customize the avatar appearance or voice, modify the D-ID API parameters in `backend/routes/chatRoutes.js`:

```javascript
{
  presenter_id: "lily-ldwi8a_LdG", // Change avatar
  script: {
    provider: {
      type: "microsoft",
      voice_id: "fr-FR-DeniseNeural", // Change voice
    },
    input: aiResponse.substring(0, 500), // Adjust text length
  }
}
```

### 8. Cost Considerations

- D-ID charges per video generation
- Each AI response triggers one video generation
- Consider implementing rate limiting for cost control
- Monitor your D-ID usage dashboard

## Files Modified

- `backend/routes/chatRoutes.js` - Added D-ID API integration
- `frontend/src/components/Avatar.jsx` - New avatar component
- `frontend/src/components/Avatar.css` - Avatar styling
- `frontend/src/components/ChatWidget.jsx` - Integrated avatar display 