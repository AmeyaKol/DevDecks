// Weights apply to feasible difficulty mixes, then sampling is uniform within each bucket.
const MIXES = {
  2: [[1, 1, 0, 40], [0, 2, 0, 40], [0, 1, 1, 20]],
  3: [[1, 2, 0, 40], [0, 3, 0, 20], [1, 1, 1, 25], [0, 2, 1, 15]],
  4: [[1, 3, 0, 35], [0, 4, 0, 15], [1, 2, 1, 35], [0, 3, 1, 15]],
};
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export function problemUrl(problem) {
  return `https://leetcode.com/problems/${encodeURIComponent(problem.Title.trim().toLowerCase())}/description/`;
}

function companyBuckets(problems, company) {
  const seenIds = new Set();
  const seenTitles = new Set();
  const buckets = DIFFICULTIES.map(() => []);
  for (const problem of problems) {
    const difficulty = DIFFICULTIES.indexOf(problem.Difficulty);
    const title = problem.Title?.trim().toLowerCase();
    const id = String(problem.ID || '').trim();
    if (!company || !problem.companies?.includes(company) || difficulty < 0 || !title ||
        (id && seenIds.has(id)) || seenTitles.has(title)) continue;
    if (id) seenIds.add(id);
    seenTitles.add(title);
    buckets[difficulty].push(problem);
  }
  return buckets;
}

function feasibleMixes(buckets, count) {
  return (MIXES[count] || []).filter(mix => buckets.every((bucket, i) => bucket.length >= mix[i]));
}

export function availableMockSizes(problems, company) {
  const buckets = companyBuckets(problems, company);
  return [2, 3, 4].filter(count => feasibleMixes(buckets, count).length > 0);
}

export function selectMockProblems(problems, company, count, random = Math.random) {
  if (![2, 3, 4].includes(count)) throw new Error('Choose 2, 3, or 4 problems.');
  const buckets = companyBuckets(problems, company);
  const mixes = feasibleMixes(buckets, count);
  if (!mixes.length) throw new Error('This company does not have enough problems for a balanced mock of this size. Try fewer problems or another company.');
  let ticket = random() * mixes.reduce((sum, mix) => sum + mix[3], 0);
  const mix = mixes.find(candidate => {
    ticket -= candidate[3];
    return ticket < 0;
  }) || mixes[mixes.length - 1];
  return buckets.flatMap((bucket, i) => {
    const pool = [...bucket];
    const chosen = [];
    for (let j = 0; j < mix[i]; j++) {
      chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }
    return chosen;
  });
}
