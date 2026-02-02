import morgan from 'morgan';
import { randomUUID } from 'crypto';
import logger from '../utils/logger.js';

const assignRequestId = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms :remote-addr :req[x-request-id]',
  {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }
);

export { assignRequestId, requestLogger };
