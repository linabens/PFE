const pool = require('../database/pool');

const OPTION_TYPES = ['size', 'milk', 'sugar', 'addon'];

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

  /**
   * Insère les lignes product_options (client DB déjà fourni — pas de transaction ici).
   */
  async _insertProductOptions(productId, options, client) {
    if (!Array.isArray(options) || options.length === 0) return;
    const insertSql = `
      INSERT INTO product_options (product_id, option_type, name, price_modifier)
      VALUES ($1, $2, $3, $4)
    `;
    for (const opt of options) {
      if (!opt || typeof opt !== 'object') continue;
      const optionType = opt.option_type;
      if (!OPTION_TYPES.includes(optionType)) {
        throw new Error(`option_type invalide: ${optionType}`);
      }
      const name = opt.name != null ? String(opt.name).trim() : '';
      if (!name) {
        throw new Error('Chaque option doit avoir un name non vide');
      }
      const priceMod =
        opt.price_modifier !== undefined && opt.price_modifier !== null
          ? Number(opt.price_modifier)
          : 0;
      if (Number.isNaN(priceMod)) {
        throw new Error(`price_modifier invalide pour l'option "${name}"`);
      }
      await client.query(insertSql, [productId, optionType, name, priceMod]);
    }
  }

  /**
   * Créer un produit et ses options en une seule transaction.
   * @param {object} productData - category_id, name, description, price, image_url, is_active, is_seasonal, is_trending
   * @param {Array<{ option_type: string, name: string, price_modifier?: number }>} options
   * @returns {Promise<object|null>} produit enrichi comme findById
   */
  async createWithOptions(productData, options = []) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertProduct = `
        INSERT INTO products (category_id, name, description, price, image_url, is_active, is_seasonal, is_trending)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
      `;
      const values = [
        productData.category_id || null,
        productData.name,
        productData.description || null,
        productData.price,
        productData.image_url || null,
        productData.is_active !== undefined ? productData.is_active : true,
        productData.is_seasonal || false,
        productData.is_trending || false,
      ];
      const productResult = await client.query(insertProduct, values);
      const product = productResult.rows[0];

      if (Array.isArray(options) && options.length > 0) {
        await this._insertProductOptions(product.id, options, client);
      }

      await client.query('COMMIT');
      return this.findById(product.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

const model = new ProductModel();
model.pool = pool;
module.exports = model;
