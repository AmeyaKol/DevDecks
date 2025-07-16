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
    if (!apiKey) return res.status(500).json({ error: 'YouTube API key not configured' });
    const videos = await fetchPlaylistVideos(playlistId, apiKey);
    res.json({ playlistId, videos });
  } catch (err) {
    console.error('YouTube playlist import error:', err.message);
    res.status(500).json({ error: 'Failed to import playlist', details: err.message });
  }
};