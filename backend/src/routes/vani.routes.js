const express = require('express');
const router = express.Router();
const vaniController = require('../controllers/vani.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

// Public/optional browsing
router.get('/vani/spaces', vaniController.getSpaces);
router.get('/vani/posts', optionalAuth, vaniController.getPosts);
router.get('/vani/posts/:id', optionalAuth, vaniController.getPostById);
router.get('/vani/posts/:id/comments', vaniController.getComments);

// Protected posting, commenting, and voting
router.post('/vani/posts', authenticate, vaniController.createPost);
router.post('/vani/posts/:id/comments', authenticate, vaniController.createComment);
router.post('/vani/posts/:id/vote', authenticate, vaniController.vote);
router.get('/vani/my-votes', authenticate, vaniController.getMyVotes);

module.exports = router;
