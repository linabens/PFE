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
      { cat: 'Café Chaud', name: 'Espresso', desc: 'Café serré et corsé', price: 3.50, trending: false, image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Café Chaud', name: 'Cappuccino', desc: 'Espresso avec mousse de lait', price: 4.50, trending: true, image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Café Chaud', name: 'Latte', desc: 'Espresso avec lait mousseux', price: 4.75, trending: true, image_url: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Café Chaud', name: 'Americano', desc: 'Espresso allongé avec eau', price: 4.00, trending: false, image_url: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Café Glacé', name: 'Nitro Cold Brew', desc: 'Café froid sur pression', price: 4.25, trending: true, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4b1bf18a?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Café Glacé', name: 'Iced Latte', desc: 'Café glacé avec lait', price: 5.25, trending: false, image_url: 'https://images.unsplash.com/photo-1461023058943-07cb126dfb8a?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Gâteaux', name: 'Cheesecake', desc: 'Gâteau crémeux', price: 7.50, trending: true, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Gâteaux', name: 'Tiramisu', desc: 'Dessert italien au café', price: 7.50, trending: false, image_url: 'https://images.unsplash.com/photo-1571115177098-24c42de1bd0f?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Pâtisseries', name: 'Croissant', desc: 'Viennoiserie française', price: 4.00, trending: true, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88f7?q=80&w=400&h=400&auto=format&fit=crop' },
      { cat: 'Pâtisseries', name: 'Pain au Chocolat', desc: 'Croissant au chocolat', price: 4.50, trending: false, image_url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=400&h=400&auto=format&fit=crop' }
    ];

    for (const p of products) {
      const catId = categoryMap[p.cat];
      if (catId) {
        await client.query(`
          INSERT INTO products (category_id, name, description, price, image_url, is_active, is_trending)
          VALUES ($1, $2, $3, $4, $5, true, $6)
        `, [catId, p.name, p.desc, p.price, p.image_url, p.trending]);
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
