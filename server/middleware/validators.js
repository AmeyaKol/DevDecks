import { body, validationResult } from 'express-validator';

// Kept as two separate arrays (identical contents today) rather than one
// aliased list -- deck type and card type are different concepts that have
// drifted apart before (a Custom deck's type gates its fieldConfig; a
// Custom card's type gates whether question/explanation are derived).
const deckTypes = ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ', 'Custom'];
const flashcardTypes = ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ', 'Custom'];

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
  body('fieldConfig').optional().isObject().withMessage('fieldConfig must be an object'),
  handleValidationErrors,
];

const validateDeckUpdate = [
  body('name').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Deck name must be 3-100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be <= 500 characters'),
  body('type').optional().isIn(deckTypes).withMessage('Invalid deck type'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('fieldConfig').optional().isObject().withMessage('fieldConfig must be an object'),
  handleValidationErrors,
];

// Custom cards derive question/explanation server-side from fieldData
// (see fieldConfigService.deriveQuestionAndExplanation), so those two fields
// are not required on the wire for type === 'Custom'.
const isNotCustomType = (value, { req }) => req.body.type !== 'Custom';

const validateFlashcardCreate = [
  body('question').if(isNotCustomType).trim().isLength({ min: 5, max: 500 }).withMessage('Question must be 5-500 characters'),
  body('explanation').if(isNotCustomType).trim().isLength({ min: 10 }).withMessage('Explanation must be at least 10 characters'),
  body('type').isIn(flashcardTypes).withMessage('Invalid flashcard type'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Tags must be an array of up to 10 items'),
  body('decks').optional().isArray().withMessage('Decks must be an array of IDs'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('fieldData').optional().isObject().withMessage('fieldData must be an object'),
  body('primaryDeck').optional().isMongoId().withMessage('primaryDeck must be a valid ID'),
  handleValidationErrors,
];

const validateFlashcardUpdate = [
  body('question').if(isNotCustomType).optional().trim().isLength({ min: 5, max: 500 }).withMessage('Question must be 5-500 characters'),
  body('explanation').if(isNotCustomType).optional().trim().isLength({ min: 10 }).withMessage('Explanation must be at least 10 characters'),
  body('type').optional().isIn(flashcardTypes).withMessage('Invalid flashcard type'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Tags must be an array of up to 10 items'),
  body('decks').optional().isArray().withMessage('Decks must be an array of IDs'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be boolean'),
  body('fieldData').optional().isObject().withMessage('fieldData must be an object'),
  body('primaryDeck').optional().isMongoId().withMessage('primaryDeck must be a valid ID'),
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
