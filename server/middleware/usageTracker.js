import { trackRequest } from '../services/usageMetrics.js';

const usageTracker = (req, res, next) => {
  trackRequest(req);
  next();
};

export default usageTracker;
