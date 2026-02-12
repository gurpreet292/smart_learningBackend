const { google } = require('googleapis');
const axios = require('axios');

class TranscriptService {
  /**
   * Extract video ID from YouTube URL
   */
  static extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    throw new Error('Invalid YouTube URL');
  }

  /**
   * Fetch captions using YouTube Data API v3
   * Note: This uses the timedtext endpoint with the API key for validation
   */
  static async fetchWithYouTubeAPI(videoId) {
    try {
      console.log('🔍 Attempting: YouTube Data API v3 + TimedText');
      
      if (!process.env.YOUTUBE_API_KEY) {
        console.log('⚠️ No YouTube API key configured');
        return null;
      }

      // Use YouTube Data API to get video details and verify access
      const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
      });

      // Get video details to verify it's accessible
      const videoResponse = await youtube.videos.list({
        part: 'snippet,contentDetails',
        id: videoId
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        console.log('⚠️ Video not found or not accessible');
        return null;
      }

      const videoTitle = videoResponse.data.items[0].snippet.title;
      console.log(`   Video found: ${videoTitle.substring(0, 50)}...`);

      // Try to fetch timedtext captions directly with verified video
      // This approach works because we've verified the video exists
      try {
        const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
        const captionResponse = await axios.get(timedTextUrl);
        
        if (captionResponse.data && captionResponse.data.length > 100) {
          // Parse the response (it's XML or JSON depending on fmt)
          const text = this.parseTimedTextResponse(captionResponse.data);
          console.log(`✅ YouTube API + TimedText SUCCESS - Length: ${text.length} chars`);
          return {
            text: text,
            segments: []
          };
        }
      } catch (timedTextError) {
        console.log(`⚠️ TimedText direct fetch failed: ${timedTextError.message}`);
      }

      return null;
    } catch (error) {
      console.log(`⚠️ YouTube API failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse timedtext API response
   */
  static parseTimedTextResponse(data) {
    // Try to parse as XML first
    const textMatches = data.matchAll(/<text[^>]*>(.*?)<\/text>/g);
    const segments = [];
    
    for (const match of textMatches) {
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '');
      
      if (text.trim()) {
        segments.push(text.trim());
      }
    }
    
    return segments.join(' ');
  }

  /**
   * Parse SRT subtitle format
   */
  static parseSRT(srtContent) {
    const lines = srtContent.split('\n');
    const textLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip sequence numbers, timestamps, and empty lines
      if (line && !line.match(/^\d+$/) && !line.match(/\d{2}:\d{2}:\d{2}/)) {
        textLines.push(line);
      }
    }
    
    return textLines.join(' ');
  }

  /**
   * Fetch using timedtext API (YouTube's subtitle endpoint)
   */
  static async fetchWithTimedText(videoId) {
    try {
      console.log('🔍 Attempting: YouTube TimedText API');
      console.log(`   Video ID: ${videoId}`);
      
      // Get video page to extract caption tracks
      const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`   Fetching: ${videoPageUrl}`);
      const response = await axios.get(videoPageUrl);
      const html = response.data;
      console.log(`   Page length: ${html.length} bytes`);
      
      // Extract player response which contains fresh caption URLs
      const playerResponseMatch = html.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/);
      if (!playerResponseMatch) {
        console.log('⚠️ No player response found in video page');
        return null;
      }
      
      let captionTracks;
      try {
        const playerData = JSON.parse(playerResponseMatch[1]);
        
        if (!playerData.captions || !playerData.captions.playerCaptionsTracklistRenderer) {
          console.log('⚠️ No captions in player response');
          return null;
        }
        
        captionTracks = playerData.captions.playerCaptionsTracklistRenderer.captionTracks;
        
        if (!captionTracks || captionTracks.length === 0) {
          console.log('⚠️ No caption tracks in player response');
          return null;
        }
        
        console.log(`   Found ${captionTracks.length} caption tracks`);
      } catch (parseError) {
        console.log(`⚠️ Failed to parse player response: ${parseError.message}`);
        return null;
      }
      
      // Find English track
      const englishTrack = captionTracks.find(track => 
        track.languageCode === 'en' || 
        track.languageCode.startsWith('en-')
      );
      
      if (!englishTrack) {
        console.log('⚠️ No English captions in tracks');
        return null;
      }
      
      // Fetch the caption file
      const captionResponse = await axios.get(englishTrack.baseUrl);
      const captionXML = captionResponse.data;
      
      // Parse XML to extract text
      const textMatches = captionXML.matchAll(/<text[^>]*>(.*?)<\/text>/g);
      const segments = [];
      
      for (const match of textMatches) {
        const text = match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/<[^>]+>/g, ''); // Remove HTML tags
        
        if (text.trim()) {
          segments.push(text.trim());
        }
      }
      
      const fullText = segments.join(' ');
      
      if (fullText.length > 100) {
        console.log(`✅ TimedText API SUCCESS - Length: ${fullText.length} chars`);
        return {
          text: fullText,
          segments: segments.map(text => ({ text }))
        };
      }
      
      return null;
    } catch (error) {
      console.log(`⚠️ TimedText API failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch transcript from YouTube video with multiple methods
   */
  static async fetchTranscript(videoUrl) {
    try {
      const videoId = this.extractVideoId(videoUrl);
      console.log(`\n📹 Processing video ID: ${videoId}`);
      console.log(`🔗 URL: ${videoUrl}`);
      
      let result = null;
      
      // Method 1: YouTube TimedText API (most reliable, no key needed)
      result = await this.fetchWithTimedText(videoId);
      
      // Method 2: YouTube Data API v3 (requires API key)
      if (!result) {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (apiKey && apiKey !== 'optional-youtube-data-api-v3-key-for-captions' && !apiKey.includes('XXXXX')) {
          result = await this.fetchWithYouTubeAPI(videoId);
        }
      }
      
      // If all methods failed
      if (!result || !result.text || result.text.length < 50) {
        console.error('❌ All transcript methods failed');
        
        // Check if valid API key is configured
        const apiKey = process.env.YOUTUBE_API_KEY;
        const hasValidKey = apiKey && 
                           apiKey !== 'optional-youtube-data-api-v3-key-for-captions' && 
                           !apiKey.includes('XXXXX') &&
                           !apiKey.includes('your-api-key');
        
        if (!hasValidKey) {
          throw new Error(
            '❌ YouTube API Key Required\n\n' +
            'YouTube blocks automated transcript access. You MUST configure a YouTube Data API v3 key.\n\n' +
            'Quick Setup (5 minutes):\n' +
            '1. Get FREE API key: https://console.cloud.google.com/\n' +
            '2. Enable YouTube Data API v3\n' +
            '3. Create Credentials → API Key\n' +
            '4. Add to backend/.env: YOUTUBE_API_KEY=AIzaSy...\n' +
            '5. Restart this server\n\n' +
            'See YOUTUBE_API_SETUP.md for detailed guide.\n' +
            'Free tier: ~50 videos/day, no credit card required.'
          );
        }
        
        throw new Error(
          'Unable to extract captions. Possible reasons:\n' +
          '1. Video does not have captions/subtitles enabled\n' +
          '2. Video is private or age-restricted\n' +
          '3. Video is a live stream\n' +
          '4. Your YouTube API quota is exhausted (resets daily)\n' +
          '5. API key may be invalid or restricted'
        );
      }
      
      console.log(`\n🎉 SUCCESS! Transcript length: ${result.text.length} characters\n`);
      
      return {
        videoId,
        raw: result.text,
        segments: result.segments
      };
    } catch (error) {
      console.error('❌ Transcript fetch error:', error.message);
      throw error;
    }
  }

  /**
   * Clean and preprocess transcript text
   */
  static cleanTranscript(rawTranscript) {
    let cleaned = rawTranscript;

    // Remove multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove common filler words and repetitions
    const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally'];
    const fillerPattern = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
    cleaned = cleaned.replace(fillerPattern, '');

    // Remove special characters but keep punctuation
    cleaned = cleaned.replace(/[^\w\s.,!?'-]/g, '');

    // Fix spacing around punctuation
    cleaned = cleaned.replace(/\s+([.,!?])/g, '$1');
    cleaned = cleaned.replace(/([.,!?])(\w)/g, '$1 $2');

    // Remove excessive repetition of words
    cleaned = cleaned.replace(/\b(\w+)(\s+\1){2,}\b/gi, '$1');

    // Trim and normalize
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/\s+/g, ' ');

    return cleaned;
  }

  /**
   * Validate transcript quality
   */
  static validateTranscript(transcript) {
    if (!transcript || transcript.length < 100) {
      throw new Error('Transcript is too short or empty');
    }

    if (transcript.length > 500000) {
      throw new Error('Transcript is too long (max 500,000 characters)');
    }

    return true;
  }
}

module.exports = TranscriptService;
