import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVALS_DIR = path.resolve(__dirname, '..');

export const CONFIG = {
  EVALS_DIR,
  GOLD_SET_PATH: path.join(EVALS_DIR, 'gold-set.json'),
  CORPUS_PATH: path.join(EVALS_DIR, 'corpus-export.json'),
  RESULTS_DIR: path.join(EVALS_DIR, 'results'),
};
