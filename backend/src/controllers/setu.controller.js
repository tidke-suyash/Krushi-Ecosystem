const db = require('../db');
const { success, error } = require('../utils/response');

async function getProducts(req, res) {
  try {
    const { cat, q, sort, limit, offset } = req.query;
    const products = await db.getProducts({
      category: cat,
      search: q,
      sort,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0
    });
    return success(res, products);
  } catch (err) {
    console.error('[SETU GetProducts Error]:', err);
    return error(res, 'Failed to fetch products', 500);
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await db.getProductById(id);
    if (!product) {
      return error(res, 'Product not found', 404);
    }
    return success(res, product);
  } catch (err) {
    console.error('[SETU GetProductById Error]:', err);
    return error(res, 'Failed to fetch product details', 500);
  }
}

async function createProduct(req, res) {
  try {
    const { title, desc, price, cat, loc, cond, avail, specs, imgs } = req.body;
    const userId = req.user.id;
    const profile = req.profile || {};

    if (!title || !price || !cat) {
      return error(res, 'Title, price, and category are required', 400);
    }

    const newProduct = await db.createProduct({
      seller_user_id: userId,
      title: title.trim(),
      description: desc || '',
      price: parseFloat(price) || 0,
      category: cat,
      location: loc || (profile.village ? `${profile.village}, ${profile.district}` : 'India'),
      condition: cond || 'Good',
      availability: avail || 'In stock',
      specs: specs || {},
      images: imgs || [0, 1, 2],
      seller_name: profile.name || 'Krushi Seller',
      seller_type: profile.role || 'Individual',
      rating: 4.8
    });

    return success(res, newProduct, 201);
  } catch (err) {
    console.error('[SETU CreateProduct Error]:', err);
    return error(res, 'Failed to create product listing', 500);
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await db.updateProduct(id, req.user.id, updates);
    if (!updated) {
      return error(res, 'Product not found or unauthorized to edit', 404);
    }
    return success(res, updated);
  } catch (err) {
    console.error('[SETU UpdateProduct Error]:', err);
    return error(res, 'Failed to update product', 500);
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const ok = await db.deleteProduct(id, req.user.id);
    if (!ok) {
      return error(res, 'Product not found or unauthorized to delete', 404);
    }
    return success(res, { message: 'Product listing deleted' });
  } catch (err) {
    console.error('[SETU DeleteProduct Error]:', err);
    return error(res, 'Failed to delete product', 500);
  }
}

async function getMyListings(req, res) {
  try {
    const listings = await db.getMyListings(req.user.id);
    return success(res, listings);
  } catch (err) {
    console.error('[SETU GetMyListings Error]:', err);
    return error(res, 'Failed to fetch seller listings', 500);
  }
}

async function getSavedProducts(req, res) {
  try {
    const savedIds = await db.getSavedProducts(req.user.id);
    return success(res, savedIds);
  } catch (err) {
    console.error('[SETU GetSavedProducts Error]:', err);
    return error(res, 'Failed to fetch saved products', 500);
  }
}

async function toggleSaveProduct(req, res) {
  try {
    const { id } = req.params;
    const isSaved = await db.toggleSavedProduct(req.user.id, id);
    return success(res, {
      productId: id,
      saved: isSaved
    });
  } catch (err) {
    console.error('[SETU ToggleSaveProduct Error]:', err);
    return error(res, 'Failed to toggle saved product', 500);
  }
}

async function getOrders(req, res) {
  try {
    const orders = await db.getOrders(req.user.id);
    return success(res, orders);
  } catch (err) {
    console.error('[SETU GetOrders Error]:', err);
    return error(res, 'Failed to fetch orders', 500);
  }
}

async function createOrder(req, res) {
  try {
    const { productId, quantity } = req.body;
    const product = await db.getProductById(productId);
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const qty = parseInt(quantity, 10) || 1;
    const totalPrice = product.price * qty;

    const order = await db.createOrder({
      buyer_user_id: req.user.id,
      product_id: product.id,
      product_title: product.title,
      quantity: qty,
      price: totalPrice,
      seller_name: product.seller_name
    });

    return success(res, order, 201);
  } catch (err) {
    console.error('[SETU CreateOrder Error]:', err);
    return error(res, 'Failed to place order', 500);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyListings,
  getSavedProducts,
  toggleSaveProduct,
  getOrders,
  createOrder
};
