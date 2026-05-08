# Module B — Topic Mining 


## Overview

Utilizing LLM to extract tpoics, assign node, edge realtionships. Further perform normalization, clustering to produce clean KG

## Features

### LLM topic extraction 
Given the raw car object, use qroq-api(llama-3.1-8b-instant) to extract maximum of 4 topics, along with confidence score and edgeType
example:
  topicNodes: [
      { topic: 'DFS', confidence: 0.85, edgeType: 'related_to' },
      { topic: 'Graph Algorithms', confidence: 0.8, edgeType: 'prerequisite_of' },
  ]
### normalization, deduplication, confidence threshold
Filter the topics by confidence threshold(0.5), performe normalization(ex:DFS->dfs), and deduplicate

### Clustering

Merger similar topics to reduce the number of topic nodes presented in the KG


## Architecture
## File Structure

```
server/
  services/

    topicMiningService.js (Topic Extraction)
      ├─ extractTopicsLLM()
      ├─ cleanTopics()
      ├─ deduplicate()
      └─ extractTopics()

    topicClusteringService.js (Clustering)
      ├─ getEmbedding()
      ├─ clusterTopics() (cosine similarity )
      ├─ buildGlobalTopicMap()
      └ applyTopicMap()

```
