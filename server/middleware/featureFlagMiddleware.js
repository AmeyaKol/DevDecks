import { FEATURE_FLAGS } from '../config/featureFlags.js';

// Blocks a route when its feature flag is disabled, independent of what the client
// renders. A hidden button in the UI doesn't stop a request sent directly with a
// valid token — this is the actual enforcement point.
const requireFeature = (flagName) => (req, res, next) => {
    if (FEATURE_FLAGS[flagName]) {
        return next();
    }
    return res.status(403).json({ message: 'This feature is disabled on this deployment' });
};

export { requireFeature };
