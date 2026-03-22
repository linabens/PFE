const CategoryModel = require('../models/CategoryModel');
const ApiError = require('../utils/apiError');

class CategoryController {
  async list(req, res, next) {
    try {
      const categories = await CategoryModel.findAll();
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async get(req, res, next) {
    try {
      const category = await CategoryModel.findByType(req.params.type);
      if (!category) return res.status(404).json({ success: false, error: 'Catégorie non trouvée' });
      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { name, type, display_order } = req.body;
      if (!name || !type) {
        throw ApiError.badRequest('name et type sont requis');
      }
      const query = `
        INSERT INTO categories (name, type, display_order)
        VALUES ($1,$2,$3)
        RETURNING *
      `;
      const result = await CategoryModel.pool.query(query, [name, type, display_order || null]);
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
      const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      values.push(id);
      const result = await CategoryModel.pool.query(query, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Catégorie non trouvée' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const result = await CategoryModel.pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Catégorie non trouvée' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoryController();
