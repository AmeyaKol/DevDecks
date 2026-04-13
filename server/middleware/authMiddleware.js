import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { scheduleTrackActiveUser } from './trackActiveUser.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            scheduleTrackActiveUser(req.user);
            return next();
        } catch (error) {
            logger.warn('JWT verify failed', { message: error.message, requestId: req.requestId });
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token' });
};

// Optional auth - doesn't fail if no token, but sets user if valid token
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (req.user) {
                scheduleTrackActiveUser(req.user);
            }
        } catch (error) {
            // Token invalid, but continue without user
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};

export { protect, optionalAuth }; 