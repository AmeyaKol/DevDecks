const metrics = {
  totalRequests: 0,
  uniqueVisitors: new Set(),
  perRoute: new Map(),
  since: new Date().toISOString(),
};

const trackRequest = (req) => {
  metrics.totalRequests += 1;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  metrics.uniqueVisitors.add(ip);

  const routeKey = `${req.method} ${req.baseUrl || ''}${req.path || ''}`.trim();
  const current = metrics.perRoute.get(routeKey) || 0;
  metrics.perRoute.set(routeKey, current + 1);
};

const getMetricsSnapshot = () => ({
  totalRequests: metrics.totalRequests,
  uniqueVisitors: metrics.uniqueVisitors.size,
  perRoute: Object.fromEntries(metrics.perRoute.entries()),
  since: metrics.since,
});

export { trackRequest, getMetricsSnapshot };
