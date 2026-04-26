const pool = require('../src/database/pool');

async function seedPromotions() {
  const promotions = [
    {
      title: 'Happy Hour !',
      subtitle: '50% sur tous les espressos de 16h à 18h',
      tag: 'OFFRE LIMITÉE',
      image_url: 'https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?q=80&w=1000&auto=format&fit=crop',
      display_order: 1
    },
    {
      title: 'Nouveau : Latte Pistache',
      subtitle: 'Une douceur onctueuse à découvrir absolument',
      tag: 'NOUVEAU',
      image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1000&auto=format&fit=crop',
      display_order: 2
    },
    {
      title: 'Petit Déjeuner Complet',
      subtitle: 'Café + Croissant + Jus pour seulement 12 DT',
      tag: 'MATIN',
      image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1000&auto=format&fit=crop',
      display_order: 3
    }
  ];

  try {
    console.log('Seeding promotions...');
    for (const p of promotions) {
      await pool.query(
        'INSERT INTO promotions (title, subtitle, tag, image_url, display_order) VALUES ($1, $2, $3, $4, $5)',
        [p.title, p.subtitle, p.tag, p.image_url, p.display_order]
      );
    }
    console.log('Successfully seeded promotions!');
  } catch (err) {
    console.error('Error seeding promotions:', err);
  } finally {
    await pool.end();
  }
}

seedPromotions();
