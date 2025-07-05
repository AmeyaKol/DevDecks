export const getWordData = async (req, res) => {
  const { word } = req.query;
  if (!word) return res.status(400).json({ error: 'Word is required' });

  const apiKey = process.env.DICTIONARY_KEY;
  if (!apiKey) {
    console.error('Merriam-Webster API key not found in environment variables');
    return res.status(500).json({ error: 'Dictionary service not configured' });
  }

  try {
    // console.log(`Looking up word: ${word}`);
    
    // Using Merriam-Webster's Collegiate Dictionary API
    const response = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(word)}?key=${apiKey}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Word not found' });
      }
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    // console.log('Merriam-Webster API result:', data);
    
    // Merriam-Webster returns an array, we want the first result
    if (!data || data.length === 0 || typeof data[0] === 'string') {
      return res.status(404).json({ error: 'Word not found in dictionary' });
    }

    const entry = data[0]; // First entry
    
    // Extract definition from the first sense
    let definition = '';
    let example = '';
    let etymology = '';
    let synonyms = [];

    // Get definition from shortdef (simpler) or full definition
    if (entry.shortdef && entry.shortdef.length > 0) {
      definition = entry.shortdef[0];
    } else if (entry.def && entry.def.length > 0) {
      // Parse complex definition structure
      const defSection = entry.def[0];
      if (defSection.sseq && defSection.sseq.length > 0) {
        const firstSense = defSection.sseq[0][0];
        if (firstSense && firstSense[1] && firstSense[1].dt) {
          // Extract text from defining text
          const dt = firstSense[1].dt;
          for (const item of dt) {
            if (item[0] === 'text') {
              definition = item[1].replace(/\{.*?\}/g, '').trim();
              break;
            }
          }
        }
      }
    }

    // Get example from verbal illustrations
    if (entry.def && entry.def.length > 0) {
      const defSection = entry.def[0];
      if (defSection.sseq && defSection.sseq.length > 0) {
        const firstSense = defSection.sseq[0][0];
        if (firstSense && firstSense[1] && firstSense[1].dt) {
          const dt = firstSense[1].dt;
          for (const item of dt) {
            if (item[0] === 'vis' && item[1] && item[1].length > 0) {
              example = item[1][0].t.replace(/\{.*?\}/g, '').trim();
              break;
            }
          }
        }
      }
    }

    // Get etymology
    if (entry.et) {
      etymology = entry.et[0][1].replace(/\{.*?\}/g, '').trim();
    }

    // Get synonyms from syns section
    if (entry.syns && entry.syns.length > 0) {
      const synSection = entry.syns[0];
      if (synSection.pt && synSection.pt.length > 0) {
        // Extract synonyms from the synonym discussion
        const pt = synSection.pt;
        for (const item of pt) {
          if (item[0] === 'text') {
            const text = item[1];
            // Look for words in small caps (synonyms)
            const synMatches = text.match(/\{sc\}(.*?)\{\/sc\}/g);
            if (synMatches) {
              synonyms = synMatches.map(match => 
                match.replace(/\{sc\}(.*?)\{\/sc\}/, '$1').toLowerCase()
              );
            }
            break;
          }
        }
      }
    }

    const responseData = {
      word: entry.meta?.id?.split(':')[0] || word,
      definition: definition || 'No definition available',
      example: example || 'No example sentence available',
      origin: etymology || 'No etymology information available',
      synonyms: synonyms.length > 0 ? synonyms : ['No synonyms available']
    };

    // console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Dictionary API error:', err);
    res.status(500).json({ error: 'Failed to fetch word data' });
  }
}; 