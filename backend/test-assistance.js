/**
 * Script de test pour les routes Call Waiter
 * Utilisez: node test-assistance.js
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

async function testAssistance() {
  console.log('🧪 Test des routes Call Waiter\n');
  
  // Test 1: Appeler un serveur (Call Waiter) - Utiliser la table 3 pour éviter les conflits
  console.log('1️⃣ Test: Appeler un serveur (Table 3)');
  const callWaiterResult = await request('POST', '/api/assistance', {
    table_id: 3
  });
  
  if (callWaiterResult.error) {
    console.error('❌ Erreur:', callWaiterResult.error);
    console.log('\n⚠️  Assurez-vous que le serveur est démarré (npm run dev)');
    return;
  }
  
  if (callWaiterResult.status === 201 && callWaiterResult.data.success) {
    console.log('✅ Serveur appelé avec succès!');
    console.log('   ID:', callWaiterResult.data.data.id);
    console.log('   Table:', callWaiterResult.data.data.table_number);
    console.log('   Statut:', callWaiterResult.data.data.status);
    console.log('   Demandé à:', callWaiterResult.data.data.requested_at);
    
    const requestId = callWaiterResult.data.data.id;
    
    // Test 2: Récupérer toutes les demandes en attente
    console.log('\n2️⃣ Test: Récupérer les demandes en attente');
    const pendingResult = await request('GET', '/api/assistance/pending');
    
    if (pendingResult.data.success) {
      console.log('✅ Demandes en attente récupérées!');
      console.log('   Nombre de demandes:', pendingResult.data.count);
      if (pendingResult.data.data.length > 0) {
        console.log('   Première demande - Table:', pendingResult.data.data[0].table_number);
      }
    } else {
      console.log('❌ Erreur:', pendingResult.data.error);
    }
    
    // Test 3: Récupérer une demande par ID
    console.log('\n3️⃣ Test: Récupérer la demande par ID');
    const getRequestResult = await request('GET', `/api/assistance/${requestId}`);
    
    if (getRequestResult.data.success) {
      console.log('✅ Demande récupérée!');
      console.log('   Table:', getRequestResult.data.data.table_number);
      console.log('   Statut:', getRequestResult.data.data.status);
    } else {
      console.log('❌ Erreur:', getRequestResult.data.error);
    }
    
    // Test 4: Marquer comme traitée
    console.log('\n4️⃣ Test: Marquer la demande comme traitée');
    const handleResult = await request('PATCH', `/api/assistance/${requestId}/handle`);
    
    if (handleResult.data.success) {
      console.log('✅ Demande marquée comme traitée!');
      console.log('   Statut:', handleResult.data.data.status);
      console.log('   Traitée à:', handleResult.data.data.handled_at);
    } else {
      console.log('❌ Erreur:', handleResult.data.error);
    }
    
    // Test 5: Récupérer l'historique d'une table
    console.log('\n5️⃣ Test: Récupérer l\'historique de la table 3');
    const tableHistoryResult = await request('GET', '/api/assistance/table/3');
    
    if (tableHistoryResult.data.success) {
      console.log('✅ Historique récupéré!');
      console.log('   Nombre de demandes:', tableHistoryResult.data.data.length);
    } else {
      console.log('❌ Erreur:', tableHistoryResult.data.error);
    }
    
    // Test 6: Essayer d'appeler à nouveau (devrait échouer car déjà une demande en attente)
    console.log('\n6️⃣ Test: Essayer d\'appeler à nouveau (devrait échouer)');
    const duplicateResult = await request('POST', '/api/assistance', {
      table_id: 3
    });
    
    if (duplicateResult.status === 409) {
      console.log('✅ Protection contre les doublons fonctionne!');
      console.log('   Message:', duplicateResult.data.error);
    } else {
      console.log('⚠️  Comportement inattendu:', duplicateResult.data);
    }
    
  } else {
    console.log('❌ Erreur lors de l\'appel:', callWaiterResult.data);
  }
  
  console.log('\n✅ Tests terminés!');
}

// Vérifier si fetch est disponible
if (typeof fetch === 'undefined') {
  console.log('⚠️  Node.js 18+ requis pour fetch.');
  process.exit(1);
}

testAssistance().catch(console.error);

