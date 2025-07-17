import axios from 'axios';

// Helper to extract playlist ID from URL
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
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