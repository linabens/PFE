const pool = require('./pool');

async function seedGames() {
  const client = await pool.connect();

  try {
    console.log('🎮 Démarrage du seed des jeux...');
    await client.query('BEGIN');

    // ── 1. Insert the 3 games ──────────────────────────────────────────────────
    console.log('📋 Insertion des jeux...');
    const gamesResult = await client.query(`
      INSERT INTO games (name, is_active)
      VALUES
        ('Quiz Culture & Café', true),
        ('Puzzle Image',        true),
        ('Mots Mélangés',       true)
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `);

    // Find IDs by name (handle ON CONFLICT DO NOTHING)
    const allGames = await client.query(`SELECT id, name FROM games ORDER BY id`);
    const quizGame    = allGames.rows.find(g => g.name === 'Quiz Culture & Café');
    const puzzleGame  = allGames.rows.find(g => g.name === 'Puzzle Image');
    const wordGame    = allGames.rows.find(g => g.name === 'Mots Mélangés');

    if (!quizGame || !puzzleGame || !wordGame) {
      throw new Error('Games not found after insert — check for name conflicts.');
    }

    console.log(`  ✅ Quiz ID:${quizGame.id} | Puzzle ID:${puzzleGame.id} | Mots ID:${wordGame.id}`);

    // ── 2. Quiz Questions (20 questions coffee + culture + santé) ──────────────
    console.log('❓ Insertion des questions de quiz...');
    await client.query(`
      INSERT INTO game_questions
        (game_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, points)
      VALUES
        ($1,'D''où vient le café ?','Brésil','Éthiopie','Colombie','Vietnam','b','Le café est originaire d''Éthiopie, découvert vers le IXe siècle.','easy',10),
        ($1,'Quelle boisson contient le plus de caféine ?','Café expresso','Thé noir','Café filtre','Red Bull','c','Un café filtre contient plus de caféine qu''un expresso en raison du volume.','medium',15),
        ($1,'Qu''est-ce qu''un "barista" ?','Serveur dans un restaurant','Expert en préparation du café','Producteur de café','Importateur de café','b','Un barista est un professionnel spécialisé dans la préparation de boissons à base de café.','easy',10),
        ($1,'Quel pays produit le plus de café au monde ?','Colombie','Vietnam','Éthiopie','Brésil','d','Le Brésil est le premier producteur mondial de café depuis le XIXe siècle.','medium',15),
        ($1,'Qu''est-ce qu''un "Americano" ?','Expresso allongé avec eau chaude','Café au lait','Café glacé','Café avec crème fouettée','a','Un Americano est un expresso dilué avec de l''eau chaude.','easy',10),
        ($1,'Combien de grains de café faut-il pour faire un expresso ?','20-25 grains','42-48 grains','60-70 grains','10-15 grains','b','En moyenne 42 à 48 grains de café sont nécessaires pour un expresso.','medium',15),
        ($1,'Qu''est-ce qu''un "Latte" ?','Café noir fort','Café avec lait mousseux','Café glacé sucré','Café avec chocolat','b','Un latte est composé d''un expresso et de beaucoup de lait vapeur avec peu de mousse.','easy',10),
        ($1,'Quelle température est idéale pour infuser le café ?','65°C','85-96°C','100°C','70°C','b','La température idéale est entre 85 et 96°C pour extraire les saveurs optimales.','medium',15),
        ($1,'Combien de tasses de café par jour est considéré sain ?','1 tasse','3-4 tasses','8 tasses','10 tasses','b','La plupart des études suggèrent que 3 à 4 tasses par jour est sans risque pour la santé.','medium',15),
        ($1,'Qu''est-ce que le "Cold Brew" ?','Café chauffé rapidement','Café infusé à froid pendant 12-24h','Café avec glace pilée','Café réfrigéré','b','Le Cold Brew est préparé en infusant du café grossièrement moulu dans l''eau froide.','medium',15),
        ($1,'Quel est le symbole chimique de la caféine ?','Ca','C8H10N4O2','CH4','C6H12O6','b','La formule chimique de la caféine est C8H10N4O2.','hard',20),
        ($1,'Qu''est-ce que le "crema" dans un expresso ?','Mousse de lait','Couche dorée à la surface','Poudre de cacao','Édulcorant naturel','b','Le crema est la couche brun-dorée crémeuse qui se forme à la surface d''un bon expresso.','medium',15),
        ($1,'Quel continent est le plus grand consommateur de café ?','Asie','Amérique du Nord','Europe','Afrique','c','L''Europe est le premier continent consommateur de café au monde.','hard',20),
        ($1,'Combien de temps faut-il pour un café de spécialité à mûrir ?','3 mois','9 à 11 mois','2 ans','1 mois','b','Le caféier prend généralement 9 à 11 mois pour produire des cerises mûres.','hard',20),
        ($1,'Qu''est-ce que le "décaféiné" ?','Café sans sucre','Café à faible teneur en caféine','Café biologique','Café fort','b','Le café décaféiné a subi un processus pour éliminer la majeure partie de sa caféine.','easy',10),
        ($1,'Quel pays est le plus grand exportateur de café robusta ?','Brésil','Colombie','Vietnam','Indonésie','c','Le Vietnam est le premier exportateur mondial de café robusta.','hard',20),
        ($1,'Que signifie "espresso" en italien ?','Rapide','Pressé','Exprimé/Extrait','Chaud','c','Le mot espresso vient de l''italien "esprimere" qui signifie exprimer/extraire.','medium',15),
        ($1,'Combien de milligrammes de caféine dans un expresso moyen ?','30 mg','63 mg','120 mg','200 mg','b','Un expresso standard contient environ 63 mg de caféine.','medium',15),
        ($1,'Qu''est-ce qu''un "macchiato" ?','Café avec un peu de lait','Grand café au lait','Café glacé','Café sucré','a','Un macchiato est un expresso "taché" (macchiato en italien) d''un nuage de lait.','easy',10),
        ($1,'À quelle altitude pousse le meilleur café ?','0-500m','500-1000m','1000-2000m','Plus de 3000m','c','Le café de haute qualité pousse entre 1000 et 2000 mètres d''altitude.','hard',20)
    `, [quizGame.id]);

    // ── 3. Puzzles (5 images coffee-themed) ───────────────────────────────────
    console.log('🧩 Insertion des puzzles...');
    await client.query(`
      INSERT INTO game_puzzles (game_id, image_url, title, grid_size, difficulty)
      VALUES
        ($1, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', 'Tasse de café parfaite',   3, 'easy'),
        ($1, 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600', 'Grains de café frais',     3, 'medium'),
        ($1, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600', 'Latte Art',                4, 'hard'),
        ($1, 'https://images.unsplash.com/photo-1520970014086-2208d157c9e2?w=600', 'Machine à espresso',       3, 'medium'),
        ($1, 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600', 'Café et pâtisseries',      2, 'easy')
    `, [puzzleGame.id]);

    // ── 4. Word Scramble (20 mots autour du café et de la santé) ─────────────
    console.log('🔤 Insertion des mots mélangés...');
    await client.query(`
      INSERT INTO game_words (game_id, original_word, hint, category, points)
      VALUES
        ($1, 'ARABICA',    'Variété de café la plus populaire au monde',         'Café',    10),
        ($1, 'ROBUSTA',    'Variété de café avec plus de caféine',               'Café',    10),
        ($1, 'ESPRESSO',   'Café fort extrait sous pression',                    'Café',    15),
        ($1, 'CAPPUCCINO', 'Café avec lait mousseux en égales proportions',      'Café',    20),
        ($1, 'BARISTA',    'Expert en préparation du café',                      'Café',    15),
        ($1, 'CAFÉINE',    'Substance stimulante présente dans le café',         'Science', 15),
        ($1, 'MOUTURE',    'Café broyé prêt à être infusé',                     'Café',    10),
        ($1, 'TORRÉFIER',  'Processus de cuisson des grains de café',            'Café',    20),
        ($1, 'ARABICA',    'Haut plateau éthiopien, berceau du café',            'Café',    10),
        ($1, 'INFUSER',    'Laisser le café se mélanger à l''eau',               'Café',    10),
        ($1, 'VITAMINES',  'Nutriments essentiels pour la santé',                'Santé',   10),
        ($1, 'PROTEINES',  'Macronutriments indispensables aux muscles',         'Santé',   15),
        ($1, 'HYDRATATION','Maintenir suffisamment d''eau dans l''organisme',    'Santé',   20),
        ($1, 'SOMMEIL',    'Phase de repos indispensable pour récupérer',        'Santé',   10),
        ($1, 'EXERCISE',   'Activité physique bénéfique pour la santé',          'Santé',   10),
        ($1, 'CROISSANT',  'Viennoiserie française en forme de lune',            'Pâtisserie',10),
        ($1, 'TIRAMISU',   'Dessert italien à base de café et mascarpone',       'Pâtisserie',15),
        ($1, 'CHEESECAKE', 'Gâteau au fromage frais',                           'Pâtisserie',15),
        ($1, 'MACARON',    'Petit gâteau coloré à base de meringue',             'Pâtisserie',15),
        ($1, 'MADELEINE',  'Petit gâteau moelleux en forme de coquillage',       'Pâtisserie',10)
    `, [wordGame.id]);

    await client.query('COMMIT');
    console.log('✅ Seed des jeux terminé avec succès!');
    console.log(`   - Quiz: 20 questions`);
    console.log(`   - Puzzle: 5 images`);
    console.log(`   - Mots: 20 mots`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur seed jeux:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedGames()
    .then(() => { pool.end(); process.exit(0); })
    .catch(() => { pool.end(); process.exit(1); });
}

module.exports = seedGames;
