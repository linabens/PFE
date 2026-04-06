const pool = require('./pool');
const bcrypt = require('bcrypt');

/**
 * Seed la base de données avec des données de test
 */
async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Démarrage du seed...');
    
    await client.query('BEGIN');
    
    // =====================================================
    // SEED USERS (ADMIN & STAFF)
    // =====================================================
    console.log('👤 Création des utilisateurs...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const staffPasswordHash = await bcrypt.hash('staff123', 10);
    
    await client.query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES 
        ('Admin User', 'admin@coffee.com', $1, 'admin'),
        ('Staff User', 'staff@coffee.com', $2, 'staff')
      ON CONFLICT (email) DO NOTHING
    `, [adminPasswordHash, staffPasswordHash]);

    // =====================================================
    // SEED TABLES
    // =====================================================
    console.log('📋 Création des tables...');
    await client.query(`
      INSERT INTO tables (table_number, qr_code, is_active)
      VALUES 
        (1, 'QR-TABLE-001', true),
        (2, 'QR-TABLE-002', true),
        (3, 'QR-TABLE-003', true),
        (4, 'QR-TABLE-004', true),
        (5, 'QR-TABLE-005', true)
      ON CONFLICT (table_number) DO NOTHING
    `);
    
    // =====================================================
    // SEED CATEGORIES
    // =====================================================
    console.log('📁 Création des catégories...');
    const catResult = await client.query(`
      INSERT INTO categories (name, type, display_order)
      VALUES 
        ('Café Chaud', 'drink', 1),
        ('Café Glacé', 'drink', 2),
        ('Boissons Spéciales', 'drink', 3),
        ('Thé', 'drink', 4),
        ('Gâteaux', 'dessert', 5),
        ('Pâtisseries', 'dessert', 6)
      ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
      RETURNING id, name
    `);
    
    const categoryMap = {};
    catResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    // =====================================================
    // SEED PRODUCTS
    // =====================================================
    console.log('☕ Création des produits...');
    const products = [
      { cat: 'Café Chaud', name: 'Espresso', desc: 'Café serré et corsé', price: 3.50, trending: false },
      { cat: 'Café Chaud', name: 'Cappuccino', desc: 'Espresso avec mousse de lait', price: 4.50, trending: true },
      { cat: 'Café Chaud', name: 'Latte', desc: 'Espresso avec lait mousseux', price: 4.75, trending: true },
      { cat: 'Café Chaud', name: 'Americano', desc: 'Espresso allongé avec eau chaude', price: 4.00, trending: false },
      { cat: 'Café Glacé', name: 'Café Glacé', desc: 'Café froid sur glace', price: 4.25, trending: true },
      { cat: 'Café Glacé', name: 'Cold Brew', desc: 'Café infusé à froid', price: 5.25, trending: false },
      { cat: 'Gâteaux', name: 'Cheesecake', desc: 'Gâteau au fromage crémeux', price: 7.50, trending: true },
      { cat: 'Gâteaux', name: 'Tiramisu', desc: 'Dessert italien au café', price: 7.50, trending: false },
      { cat: 'Pâtisseries', name: 'Croissant', desc: 'Viennoiserie française', price: 4.00, trending: true },
      { cat: 'Pâtisseries', name: 'Pain au Chocolat', desc: 'Croissant au chocolat', price: 4.50, trending: false },
    ];

    for (const p of products) {
      const catId = categoryMap[p.cat];
      if (catId) {
        await client.query(`
          INSERT INTO products (category_id, name, description, price, is_active, is_trending)
          VALUES ($1, $2, $3, $4, true, $5)
          ON CONFLICT (name) DO NOTHING
        `, [catId, p.name, p.desc, p.price, p.trending]);
      }
    }
    
    // =====================================================
    // SEED LOYALTY ACCOUNTS (name-based)
    // =====================================================
    console.log('💳 Création des comptes de loyauté...');
    await client.query(`
      INSERT INTO loyalty_accounts (customer_name, customer_id_number, points, total_earned)
      VALUES 
        ('Ahmed', '12345', 0, 0),
        ('Fatima', '67890', 100, 500),
        ('Mohammed', NULL, 50, 200)
      ON CONFLICT DO NOTHING
    `);
    
    await client.query('COMMIT');
    console.log('✅ Seed terminé avec succès!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors du seed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('✅ Processus terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = seed;
