/**
 * YouTube Transcript Service
 * 
 * Extracts transcripts from YouTube videos using the youtube-transcript package.
 * Supports filtering by time range for specific video segments.
 */

import { YoutubeTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';

/**
 * Extract video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractVideoId(url) {
    if (!url) return null;
    
    // Match youtube.com/watch?v=VIDEO_ID
    let match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // Match youtu.be/VIDEO_ID
    match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // Match youtube.com/embed/VIDEO_ID
    match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    // If it looks like just a video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
    }
    
    return null;
}

/**
 * Format seconds to timestamp string (MM:SS or HH:MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse timestamp string to seconds
 * @param {string} timestamp - Timestamp in MM:SS or HH:MM:SS format
 * @returns {number} Time in seconds
 */
export function parseTimestamp(timestamp) {
    const parts = timestamp.split(':').reverse();
    let seconds = 0;
    
    if (parts[0]) seconds += parseInt(parts[0], 10);      // seconds
    if (parts[1]) seconds += parseInt(parts[1], 10) * 60; // minutes
    if (parts[2]) seconds += parseInt(parts[2], 10) * 3600; // hours
    
    return seconds;
}

/**
 * Fetch full transcript for a YouTube video
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {Promise<Array>} Array of transcript segments
 */
export async function getFullTranscript(videoIdOrUrl) {
    const videoId = extractVideoId(videoIdOrUrl) || videoIdOrUrl;
    
    if (!videoId) {
        throw new Error('Invalid YouTube video ID or URL');
    }
    
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
            throw new Error('No transcript available for this video');
        }
        
        // Format the transcript segments
        return transcript.map(segment => ({
            text: segment.text,
            startTime: segment.offset / 1000, // Convert ms to seconds
            duration: segment.duration / 1000,
            timestamp: formatTimestamp(segment.offset / 1000),
        }));
        
    } catch (error) {
        if (error.message.includes('Transcript is disabled')) {
            throw new Error('Transcript is disabled for this video');
        }
        if (error.message.includes('Video unavailable')) {
            throw new Error('Video is unavailable or does not exist');
        }
        throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
}

/**
 * Get transcript for a specific time range
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @param {number} startTime - Start time in seconds
 * @param {number} endTime - End time in seconds (optional, defaults to end of video)
 * @returns {Promise<Object>} Transcript data for the segment
 */
export async function getTranscriptSegment(videoIdOrUrl, startTime = 0, endTime = Infinity) {
    const fullTranscript = await getFullTranscript(videoIdOrUrl);
    
    // Filter segments within the time range
    const segments = fullTranscript.filter(segment => {
        const segmentEnd = segment.startTime + segment.duration;
        return segment.startTime >= startTime && segmentEnd <= endTime;
    });
    
    if (segments.length === 0) {
        // Try a more lenient filter - include segments that overlap
        const overlappingSegments = fullTranscript.filter(segment => {
            const segmentEnd = segment.startTime + segment.duration;
            return segmentEnd > startTime && segment.startTime < endTime;
        });
        
        if (overlappingSegments.length === 0) {
            throw new Error(`No transcript segments found between ${formatTimestamp(startTime)} and ${formatTimestamp(endTime)}`);
        }
        
        return {
            segments: overlappingSegments,
            text: overlappingSegments.map(s => s.text).join(' '),
            startTime,
            endTime: endTime === Infinity ? overlappingSegments[overlappingSegments.length - 1].startTime : endTime,
        };
    }
    
    return {
        segments,
        text: segments.map(s => s.text).join(' '),
        startTime: segments[0].startTime,
        endTime: segments[segments.length - 1].startTime + segments[segments.length - 1].duration,
    };
}

/**
 * Get transcript with timestamps formatted for notes
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {Promise<string>} Formatted transcript with timestamps
 */
export async function getFormattedTranscript(videoIdOrUrl) {
    const transcript = await getFullTranscript(videoIdOrUrl);
    
    // Group segments into logical chunks (every ~30 seconds)
    const chunks = [];
    let currentChunk = { startTime: 0, text: [] };
    
    for (const segment of transcript) {
        if (segment.startTime - currentChunk.startTime > 30 && currentChunk.text.length > 0) {
            chunks.push({
                timestamp: formatTimestamp(currentChunk.startTime),
                text: currentChunk.text.join(' '),
            });
            currentChunk = { startTime: segment.startTime, text: [] };
        }
        currentChunk.text.push(segment.text);
    }
    
    // Don't forget the last chunk
    if (currentChunk.text.length > 0) {
        chunks.push({
            timestamp: formatTimestamp(currentChunk.startTime),
            text: currentChunk.text.join(' '),
        });
    }
    
    // Format as markdown with timestamps
    return chunks.map(chunk => `[${chunk.timestamp}] ${chunk.text}`).join('\n\n');
}

/**
 * Search transcript for specific keywords
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching segments with context
 */
export async function searchTranscript(videoIdOrUrl, query) {
    const transcript = await getFullTranscript(videoIdOrUrl);
    const queryLower = query.toLowerCase();
    
    const matches = [];
    
    for (let i = 0; i < transcript.length; i++) {
        if (transcript[i].text.toLowerCase().includes(queryLower)) {
            // Include context (previous and next segments)
            const contextStart = Math.max(0, i - 1);
            const contextEnd = Math.min(transcript.length, i + 2);
            const contextSegments = transcript.slice(contextStart, contextEnd);
            
            matches.push({
                matchedSegment: transcript[i],
                context: contextSegments.map(s => s.text).join(' '),
                timestamp: transcript[i].timestamp,
                startTime: transcript[i].startTime,
            });
        }
    }
    
    return matches;
}

/**
 * Check if a video has transcript available
 * @param {string} videoIdOrUrl - YouTube video ID or URL
 * @returns {Promise<boolean>} True if transcript is available
 */
export async function hasTranscript(videoIdOrUrl) {
    try {
        const transcript = await getFullTranscript(videoIdOrUrl);
        return transcript && transcript.length > 0;
    } catch {
        return false;
    }
}

export default {
    extractVideoId,
    formatTimestamp,
    parseTimestamp,
    getFullTranscript,
    getTranscriptSegment,
    getFormattedTranscript,
    searchTranscript,
    hasTranscript,
};




