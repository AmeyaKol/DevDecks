import React, { useMemo, useState } from 'react';
import { availableMockSizes, problemUrl, selectMockProblems } from '../utils/mockAssessment';

const inputClass = 'w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white';

export default function MockAssessment({ problems, companies }) {
  const [company, setCompany] = useState('');
  const [count, setCount] = useState(2);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const sizes = useMemo(() => availableMockSizes(problems, company), [problems, company]);

  const start = () => {
    try {
      const selected = selectMockProblems(problems, company, count);
      setSession({ company, problems: selected });
      setError('');
      // Keep these calls synchronous with the click; individual links remain available
      // because browsers can block multiple tabs even during a user gesture.
      selected.forEach(problem => window.open(problemUrl(problem), '_blank', 'noopener,noreferrer'));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section aria-labelledby="mock-oa-title" className="mb-6 p-6 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 rounded-lg text-stone-900 dark:text-white">
      <h3 id="mock-oa-title" className="text-xl font-semibold">Company mock OA</h3>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Practice 2–4 random company problems, with a medium-focused mix and at most one easy and one hard. Uses the full company pool, regardless of list filters.</p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="mock-company" className="block mb-1 text-sm font-medium">Company</label>
          <select id="mock-company" className={inputClass} value={company} onChange={event => { setCompany(event.target.value); setError(''); }}>
            <option value="">Select a company</option>
            {companies.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="mock-count" className="block mb-1 text-sm font-medium">Problems</label>
          <select id="mock-count" className={inputClass} value={count} onChange={event => { setCount(Number(event.target.value)); setError(''); }}>
            {[2, 3, 4].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
        <button type="button" onClick={start} disabled={!sizes.includes(count)} className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed">Start mock OA</button>
      </div>
      {company && !sizes.includes(count) && <p role="status" className="mt-3 text-sm text-stone-600 dark:text-stone-400">Not enough problems for a balanced {count}-problem mock. {sizes.length ? `Choose ${sizes.join(' or ')} problems, or another company.` : 'Choose another company.'}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Problems open in LeetCode tabs. This is self-directed practice; hints and solutions on LeetCode remain accessible. Some problems may require LeetCode Premium.</p>
      {session && (
        <div className="mt-5 border-t border-stone-200 dark:border-stone-700 pt-4" aria-live="polite">
          <h4 className="font-medium">{session.company} mock OA · {session.problems.length} problems</h4>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">If your browser blocked any tabs, open the problems below. Difficulty and topic labels are hidden here.</p>
          <ol className="mt-3 space-y-2">
            {session.problems.map((problem, i) => <li key={problem.ID || problem.Title}><a href={problemUrl(problem)} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-amber-500 underline">Open problem {i + 1}</a></li>)}
          </ol>
        </div>
      )}
    </section>
  );
}
