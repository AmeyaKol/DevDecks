import axios from 'axios';

// Helper to extract playlist ID from URL
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Fetch all videos in a playlist (handle pagination)
async function fetchPlaylistVideos(playlistId, apiKey) {
  let videos = [];
  let nextPageToken = '';
  do {
    const resp = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
      params: {
        part: 'snippet',
        maxResults: 50,
        playlistId,
        pageToken: nextPageToken,
        key: apiKey,
      },
    });
    const items = resp.data.items || [];
    videos = videos.concat(
      items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}&list=${playlistId}`,
      }))
    );
    nextPageToken = resp.data.nextPageToken;
  } while (nextPageToken);
  return videos;
}

export const importYoutubePlaylist = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    if (!playlistUrl) return res.status(400).json({ error: 'playlistUrl is required' });
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) return res.status(400).json({ error: 'Invalid playlist URL' });
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    // --- START DEBUG LOGS ---
    console.log(`[DEBUG] Attempting to import playlist. API Key Loaded: ${!!apiKey}`);
    if (!apiKey) {
      console.error('[DEBUG] YOUTUBE_API_KEY environment variable is not set on the server.');
    }
    // --- END DEBUG LOGS ---

    if (!apiKey) return res.status(500).json({ error: 'YouTube API key not configured' });
    const videos = await fetchPlaylistVideos(playlistId, apiKey);
    res.json({ playlistId, videos });
  } catch (err) {
    // --- START ENHANCED ERROR LOGGING ---
    console.error('[DEBUG] An error occurred during the YouTube API call.');
    if (err.response) {
      // The request was made and the server responded with a non-2xx status code
      console.error('[DEBUG] YouTube API Response Error Data:', JSON.stringify(err.response.data, null, 2));
      console.error('[DEBUG] YouTube API Response Status:', err.response.status);
    } else if (err.request) {
      // The request was made but no response was received
      console.error('[DEBUG] No response received from YouTube API. Request details:', err.request);
    } else {
      // Something happened in setting up the request
      console.error('[DEBUG] Error setting up the request to YouTube API:', err.message);
    }
    // --- END ENHANCED ERROR LOGGING ---
    res.status(500).json({ error: 'Failed to import playlist', details: err.message });
  }
};