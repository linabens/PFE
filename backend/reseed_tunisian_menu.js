const pool = require('./src/database/pool');

async function reseed() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Nettoyage de la base de données...');
    await client.query('BEGIN');

    // Supprimer les produits et catégories existants
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    console.log('📁 Création des catégories Tunisiennes...');
    const categories = [
      { name: 'Cafés & Traditions', type: 'coffee', order: 1 },
      { name: 'Thés & Infusions', type: 'coffee', order: 2 },
      { name: 'Jus & Fraîcheur', type: 'cold', order: 3 },
      { name: 'Petit Déjeuner Tunisien', type: 'food', order: 4 },
      { name: 'Pâtisseries & Gourmandises', type: 'special', order: 5 },
      { name: 'Snacks Salés', type: 'food', order: 6 },
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const res = await client.query(`
        INSERT INTO categories (name, type, display_order)
        VALUES ($1, $2, $3)
        RETURNING id, name
      `, [cat.name, cat.type, cat.order]);
      categoryMap[cat.name] = res.rows[0].id;
    }

    console.log('☕ Ajout des produits typiques...');
    const products = [
      // Cafés
      { cat: 'Cafés & Traditions', name: 'Café Direct', desc: 'L\'incontournable mélange espresso et lait chaud', price: 2.800, trending: true, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772' },
      { cat: 'Cafés & Traditions', name: 'Café Express (Illy)', desc: 'Espresso pur et intense', price: 2.500, trending: false, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04' },
      { cat: 'Cafés & Traditions', name: 'Café Turc à la Zhar', desc: 'Café traditionnel à la fleur d\'oranger', price: 3.500, trending: true, image: 'https://images.unsplash.com/photo-1599398054066-846f28917f38' },
      { cat: 'Cafés & Traditions', name: 'Cappuccino Chantilly', desc: 'Pour les gourmands de mousse de lait', price: 4.800, trending: false, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d' },

      // Thés
      { cat: 'Thés & Infusions', name: 'Thé aux Pignons', desc: 'Thé noir traditionnel servi avec des pignons de pin royaux', price: 6.500, trending: true, image: 'file:///C:/Users/HP/.gemini/antigravity/brain/c860ffb0-65f5-43f6-a262-b7a5493b1e5f/tunisian_mint_tea_pine_nuts_1778004073034.png' },
      { cat: 'Thés & Infusions', name: 'Thé à la Menthe', desc: 'Thé vert infusé à la menthe fraîche', price: 2.500, trending: false, image: 'https://images.unsplash.com/photo-144933325662ef-447543818e80' },
      { cat: 'Thés & Infusions', name: 'Thé aux Amandes', desc: 'Thé noir servi avec des amandes grillées', price: 5.500, trending: false, image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570' },

      // Jus
      { cat: 'Jus & Fraîcheur', name: 'Citronnade Maison', desc: 'Citronnade tunisienne artisanale très rafraîchissante', price: 4.500, trending: true, image: 'file:///C:/Users/HP/.gemini/antigravity/brain/c860ffb0-65f5-43f6-a262-b7a5493b1e5f/tunisian_citronnade_fresh_1778004086402.png' },
      { cat: 'Jus & Fraîcheur', name: 'Jus d\'Orange Frais', desc: 'Orange pur jus pressé minute', price: 5.500, trending: false, image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b7' },
      { cat: 'Jus & Fraîcheur', name: 'Panaché Fruits', desc: 'Mélange de fruits de saison frais', price: 7.500, trending: true, image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe' },

      // Petit Déjeuner
      { cat: 'Petit Déjeuner Tunisien', name: 'Petit Déj "Sidi Bou"', desc: 'Tabouna, huile d\'olive, miel, chamia, fromage et oeuf', price: 14.500, trending: true, image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666' },
      { cat: 'Petit Déjeuner Tunisien', name: 'Assiette Omek Houria', desc: 'Carottes écrasées traditionnelles, harissa et thon', price: 8.500, trending: false, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836' },

      // Sucrés
      { cat: 'Pâtisseries & Gourmandises', name: 'Bambalouni', desc: 'Le beignet traditionnel tunisien saupoudré de sucre', price: 2.500, trending: true, image: 'file:///C:/Users/HP/.gemini/antigravity/brain/c860ffb0-65f5-43f6-a262-b7a5493b1e5f/bambalouni_traditional_1778004106638.png' },
      { cat: 'Pâtisseries & Gourmandises', name: 'Assidat Zgougou', desc: 'Coupe de crème de pignons de pin d\'Alep décorée', price: 8.500, trending: true, image: 'https://images.unsplash.com/photo-1571115177098-24c42de1bd0f' },
      { cat: 'Pâtisseries & Gourmandises', name: 'Baklawa (3 pièces)', desc: 'Pâtisserie fine aux amandes et miel', price: 6.000, trending: false, image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13' },

      // Salés
      { cat: 'Snacks Salés', name: 'Trio de Fricassés', desc: 'Mini sandwichs frits au thon, olives et harissa', price: 7.500, trending: true, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8' },
      { cat: 'Snacks Salés', name: 'Brick à l\'Oeuf', desc: 'Feuille de brick croustillante, oeuf, thon et persil', price: 4.500, trending: true, image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26' },
    ];

    for (const p of products) {
      const catId = categoryMap[p.cat];
      await client.query(`
        INSERT INTO products (category_id, name, description, price, image_url, is_active, is_trending)
        VALUES ($1, $2, $3, $4, $5, true, $6)
      `, [catId, p.name, p.desc, p.price, p.image, p.trending]);
    }

    await client.query('COMMIT');
    console.log('✅ Menu Tunisien installé avec succès!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

reseed();
