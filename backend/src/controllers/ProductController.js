const ProductModel = require('../models/ProductModel');
const ApiError = require('../utils/apiError');

const ALLOWED_OPTION_TYPES = ['size', 'milk', 'sugar', 'addon'];

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
      if (!data.name || data.price === undefined || data.price === null) {
        throw ApiError.badRequest('name et price sont requis');
      }

      const rawOptions = data.options;
      const options = Array.isArray(rawOptions) ? rawOptions : [];
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt || typeof opt !== 'object') {
          throw ApiError.badRequest(`options[${i}] doit être un objet { option_type, name, price_modifier? }`);
        }
        if (!ALLOWED_OPTION_TYPES.includes(opt.option_type)) {
          throw ApiError.badRequest(
            `option_type invalide: "${opt.option_type}". Autorisés: ${ALLOWED_OPTION_TYPES.join(', ')}`
          );
        }
        if (!opt.name || String(opt.name).trim() === '') {
          throw ApiError.badRequest(`options[${i}].name est requis`);
        }
        if (
          opt.price_modifier !== undefined &&
          opt.price_modifier !== null &&
          Number.isNaN(Number(opt.price_modifier))
        ) {
          throw ApiError.badRequest(`options[${i}].price_modifier doit être un nombre`);
        }
      }

      const product = await ProductModel.createWithOptions(
        {
          category_id: data.category_id,
          name: data.name,
          description: data.description,
          price: data.price,
          image_url: data.image_url,
          is_active: data.is_active,
          is_seasonal: data.is_seasonal,
          is_trending: data.is_trending,
        },
        options
      );

      res.status(201).json({ success: true, data: product });
    } catch (err) {
      if (
        err &&
        err.message &&
        (err.message.startsWith('option_type invalide') ||
          err.message.startsWith('Chaque option') ||
          err.message.startsWith('price_modifier invalide'))
      ) {
        return next(ApiError.badRequest(err.message));
      }
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      // ── WHITELIST: only these fields can be updated ──
      const ALLOWED_FIELDS = [
        'name', 'description', 'price', 'image_url',
        'category_id', 'is_active', 'is_seasonal', 'is_trending',
      ];

      const fields = [];
      const values = [];
      let idx = 1;

      for (const key of ALLOWED_FIELDS) {
        if (req.body[key] !== undefined) {
          fields.push(`${key} = $${idx}`);
          values.push(req.body[key]);
          idx++;
        }
      }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun champ valide à mettre à jour' });
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
