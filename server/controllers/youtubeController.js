import axios from 'axios';

// Helper to extract playlist ID from URL
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Helper to extract video ID from various YouTube URL formats
function extractVideoId(url) {
  // Match youtube.com/watch?v=VIDEO_ID
  let match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Match youtu.be/VIDEO_ID
  match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  // Match youtube.com/embed/VIDEO_ID
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  
  return null;
}

// Parse chapters/timestamps from video description
function parseChaptersFromDescription(description) {
  if (!description) return [];
  
  const chapters = [];
  const lines = description.split('\n');
  
  // Multiple regex patterns to match various timestamp formats
  // Pattern 1: 0:00 Title or 00:00 Title or 0:00:00 Title
  const patterns = [
    /^(\d{1,2}):(\d{2}):(\d{2})\s+[-–—]?\s*(.+)$/,  // HH:MM:SS Title or HH:MM:SS - Title
    /^(\d{1,2}):(\d{2})\s+[-–—]?\s*(.+)$/,           // MM:SS Title or MM:SS - Title
    /^\[(\d{1,2}):(\d{2}):(\d{2})\]\s*(.+)$/,        // [HH:MM:SS] Title
    /^\[(\d{1,2}):(\d{2})\]\s*(.+)$/,                // [MM:SS] Title
    /^(\d{1,2}):(\d{2}):(\d{2})\s*-\s*(.+)$/,        // HH:MM:SS - Title
    /^(\d{1,2}):(\d{2})\s*-\s*(.+)$/,                // MM:SS - Title
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    let matched = false;
    
    // Try HH:MM:SS format
    let match = trimmedLine.match(patterns[0]);
    if (match) {
      const hours = match[1];
      const minutes = match[2];
      const seconds = match[3];
      const title = match[4].trim();
      
      if (title) {
        chapters.push({
          timestamp: `${hours}:${minutes}:${seconds}`,
          title,
        });
        matched = true;
      }
    }
    
    // Try MM:SS format
    if (!matched) {
      match = trimmedLine.match(patterns[1]);
      if (match) {
        const minutes = match[1];
        const seconds = match[2];
        const title = match[3].trim();
        
        if (title) {
          chapters.push({
            timestamp: `${minutes}:${seconds}`,
            title,
          });
          matched = true;
        }
      }
    }
    
    // Try [HH:MM:SS] format
    if (!matched) {
      match = trimmedLine.match(patterns[2]);
      if (match) {
        const hours = match[1];
        const minutes = match[2];
        const seconds = match[3];
        const title = match[4].trim();
        
        if (title) {
          chapters.push({
            timestamp: `${hours}:${minutes}:${seconds}`,
            title,
          });
          matched = true;
        }
      }
    }
    
    // Try [MM:SS] format
    if (!matched) {
      match = trimmedLine.match(patterns[3]);
      if (match) {
        const minutes = match[1];
        const seconds = match[2];
        const title = match[3].trim();
        
        if (title) {
          chapters.push({
            timestamp: `${minutes}:${seconds}`,
            title,
          });
        }
      }
    }
  }
  
  return chapters;
}

// Fetch video metadata from YouTube API
async function fetchVideoMetadata(videoId, apiKey) {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', apiKey);
  
  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`YouTube API responded with status: ${resp.status}`);
  
  const data = await resp.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }
  
  const video = data.items[0];
  const description = video.snippet.description || '';
  const chapters = parseChaptersFromDescription(description);
  
  console.log(`[DEBUG] Video: ${video.snippet.title}`);
  console.log(`[DEBUG] Found ${chapters.length} chapters in description`);
  if (chapters.length > 0) {
    console.log(`[DEBUG] First chapter:`, chapters[0]);
  }
  
  return {
    videoId: video.id,
    title: video.snippet.title,
    description: description,
    channelTitle: video.snippet.channelTitle,
    duration: video.contentDetails.duration, // ISO 8601 duration format
    thumbnailUrl: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
    chapters: chapters, // Parsed chapters from description
  };
}

// Fetch all videos in a playlist (handle pagination) using fetch
async function fetchPlaylistVideosWithFetch(playlistId, apiKey) {
  let videos = [];
  let nextPageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('key', apiKey);
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);
    const resp = await fetch(url.toString());
    if (!resp.ok) throw new Error(`YouTube API responded with status: ${resp.status}`);
    const data = await resp.json();
    const items = data.items || [];
    videos = videos.concat(
      items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}&list=${playlistId}`,
      }))
    );
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return videos;
}

// Accepts both POST (body) and GET (query) for playlistUrl
export const importYoutubePlaylist = async (req, res) => {
  try {
    const playlistUrl = req.body?.playlistUrl || req.query?.playlistUrl;
    if (!playlistUrl) return res.status(400).json({ error: 'playlistUrl is required' });
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) return res.status(400).json({ error: 'Invalid playlist URL' });
    const apiKey = process.env.YOUTUBE_API_KEY;

    const debugInfo = {
      controllerReached: true,
      apiKeyLoaded: !!apiKey,
      timestamp: new Date().toISOString(),
      usedFetch: true,
      method: req.method,
    };

    if (!apiKey) {
      return res.status(500).json({
        error: 'YouTube API key not configured on server.',
        debug: debugInfo
      });
    }

    const videos = await fetchPlaylistVideosWithFetch(playlistId, apiKey);
    res.json({ playlistId, videos, debug: debugInfo });
  } catch (err) {
    const debugError = {
      message: err.message,
      apiKeyLoaded: !!process.env.YOUTUBE_API_KEY,
      axiosResponse: err.response ? {
        status: err.response.status,
        data: err.response.data,
      } : 'No response from YouTube API. Check for network issues or API key restrictions.',
    };

    res.status(500).json({
      error: 'Failed to import playlist. See debug info for details.',
      debug: debugError,
    });
  }
};

export const testApiKey = (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    res.status(200).json({
      message: 'Test successful!',
      apiKeyStatus: 'YOUTUBE_API_KEY was found on the server.',
      firstChars: apiKey.substring(0, 4) + '...'
    });
  } else {
    res.status(404).json({
      message: 'Test failed.',
      apiKeyStatus: 'YOUTUBE_API_KEY was NOT found on the server.'
    });
  }
};

// Validate single YouTube video URL (reject playlists)
export const validateYoutubeVideo = async (req, res) => {
  try {
    const videoUrl = req.body?.videoUrl || req.query?.videoUrl;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' });
    }
    
    // Check if URL contains playlist parameter - reject it
    if (videoUrl.includes('list=')) {
      return res.status(400).json({ 
        error: 'Playlist URLs are not supported for split cards. Please use a single video URL.',
        isPlaylist: true
      });
    }
    
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube video URL' });
    }
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // If API key is available, fetch video metadata
    if (apiKey) {
      try {
        const metadata = await fetchVideoMetadata(videoId, apiKey);
        return res.json({
          videoId: metadata.videoId,
          title: metadata.title,
          channelTitle: metadata.channelTitle,
          duration: metadata.duration,
          thumbnailUrl: metadata.thumbnailUrl,
          chapters: metadata.chapters || [], // Include parsed chapters
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        });
      } catch (apiError) {
        // If API call fails, fall back to basic response
        console.error('YouTube API error:', apiError.message);
      }
    }
    
    // Fallback: return basic info without API call
    return res.json({
      videoId,
      title: null, // Will need to be provided by user
      chapters: [], // No chapters available without API
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
    
  } catch (err) {
    console.error('Error validating YouTube video:', err);
    res.status(500).json({
      error: 'Failed to validate video URL',
      details: err.message,
    });
  }
};