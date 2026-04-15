/**
 * seed-menu.js
 * Vide et re-seed les catégories + produits avec une vraie carte de coffee shop.
 * Usage: node seed-menu.js
 */

const pool = require('./src/database/pool');

// ─── Catégories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Espresso & Café',     type: 'drink',   display_order: 1 },
  { name: 'Boissons Chaudes',    type: 'drink',   display_order: 2 },
  { name: 'Boissons Froides',    type: 'drink',   display_order: 3 },
  { name: 'Pâtisseries',         type: 'dessert', display_order: 4 },
  { name: 'Gâteaux & Tartes',    type: 'dessert', display_order: 5 },
];

// ─── Produits ─────────────────────────────────────────────────────────────────
// cat: index dans CATEGORIES (0 à 4)
const PRODUCTS = [

  // ── Espresso & Café ──────────────────────────────────────────────────────
  {
    cat: 0, name: 'Espresso', trending: false, price: 2.50,
    description: 'Shot d\'espresso serré, intense et corsé',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 0, name: 'Double Espresso', trending: false, price: 3.50,
    description: 'Double dose pour les amateurs de café fort',
    image: 'https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 0, name: 'Ristretto', trending: false, price: 2.80,
    description: 'Extrait court, très concentré et doux en amertume',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 0, name: 'Lungo', trending: false, price: 2.80,
    description: 'Extraction longue, plus légère et aromatique',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510bd652?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 0, name: 'Americano', trending: true, price: 3.00,
    description: 'Espresso allongé à l\'eau chaude, doux et équilibré',
    image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 0, name: 'Café Noisette', trending: false, price: 3.20,
    description: 'Espresso avec une touche de lait pour adoucir',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400',
  },

  // ── Boissons Chaudes ─────────────────────────────────────────────────────
  {
    cat: 1, name: 'Cappuccino', trending: true, price: 4.50,
    description: 'Espresso, lait chaud et mousse onctueuse en parts égales',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Latte', trending: true, price: 4.80,
    description: 'Grande tasse de lait velouté sur espresso, saveur douce',
    image: 'https://images.unsplash.com/photo-1561882468-9110d70b2187?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Flat White', trending: false, price: 4.50,
    description: 'Microfoam de lait soyeux sur double ristretto',
    image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Macchiato', trending: false, price: 3.80,
    description: 'Espresso marqué d\'une cuillère de mousse de lait',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510bd652?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Mocha', trending: true, price: 5.50,
    description: 'Espresso, chocolat fondu, lait chaud et chantilly',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Cortado', trending: false, price: 3.50,
    description: 'Espresso coupé d\'une égale quantité de lait chaud',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Chocolat Chaud', trending: false, price: 4.50,
    description: 'Cacao premium fondu dans du lait entier bien chaud',
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Chai Latte', trending: true, price: 5.00,
    description: 'Épices indiennes (cannelle, cardamome, gingembre) au lait chaud',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 1, name: 'Matcha Latte', trending: true, price: 5.50,
    description: 'Poudre de thé vert japonais premium fouettée au lait',
    image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&q=80&w=400',
  },

  // ── Boissons Froides ─────────────────────────────────────────────────────
  {
    cat: 2, name: 'Cold Brew', trending: true, price: 5.50,
    description: 'Café infusé à froid pendant 18h, lisse et rafraîchissant',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 2, name: 'Frappuccino Café', trending: true, price: 6.50,
    description: 'Café mixé avec glaçons, lait et sirop, surmonté de chantilly',
    image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 2, name: 'Iced Latte', trending: false, price: 5.00,
    description: 'Espresso versé sur des glaçons avec du lait frais',
    image: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 2, name: 'Iced Matcha Latte', trending: true, price: 6.00,
    description: 'Matcha premium sur glaçons avec lait d\'avoine ou entier',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 2, name: 'Limonade Menthe', trending: false, price: 4.50,
    description: 'Citron pressé, menthe fraîche, eau gazeuse et sucre de canne',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 2, name: 'Smoothie Fruits Rouges', trending: false, price: 6.00,
    description: 'Fraises, framboises et myrtilles mixés avec yaourt grec',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=400',
  },

  // ── Pâtisseries ──────────────────────────────────────────────────────────
  {
    cat: 3, name: 'Croissant Beurre', trending: false, price: 3.00,
    description: 'Croissant feuilleté au beurre fin, cuit à la demande',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 3, name: 'Pain au Chocolat', trending: true, price: 3.50,
    description: 'Deux barres de chocolat noir dans une pâte feuilletée dorée',
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 3, name: 'Croissant Amande', trending: true, price: 4.00,
    description: 'Croissant garni de crème d\'amande et amandes effilées',
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 3, name: 'Chausson aux Pommes', trending: false, price: 3.50,
    description: 'Compotée de pommes cannelle dans une pâte feuilletée croustillante',
    image: 'https://images.unsplash.com/photo-1560180474-e8563fd75bab?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 3, name: 'Muffin Myrtilles', trending: false, price: 3.20,
    description: 'Muffin moelleux aux myrtilles fraîches avec sucre perlé',
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 3, name: 'Cookie Chocolat', trending: true, price: 2.80,
    description: 'Cookie croustillant dehors, fondant dedans, pépites de chocolat',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=400',
  },

  // ── Gâteaux & Tartes ─────────────────────────────────────────────────────
  {
    cat: 4, name: 'Brownie Chocolat', trending: true, price: 4.50,
    description: 'Brownie ultra fondant au chocolat noir 70%, noix de pécan',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 4, name: 'Cheesecake New York', trending: true, price: 6.50,
    description: 'Cheesecake crémeux sur base de spéculoos, coulis de fraise',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 4, name: 'Tarte Citron Meringuée', trending: false, price: 5.50,
    description: 'Crème citron acidulée sur fond sablé avec meringue italienne',
    image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 4, name: 'Éclair au Café', trending: true, price: 4.50,
    description: 'Pâte à choux garnie de crème pâtissière café, glaçage fondant',
    image: 'https://images.unsplash.com/photo-1612197527762-8cfb600b5bc4?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 4, name: 'Mille-Feuille Vanille', trending: false, price: 5.50,
    description: 'Feuilletage caramélisé, crème diplomate vanille de Madagascar',
    image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&q=80&w=400',
  },
  {
    cat: 4, name: 'Tiramisu', trending: true, price: 6.00,
    description: 'Biscuits imbibés d\'espresso, mascarpone léger, cacao amer',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=400',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    await client.query('COMMIT');
    // Ajouter 'food' à l'ENUM si pas encore présent
    try {
      await client.query("ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'food'");
    } catch (_) {}

    await client.query('BEGIN');

    console.log('🗑  Suppression des anciens produits et catégories…');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    console.log('\n📂 Insertion des catégories…');
    const catIds = [];
    for (const cat of CATEGORIES) {
      const res = await client.query(
        'INSERT INTO categories (name, type, display_order) VALUES ($1,$2,$3) RETURNING id',
        [cat.name, cat.type, cat.display_order]
      );
      catIds.push(res.rows[0].id);
      console.log(`   ✓ ${cat.name}`);
    }

    console.log('\n☕ Insertion des produits…');
    for (const p of PRODUCTS) {
      const catId = catIds[p.cat];
      await client.query(
        `INSERT INTO products (name, description, price, image_url, category_id, is_active, is_trending, is_seasonal)
         VALUES ($1,$2,$3,$4,$5,true,$6,false)`,
        [p.name, p.description, p.price, p.image, catId, p.trending]
      );
      const flag = p.trending ? '🔥' : '  ';
      console.log(`   ${flag} ${p.name.padEnd(26)} — ${p.price.toFixed(2)} DA`);
    }

    await client.query('COMMIT');
    console.log(`\n✅ Terminé ! ${CATEGORIES.length} catégories et ${PRODUCTS.length} produits insérés.`);
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erreur — rollback:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
