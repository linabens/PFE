const pool = require('../database/pool');

class ProductModel {
  /**
   * Récupérer tous les produits actifs avec leurs catégories
   */
  async findAll(options = {}) {
    const { categoryId, isTrending, isSeasonal, limit = 100, offset = 0 } = options;
    
    let whereConditions = ['p.is_active = $1'];
    let values = [true];
    let paramIndex = 2;

    if (categoryId) {
      whereConditions.push(`p.category_id = $${paramIndex}`);
      values.push(categoryId);
      paramIndex++;
    }

    if (typeof isTrending === 'boolean') {
      whereConditions.push(`p.is_trending = $${paramIndex}`);
      values.push(isTrending);
      paramIndex++;
    }

    if (typeof isSeasonal === 'boolean') {
      whereConditions.push(`p.is_seasonal = $${paramIndex}`);
      values.push(isSeasonal);
      paramIndex++;
    }

    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.type as category_type
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.display_order, p.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    values.push(limit, offset);
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Récupérer un produit par ID avec ses options
   */
  async findById(productId) {
    const productQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.type as category_type
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `;
    
    const optionsQuery = `
      SELECT * FROM product_options
      WHERE product_id = $1
      ORDER BY option_type, name
    `;
    
    const [productResult, optionsResult] = await Promise.all([
      pool.query(productQuery, [productId]),
      pool.query(optionsQuery, [productId]),
    ]);
    
    if (!productResult.rows[0]) return null;
    
    const product = productResult.rows[0];
    
    // Grouper les options par type
    product.options = {
      size: [],
      milk: [],
      sugar: [],
      addon: [],
    };
    
    for (const option of optionsResult.rows) {
      if (product.options[option.option_type]) {
        product.options[option.option_type].push(option);
      }
    }
    
    return product;
  }

  /**
   * Récupérer les produits tendances
   */
  async findTrending(limit = 10) {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        COALESCE(dps.quantity_sold, 0) as today_sales
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN daily_product_stats dps ON dps.product_id = p.id AND dps.date = CURRENT_DATE
      WHERE p.is_active = true AND p.is_trending = true
      ORDER BY today_sales DESC, p.name
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

const model = new ProductModel();
model.pool = pool;
module.exports = model;
