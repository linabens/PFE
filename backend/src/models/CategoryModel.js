const pool = require('../database/pool');

class CategoryModel {
  /**
   * Récupérer toutes les catégories avec le nombre de produits
   */
  async findAll() {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) FILTER (WHERE p.is_active = true) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Récupérer les catégories par type (drink ou dessert)
   */
  async findByType(type) {
    const query = `
      SELECT 
        c.*,
        COUNT(p.id) FILTER (WHERE p.is_active = true) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      WHERE c.type = $1
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `;
    
    const result = await pool.query(query, [type]);
    return result.rows;
  }
}

const categoryModel = new CategoryModel();
categoryModel.pool = pool;
module.exports = categoryModel;
