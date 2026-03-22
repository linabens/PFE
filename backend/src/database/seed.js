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
    await client.query(`
      INSERT INTO categories (name, type, display_order)
      VALUES 
        ('Café Chaud', 'drink', 1),
        ('Café Glacé', 'drink', 2),
        ('Boissons Spéciales', 'drink', 3),
        ('Thé', 'drink', 4),
        ('Gâteaux', 'dessert', 5),
        ('Pâtisseries', 'dessert', 6)
      ON CONFLICT DO NOTHING
    `);
    
    // =====================================================
    // SEED PRODUCTS
    // =====================================================
    console.log('☕ Création des produits...');
    await client.query(`
      INSERT INTO products (category_id, name, description, price, is_active, is_trending)
      VALUES 
        -- Café Chaud (category_id = 1)
        (1, 'Espresso', 'Café serré et corsé', 3.50, true, false),
        (1, 'Cappuccino', 'Espresso avec mousse de lait', 4.50, true, true),
        (1, 'Latte', 'Espresso avec lait mousseux', 4.75, true, true),
        (1, 'Americano', 'Espresso allongé avec eau chaude', 4.00, true, false),
        
        -- Café Glacé (category_id = 2)
        (2, 'Café Glacé', 'Café froid sur glace', 4.25, true, true),
        (2, 'Cold Brew', 'Café infusé à froid', 5.25, true, false),
        
        -- Gâteaux (category_id = 5)
        (5, 'Cheesecake', 'Gâteau au fromage crémeux', 7.50, true, true),
        (5, 'Tiramisu', 'Dessert italien au café', 7.50, true, false),
        
        -- Pâtisseries (category_id = 6)
        (6, 'Croissant', 'Viennoiserie française', 4.00, true, true),
        (6, 'Pain au Chocolat', 'Croissant au chocolat', 4.50, true, false)
      ON CONFLICT DO NOTHING
    `);
    
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
