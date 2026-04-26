/**
 * Script de test pour les routes de jeux
 * Utilisez: node test-games.js
 */

const BASE_URL = 'http://localhost:3000';

// Fonction helper pour faire des requêtes
async function request(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { error: error.message };
  }
}

async function testGames() {
  console.log('🧪 Test des routes de jeux\n');
  
  // Test 1: Récupérer tous les jeux
  console.log('1️⃣ Test: Récupérer tous les jeux actifs');
  const gamesResult = await request('GET', '/api/games');
  
  if (gamesResult.error) {
    console.error('❌ Erreur:', gamesResult.error);
    console.log('\n⚠️  Assurez-vous que le serveur est démarré (npm run dev)');
    return;
  }
  
  if (gamesResult.data.success) {
    console.log('✅ Jeux récupérés!');
    console.log('   Nombre de jeux:', gamesResult.data.data.length);
    
    if (gamesResult.data.data.length === 0) {
      console.log('⚠️  Aucun jeu trouvé. Exécutez: node src/database/seed-games.js');
      return;
    }
    
    const firstGame = gamesResult.data.data[0];
    console.log('   Premier jeu:', firstGame.name, '(ID:', firstGame.id + ')');
    
    const gameId = firstGame.id;
    
    // Test 2: Récupérer un jeu par ID
    console.log('\n2️⃣ Test: Récupérer le jeu par ID');
    const getGameResult = await request('GET', `/api/games/${gameId}`);
    
    if (getGameResult.data.success) {
      console.log('✅ Jeu récupéré!');
      console.log('   Nom:', getGameResult.data.data.name);
      console.log('   Actif:', getGameResult.data.data.is_active);
    } else {
      console.log('❌ Erreur:', getGameResult.data.error);
    }
    
    // Test 3: Créer une session de jeu
    console.log('\n3️⃣ Test: Créer une session de jeu');
    const playResult = await request('POST', `/api/games/${gameId}/play`, {
      table_id: 1,
      score: 85,
      reward_points: 50
    });
    
    if (playResult.status === 201 && playResult.data.success) {
      console.log('✅ Session créée avec succès!');
      console.log('   Session ID:', playResult.data.data.id);
      console.log('   Score:', playResult.data.data.score);
      console.log('   Points de récompense:', playResult.data.data.reward_points);
      
      const sessionId = playResult.data.data.id;
      
      // Test 4: Récupérer les meilleurs scores
      console.log('\n4️⃣ Test: Récupérer les meilleurs scores');
      const scoresResult = await request('GET', `/api/games/${gameId}/scores`);
      
      if (scoresResult.data.success) {
        console.log('✅ Scores récupérés!');
        console.log('   Nombre de scores:', scoresResult.data.data.length);
        if (scoresResult.data.data.length > 0) {
          console.log('   Meilleur score:', scoresResult.data.data[0].score);
        }
      } else {
        console.log('❌ Erreur:', scoresResult.data.error);
      }
      
      // Test 5: Récupérer les sessions d'une table
      console.log('\n5️⃣ Test: Récupérer les sessions de la table 1');
      const tableSessionsResult = await request('GET', `/api/games/${gameId}/table/1`);
      
      if (tableSessionsResult.data.success) {
        console.log('✅ Sessions de la table récupérées!');
        console.log('   Nombre de sessions:', tableSessionsResult.data.data.length);
      } else {
        console.log('❌ Erreur:', tableSessionsResult.data.error);
      }
      
      // Test 6: Récupérer les statistiques
      console.log('\n6️⃣ Test: Récupérer les statistiques du jeu');
      const statsResult = await request('GET', `/api/games/${gameId}/statistics`);
      
      if (statsResult.data.success) {
        console.log('✅ Statistiques récupérées!');
        console.log('   Total de parties:', statsResult.data.data.total_plays);
        console.log('   Score moyen:', Math.round(statsResult.data.data.avg_score || 0));
        console.log('   Score maximum:', statsResult.data.data.max_score || 0);
      } else {
        console.log('❌ Erreur:', statsResult.data.error);
      }
      
    } else {
      console.log('❌ Erreur lors de la création:', playResult.data);
    }
    
  } else {
    console.log('❌ Erreur:', gamesResult.data);
  }
  
  console.log('\n✅ Tests terminés!');
}

// Vérifier si fetch est disponible
if (typeof fetch === 'undefined') {
  console.log('⚠️  Node.js 18+ requis pour fetch.');
  process.exit(1);
}

testGames().catch(console.error);

