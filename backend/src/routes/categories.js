const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
