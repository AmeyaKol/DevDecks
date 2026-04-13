import { body, validationResult } from 'express-validator';

const deckTypes = ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];
const flashcardTypes = deckTypes;

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  return next();
};

const validateDeckCreate = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Deck name must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be <= 500 characters'),
  body('type').isIn(deckTypes).withMessage('Invalid deck type'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  handleValidationErrors,
];

const validateDeckUpdate = [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Deck name must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be <= 500 characters'),
  body('type').optional().isIn(deckTypes).withMessage('Invalid deck type'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  handleValidationErrors,
];

const validateFlashcardCreate = [
  body('question').trim().isLength({ min: 5, max: 500 }).withMessage('Question must be 5-500 characters'),
  body('explanation').trim().isLength({ min: 10 }).withMessage('Explanation must be at least 10 characters'),
  body('type').isIn(flashcardTypes).withMessage('Invalid flashcard type'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Tags must be an array of up to 10 items'),
  body('decks').optional().isArray().withMessage('Decks must be an array of IDs'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  handleValidationErrors,
];

const validateFlashcardUpdate = [
  body('question').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Question must be 5-500 characters'),
  body('explanation').optional().trim().isLength({ min: 10 }).withMessage('Explanation must be at least 10 characters'),
  body('type').optional().isIn(flashcardTypes).withMessage('Invalid flashcard type'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Tags must be an array of up to 10 items'),
  body('decks').optional().isArray().withMessage('Decks must be an array of IDs'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  handleValidationErrors,
];

const validateFolderCreate = [
  body('name').trim().isLength({ min: 3, max: 100 }).withMessage('Folder name must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be <= 500 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  handleValidationErrors,
];

const validateFolderUpdate = [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Folder name must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be <= 500 characters'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  handleValidationErrors,
];

const validateFolderDeckAdd = [
  body('deckId').notEmpty().withMessage('Deck ID is required'),
  handleValidationErrors,
];

const validateRegister = [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export {
  validateDeckCreate,
  validateDeckUpdate,
  validateFlashcardCreate,
  validateFlashcardUpdate,
  validateFolderCreate,
  validateFolderUpdate,
  validateFolderDeckAdd,
  validateRegister,
  validateLogin,
};
