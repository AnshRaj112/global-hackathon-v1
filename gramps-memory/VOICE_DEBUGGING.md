# Voice Recording Debugging Guide

If voice recording is not working after you stop recording, follow these steps to debug the issue:

## 1. Check Browser Console

Open your browser's developer tools (F12) and look at the console for any error messages. The voice feature now includes extensive logging:

- `"Initializing speech recognition..."` - Speech recognition is being set up
- `"Starting voice recording..."` - Recording has started
- `"Speech recognition started"` - Speech recognition is active
- `"Speech recognition result:"` - Speech was detected and transcribed
- `"Transcribed text:"` - The actual text that was recognized
- `"Speech recognition ended"` - Recording has stopped

## 2. Check Browser Compatibility

The voice feature requires a modern browser with Web Speech API support:

**✅ Supported:**
- Chrome (recommended)
- Safari (macOS/iOS)
- Edge (Chromium-based)

**❌ Not Supported:**
- Firefox (limited support)
- Internet Explorer
- Older browsers

## 3. Check Microphone Permissions

1. Look for a microphone icon in your browser's address bar
2. Click on it and ensure "Allow" is selected
3. If blocked, click "Allow" and refresh the page

## 4. Test Microphone

1. Go to any voice recording website (like voice.google.com)
2. Try recording something there
3. If it doesn't work there, the issue is with your microphone setup

## 5. Check Network Connection

Voice recognition requires an internet connection. Ensure you have a stable connection.

## 6. Common Issues and Solutions

### Issue: "Speech recognition not supported in this browser"
**Solution:** Use Chrome, Safari, or Edge instead of Firefox

### Issue: "Microphone not accessible"
**Solution:** 
1. Check microphone permissions
2. Ensure no other app is using the microphone
3. Try refreshing the page

### Issue: "No speech detected"
**Solution:**
1. Speak louder and more clearly
2. Check if your microphone is working
3. Try speaking closer to the microphone

### Issue: Recording starts but nothing happens when you stop
**Solution:**
1. Check the console for error messages
2. Ensure you're speaking clearly during recording
3. Try speaking for at least 2-3 seconds
4. Check if the Gemini API key is set correctly

## 7. Debug Steps

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Start a voice conversation**
4. **Click "Start Recording"**
5. **Speak clearly for 3-5 seconds**
6. **Click "Stop Recording"**
7. **Check console for messages**

You should see:
```
Starting voice recording...
Speech recognition started
Speech recognition result: [object]
Transcribed text: [your spoken words]
Speech recognition ended
```

## 8. Test with Simple Words

Try recording simple, clear words like:
- "Hello"
- "Test"
- "Memory"

## 9. Check API Configuration

Ensure your `.env.local` file has the correct Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## 10. Restart the Development Server

After making changes to environment variables:

```bash
npm run dev
```

## Still Having Issues?

If the problem persists:

1. **Check the console** for specific error messages
2. **Try a different browser** (Chrome recommended)
3. **Test on a different device** if possible
4. **Verify your microphone** works in other applications
5. **Check your internet connection**

The voice feature includes automatic timeout (10 seconds) and better error handling, so it should work more reliably now.
