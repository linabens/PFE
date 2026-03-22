const ProductModel = require('../models/ProductModel');
const ApiError = require('../utils/apiError');

class ProductController {
  async list(req, res, next) {
    try {
      const { category_id, is_trending, is_seasonal, limit, offset } = req.query;
      const products = await ProductModel.findAll({
        categoryId: category_id ? parseInt(category_id) : undefined,
        isTrending: is_trending === 'true',
        isSeasonal: is_seasonal === 'true',
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const product = await ProductModel.findById(parseInt(req.params.id));
      if (!product) return res.status(404).json({ success: false, error: 'Produit non trouvé' });
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = req.body;
      // Basic validation
      if (!data.name || !data.price) {
        throw ApiError.badRequest('name et price sont requis');
      }
      const query = `
        INSERT INTO products (category_id, name, description, price, image_url, is_active, is_seasonal, is_trending)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
      `;
      const values = [
        data.category_id || null,
        data.name,
        data.description || null,
        data.price,
        data.image_url || null,
        data.is_active !== undefined ? data.is_active : true,
        data.is_seasonal || false,
        data.is_trending || false,
      ];
      const result = await ProductModel.pool.query(query, values);
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const fields = [];
      const values = [];
      let idx = 1;
      for (const key in req.body) {
        fields.push(`${key} = $${idx}`);
        values.push(req.body[key]);
        idx++;
      }
      if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun champ à mettre à jour' });
      }
      const query = `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      values.push(id);
      const result = await ProductModel.pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Produit non trouvé' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const result = await ProductModel.pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Produit non trouvé' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
