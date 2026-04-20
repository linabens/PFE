const pool = require('./pool');
const bcrypt = require('bcrypt');

/**
 * Seed la base de données avec des données de test professionnelles
 */
async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Démarrage du seed gourmet...');
    
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
    console.log('📁 Création des catégories raffinées...');
    const categories = [
      { name: 'Signature Brews', type: 'drink', order: 1 },
      { name: 'Iced Refreshers', type: 'drink', order: 2 },
      { name: 'Artisan Tea', type: 'drink', order: 3 },
      { name: 'Morning Pastries', type: 'dessert', order: 4 },
      { name: 'Gourmette Cakes', type: 'dessert', order: 5 },
      { name: 'Savoury Bites', type: 'dessert', order: 6 },
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const res = await client.query(`
        INSERT INTO categories (name, type, display_order)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type, display_order = EXCLUDED.display_order
        RETURNING id, name
      `, [cat.name, cat.type, cat.order]);
      categoryMap[cat.name] = res.rows[0].id;
    }

    // =====================================================
    // SEED PRODUCTS
    // =====================================================
    console.log('☕ Création du catalogue gourmet (30+ produits)...');
    
    const products = [
      // signature brews
      { cat: 'Signature Brews', name: 'Espresso Romano', desc: 'Shot d\'espresso intense avec une touche de citron', price: 4.500, trending: true, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04' },
      { cat: 'Signature Brews', name: 'V60 Ethiopia', desc: 'Café filtre floral aux notes de jasmin', price: 8.500, trending: false, image: 'https://images.unsplash.com/photo-1544787210-2211d2471d7b' },
      { cat: 'Signature Brews', name: 'Gold Latte', desc: 'Espresso, lait soyeux et fine poudre d\'or comestible', price: 12.000, trending: true, image: 'https://images.unsplash.com/photo-1534778101976-62847782c213' },
      { cat: 'Signature Brews', name: 'Flat White', desc: 'Texture crémeuse parfaite, torréfaction brune', price: 6.800, trending: false, image: 'https://images.unsplash.com/photo-1577968897866-be520b29d407' },
      { cat: 'Signature Brews', name: 'Syphon Coffee', desc: 'Méthode d\'extraction visuelle et pure', price: 10.500, trending: false, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085' },

      // iced refreshers
      { cat: 'Iced Refreshers', name: 'Cold Brew Tonic', desc: 'Infusion à froid, tonic premium et romarin', price: 7.200, trending: true, image: 'https://images.unsplash.com/photo-1517701550927-30cf4b1bf18a' },
      { cat: 'Iced Refreshers', name: 'Matcha Iced Latte', desc: 'Thé vert japonais et lait d\'amande sur glace', price: 9.000, trending: true, image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7' },
      { cat: 'Iced Refreshers', name: 'Iced Americano', desc: 'Shot double sur glace cristalline', price: 5.500, trending: false, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c' },
      { cat: 'Iced Refreshers', name: 'Rosewater Cold Brew', desc: 'Notes florales délicates et café noir', price: 8.000, trending: false, image: 'https://images.unsplash.com/photo-1461023058943-07cb126dfb8a' },

      // artisan tea
      { cat: 'Artisan Tea', name: 'Jasmine Pearl', desc: 'Thé vert roulé à la main, parfum naturel', price: 6.500, trending: false, image: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12' },
      { cat: 'Artisan Tea', name: 'Earl Grey Royal', desc: 'Thé noir bergamote et pétales de bleuet', price: 6.000, trending: true, image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570' },
      { cat: 'Artisan Tea', name: 'Mint Bliss', desc: 'Menthe fraîche et thé vert de montagne', price: 5.500, trending: false, image: 'https://images.unsplash.com/photo-144933325662ef-447543818e80' },

      // morning pastries
      { cat: 'Morning Pastries', name: 'Almond Croissant', desc: 'Double cuisson, crème d\'amande et effilées', price: 5.200, trending: true, image: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88f7' },
      { cat: 'Morning Pastries', name: 'Pain au Chocolat', desc: 'Feuilletage pur beurre, bâtons de chocolat noir', price: 4.800, trending: false, image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec' },
      { cat: 'Morning Pastries', name: 'Kouign-Amann', desc: 'Spécialité bretonne caramélisée au beurre', price: 6.000, trending: true, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff' },
      { cat: 'Morning Pastries', name: 'Fruit Danish', desc: 'Pâtisserie aux fruits de saison et crème', price: 5.500, trending: false, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad' },

      // gourmette cakes
      { cat: 'Gourmette Cakes', name: 'Pistachio Tiramisu', desc: 'Mascarpone, pistache d\'Italie et biscuits café', price: 12.500, trending: true, image: 'https://images.unsplash.com/photo-1571115177098-24c42de1bd0f' },
      { cat: 'Gourmette Cakes', name: 'Opera Cake', desc: 'Couches fines de café, ganache et biscuit joconde', price: 10.000, trending: true, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b' },
      { cat: 'Gourmette Cakes', name: 'Lemon Meringue Tart', desc: 'Crème citron acide et meringue italienne', price: 9.500, trending: false, image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13' },
      { cat: 'Gourmette Cakes', name: 'Velvet Cheesecake', desc: 'Fromage à la crème vanillé et base croquante', price: 11.000, trending: false, image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad' },

      // savoury bites
      { cat: 'Savoury Bites', name: 'Avocado Toast', desc: 'Pain au levain, avocat frais, graines et piment', price: 14.500, trending: true, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8' },
      { cat: 'Savoury Bites', name: 'Quiche Lorraine', desc: 'Tarte salée traditionnelle au bacon et fromage', price: 12.000, trending: false, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26' },
      { cat: 'Savoury Bites', name: 'Smoked Salmon Bagel', desc: 'Cream cheese, saumon fumé et aneth', price: 16.000, trending: true, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666' },
    ];

    for (const p of products) {
      const catId = categoryMap[p.cat];
      if (catId) {
        await client.query(`
          INSERT INTO products (category_id, name, description, price, image_url, is_active, is_trending)
          VALUES ($1, $2, $3, $4, $5, true, $6)
          ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            image_url = EXCLUDED.image_url,
            is_trending = EXCLUDED.is_trending
        `, [catId, p.name, p.desc, p.price, p.image, p.trending]);
      }
    }
    
    // =====================================================
    // SEED LOYALTY ACCOUNTS
    // =====================================================
    console.log('💳 Création des comptes de loyauté...');
    await client.query(`
      INSERT INTO loyalty_accounts (customer_name, customer_id_number, phone_number, points, total_earned)
      VALUES 
        ('Ahmed', '12345', '22111333', 120, 1000),
        ('Fatima', '67890', '55444666', 350, 2500),
        ('Mohammed', '11223', '99888777', 50, 200)
      ON CONFLICT (customer_name, customer_id_number) DO NOTHING
    `);
    
    await client.query('COMMIT');
    console.log('✅ Seed gourmet terminé avec succès!');
    
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
