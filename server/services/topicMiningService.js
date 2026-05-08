import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MOCK_TOPIC_RULES = [
    {
        match: ["binary search", "logarithmic", "o(log n)"],
        topics: [
            { topic: "Binary Search", confidence: 0.95, edgeType: "related_to" },
            { topic: "Divide and Conquer", confidence: 0.78, edgeType: "prerequisite_of" },
        ],
    },
    {
        match: ["dfs", "depth first"],
        topics: [
            { topic: "DFS", confidence: 0.93, edgeType: "related_to" },
            { topic: "Graph Traversal", confidence: 0.80, edgeType: "prerequisite_of" },
        ],
    },
    {
        match: ["bfs", "breadth first"],
        topics: [
            { topic: "BFS", confidence: 0.93, edgeType: "related_to" },
            { topic: "Graph Traversal", confidence: 0.80, edgeType: "prerequisite_of" },
        ],
    },
    {
        match: ["dynamic programming", "dp"],
        topics: [
            { topic: "Dynamic Programming", confidence: 0.96, edgeType: "related_to" },
            { topic: "Recursion", confidence: 0.72, edgeType: "prerequisite_of" },
        ],
    },
];




export function extractTopicsMock(card) {
    const text = `${card.question} ${card.explanation || ""}`.toLowerCase();

    let results = [];

    for (const rule of MOCK_TOPIC_RULES) {
        if (rule.match.some((m) => text.includes(m))) {
            results.push(...rule.topics);
        }
    }

    if (results.length === 0) {
        results.push({
            topic: "General Concept",
            confidence: 0.5,
            edgeType: "related_to",
        });
    }

    return { topicNodes: deduplicate(results) };
}


export async function extractTopicsLLM(card) {
    const prompt = `
You are a topic extraction system for flashcards.

Extract key topics and relationships.

Return STRICT JSON ONLY in this format:

{
  "topicNodes": [
    {
      "topic": string,
      "confidence": number,
      "edgeType": "related_to" | "prerequisite_of" | "variant_of" | "used_in"
    }
  ]
}

Return STRICT JSON ONLY.

Rules:
- Maximum 4 topics
- Each topic must be SPECIFIC (no generic terms like "Programming")
- Use canonical names:
  - DP → Dynamic Programming
  - DFS → DFS
  - BFS → BFS
- Prefer algorithm/data structure names
- Avoid redundant topics

Good examples:
- Binary Search
- Dynamic Programming
- Greedy Algorithm
- Graph Traversal

Bad examples:
- Programming
- Algorithm
- Problem Solving

FLASHCARD:
Question: ${card.question}
Explanation: ${card.explanation || ""}
Code: ${card.code || ""}
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "system", content: "You output only valid JSON." },
            { role: "user", content: prompt },
        ],
        temperature: 0.2,
    });

    const content = response.choices[0].message.content;

    try {
        return JSON.parse(content);
    } catch (e) {
        console.error("LLM JSON parse failed:", content);
        return { topicNodes: [] };
    }
}

const GENERIC = new Set([
    "programming",
    "algorithm",
    "data structure",
    "problem solving",
    "coding",
    "computer science",
    "string"
]);

const NORMALIZATION_MAP = {
    "dp": "dynamic programming",
    "dynamic programming": "dynamic programming",

    "dfs": "dfs",
    "depth first search": "dfs",

    "bfs": "bfs",
    "breadth first search": "bfs",

    "greedy": "greedy algorithm",
    "greedy algorithm": "greedy algorithm",

    "graph": "graph",
    "graph traversal": "graph traversal",

    "two pointers": "two pointers technique",
    "two pointer": "two pointers technique",

    "binary search": "binary search",

    "linked list": "linked list",
};

/* Normalize topic names */
function normalizeTopic(topic) {
    const key = topic.toLowerCase().trim();
    return NORMALIZATION_MAP[key] || key;
}

/* Deduplicate topics */
function deduplicate(nodes) {
    const map = new Map();

    for (const n of nodes) {
        const normalized = normalizeTopic(n.topic);
        const key = normalized.toLowerCase();

        if (!map.has(key)) {
            map.set(key, {
                ...n,
                topic: normalized,
            });
        } else {
            const existing = map.get(key);
            existing.confidence = Math.max(existing.confidence, n.confidence);
        }
    }

    return [...map.values()];
}

/* Clean pipeline */
function cleanTopics(nodes) {
    if (!Array.isArray(nodes)) return [];

    return deduplicate(nodes)
        // remove low confidence
        .filter((n) => n.confidence >= 0.5)

        // remove generic
        .filter((n) => !GENERIC.has(n.topic.toLowerCase()))

        // sort
        .sort((a, b) => b.confidence - a.confidence)

        // limit
        .slice(0, 4);
}


export async function extractTopics(card, mode = "mock") {
    let raw;

    if (mode === "llm") {
        raw = await extractTopicsLLM(card);
    }
    else {
        raw = await extractTopicsMock(card);
    }

    const cleaned = cleanTopics(raw.topicNodes);
    return { topicNodes: cleaned };

}
