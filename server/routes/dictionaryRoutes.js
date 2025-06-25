import express from 'express';
import { getWordData } from '../controllers/dictionaryController.js';

const router = express.Router();
router.get('/dictionary', getWordData);
export default router; 