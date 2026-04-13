import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from './Navbar';
import { getBasePath } from '../utils/greUtils';

const DEFAULT_ADMIN_EMAIL = 'admin@flashcards.com';

const isAdminUser = (user) => {
  if (!user) return false;
  if (user.isAdmin) return true;
  const e = (user.email || '').toLowerCase();
  return e === DEFAULT_ADMIN_EMAIL.toLowerCase();
};

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const basePath = getBasePath(location.pathname);

  useEffect(() => {
    if (!isAuthenticated || !isAdminUser(user)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/metrics');
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || e.message || 'Failed to load metrics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-stone-950 px-4 py-8">
        <Navbar />
        <p className="text-center text-stone-600 dark:text-stone-400 mt-8">Sign in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-stone-950 px-4 py-8">
        <Navbar />
        <p className="text-center text-red-600 dark:text-red-400 mt-8">You do not have access to this page.</p>
        <p className="text-center text-sm text-stone-500 mt-2">
          <Link to={basePath || '/'} className="text-brand-600 hover:underline">Back home</Link>
        </p>
      </div>
    );
  }

  const dauEntries = data?.redis?.dailyActiveUsers
    ? Object.entries(data.redis.dailyActiveUsers).sort(([a], [b]) => b.localeCompare(a))
    : [];

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-stone-950 px-4 py-8">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Admin</h1>
          <Link to={basePath || '/'} className="text-sm text-brand-600 hover:underline">Home</Link>
        </div>

        {loading && <p className="text-stone-600 dark:text-stone-400">Loading metrics…</p>}
        {error && (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Mongo</h2>
                <p className="text-lg font-medium text-stone-900 dark:text-stone-100 mt-1">{data.mongo}</p>
              </div>
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Redis</h2>
                <p className="text-lg font-medium text-stone-900 dark:text-stone-100 mt-1">
                  {data.redis?.configured ? (data.redis.ping || '—') : 'not configured'}
                </p>
                {data.redis?.note && (
                  <p className="text-xs text-stone-500 mt-2">{data.redis.note}</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">Totals</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-brand-600">{data.totals?.users ?? '—'}</div>
                  <div className="text-xs text-stone-500">Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-600">{data.totals?.decks ?? '—'}</div>
                  <div className="text-xs text-stone-500">Decks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-600">{data.totals?.cards ?? '—'}</div>
                  <div className="text-xs text-stone-500">Cards</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-600">{data.totals?.folders ?? '—'}</div>
                  <div className="text-xs text-stone-500">Folders</div>
                </div>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-4">
                Cards created today (UTC): <span className="font-semibold">{data.cardsCreatedToday ?? '—'}</span>
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">Active now (Redis, ~5 min window)</h2>
              <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">
                {data.redis?.activeUsersNow ?? '—'}
              </p>
            </section>

            <section className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">DAU (last 7 days)</h2>
              <div className="space-y-2">
                {dauEntries.map(([date, count]) => (
                  <div key={date} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-stone-500 tabular-nums">{date}</span>
                    <div className="flex-1 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${Math.min(100, (Number(count) || 0) * 10)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-stone-800 dark:text-stone-200">{count}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">Traffic since deploy</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Total requests: <span className="font-mono">{data.trafficSinceDeploy?.totalRequests}</span>
                {' · '}
                Unique IPs: <span className="font-mono">{data.trafficSinceDeploy?.uniqueVisitors}</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">Since {data.trafficSinceDeploy?.since}</p>
            </section>

            <section className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">Process</h2>
              <p className="text-xs text-stone-500">
                Uptime: {data.process?.uptime != null ? `${Math.floor(data.process.uptime)}s` : '—'}
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
