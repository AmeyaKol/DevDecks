export const getWordData = async (req, res) => {
  const { word } = req.query;
  if (!word) return res.status(400).json({ error: 'Word is required' });

  try {
    console.log(`Looking up word: ${word}`);
    
    // Use Free Dictionary API instead of google-dictionary-api
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Word not found' });
      }
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Dictionary API result:', result);
    
    if (!result || !result.length) {
      return res.status(404).json({ error: 'Word not found' });
    }

    const entry = result[0];
    
    // Get the first meaning
    const meanings = entry.meanings || [];
    if (!meanings.length) {
      return res.status(404).json({ error: 'No definitions found' });
    }
    
    const firstMeaning = meanings[0];
    const firstDefinition = firstMeaning.definitions?.[0];
    
    if (!firstDefinition) {
      return res.status(404).json({ error: 'No definitions found' });
    }
    
    // Collect all synonyms from all meanings
    let allSynonyms = [];
    meanings.forEach(meaning => {
      meaning.definitions.forEach(def => {
        if (def.synonyms) {
          allSynonyms = allSynonyms.concat(def.synonyms);
        }
      });
      if (meaning.synonyms) {
        allSynonyms = allSynonyms.concat(meaning.synonyms);
      }
    });
    
    // Remove duplicates
    allSynonyms = [...new Set(allSynonyms)];

    const responseData = {
      word: entry.word,
      definition: firstDefinition.definition,
      example: firstDefinition.example || '',
      synonyms: allSynonyms,
      phonetic: entry.phonetic || (entry.phonetics?.[0]?.text) || '',
      origin: entry.origin || '',
      partOfSpeech: firstMeaning.partOfSpeech || ''
    };

    console.log('Sending response:', responseData);
    res.json(responseData);
  } catch (err) {
    console.error('Dictionary API error:', err);
    res.status(500).json({ error: 'Failed to fetch word data' });
  }
}; 