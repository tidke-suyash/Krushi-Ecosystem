const db = require('../db');
const { success, error } = require('../utils/response');

const SPACES = [
  { id: 'agri', name: 'Agriculture', icon: '🌾', desc: 'Crop prices, farming techniques, weather advisories and rural policy.', members: 18400 },
  { id: 'tech', name: 'Technology', icon: '💻', desc: 'Software, hardware, startups and the tools shaping tomorrow.', members: 52100 },
  { id: 'politics', name: 'Politics', icon: '🏛️', desc: 'Policy, elections and governance, explained without the noise.', members: 41200 },
  { id: 'business', name: 'Business', icon: '💼', desc: 'Markets, companies and the economy in plain language.', members: 33900 },
  { id: 'sports', name: 'Sports', icon: '🏆', desc: 'Scores, transfers and the matches everyone is talking about.', members: 47600 },
  { id: 'science', name: 'Science', icon: '🔬', desc: 'Research, discovery and the questions we are still answering.', members: 21700 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', desc: 'Film, music and culture worth your evening.', members: 29300 },
  { id: 'local', name: 'Local News', icon: '📍', desc: 'What is happening in your district, town and neighbourhood.', members: 15800 },
  { id: 'education', name: 'Education', icon: '📚', desc: 'Schools, exams, scholarships and learning policy.', members: 12100 }
];

async function getPosts(req, res) {
  try {
    const { space, q, limit, offset } = req.query;
    const posts = await db.getPosts({
      spaceId: space,
      search: q,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
    return success(res, posts);
  } catch (err) {
    console.error('[VANI GetPosts Error]:', err);
    return error(res, 'Failed to fetch posts', 500);
  }
}

async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const post = await db.getPostById(id);
    if (!post) {
      return error(res, 'Post not found', 404);
    }
    const comments = await db.getComments(id);
    return success(res, {
      ...post,
      comments: comments || []
    });
  } catch (err) {
    console.error('[VANI GetPostById Error]:', err);
    return error(res, 'Failed to fetch post details', 500);
  }
}

async function createPost(req, res) {
  try {
    const { title, body, space, type, source, summary } = req.body;
    const userId = req.user.id;
    const profile = req.profile || {};

    if (!title || !space) {
      return error(res, 'Title and space are required', 400);
    }

    const post = await db.createPost({
      user_id: userId,
      author_name: profile.name || 'Krushi Contributor',
      space_id: space,
      type: type || 'news',
      title: title.trim(),
      body: body || '',
      source: source || '',
      summary: summary || ''
    });

    return success(res, post, 201);
  } catch (err) {
    console.error('[VANI CreatePost Error]:', err);
    return error(res, 'Failed to create post', 500);
  }
}

async function getComments(req, res) {
  try {
    const { id } = req.params;
    const comments = await db.getComments(id);
    return success(res, comments);
  } catch (err) {
    console.error('[VANI GetComments Error]:', err);
    return error(res, 'Failed to fetch comments', 500);
  }
}

async function createComment(req, res) {
  try {
    const { id } = req.params;
    const { body } = req.body;
    const userId = req.user.id;
    const profile = req.profile || {};

    if (!body || !body.trim()) {
      return error(res, 'Comment text cannot be empty', 400);
    }

    const comment = await db.createComment({
      post_id: id,
      user_id: userId,
      author_name: profile.name || 'Krushi Member',
      body: body.trim()
    });

    return success(res, comment, 201);
  } catch (err) {
    console.error('[VANI CreateComment Error]:', err);
    return error(res, 'Failed to create comment', 500);
  }
}

async function vote(req, res) {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!direction || !['up', 'down'].includes(direction)) {
      return error(res, "Vote direction must be 'up' or 'down'", 400);
    }

    const userVote = await db.votePost(req.user.id, id, direction);
    return success(res, {
      postId: id,
      direction: userVote
    });
  } catch (err) {
    console.error('[VANI Vote Error]:', err);
    return error(res, 'Failed to submit vote', 500);
  }
}

async function getMyVotes(req, res) {
  try {
    const votes = await db.getUserVotes(req.user.id);
    return success(res, votes);
  } catch (err) {
    console.error('[VANI GetMyVotes Error]:', err);
    return error(res, 'Failed to fetch user votes', 500);
  }
}

async function getSpaces(req, res) {
  return success(res, SPACES);
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  getComments,
  createComment,
  vote,
  getMyVotes,
  getSpaces
};
