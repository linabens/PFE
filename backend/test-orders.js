/**
 * Script de test pour les routes de commandes
 * Utilisez: node test-orders.js
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

async function testOrders() {
  console.log('🧪 Test des routes de commandes\n');
  
  // Test 1: Créer une commande
  console.log('1️⃣ Test: Créer une commande');
  const createOrderData = {
    table_id: 1,
    items: [
      {
        product_id: 11, // Cappuccino
        quantity: 2,
        options: []
      },
      {
        product_id: 14, // Café Glacé
        quantity: 1,
        options: []
      }
    ]
  };
  
  const createResult = await request('POST', '/api/orders', createOrderData);
  
  if (createResult.error) {
    console.error('❌ Erreur:', createResult.error);
    console.log('\n⚠️  Assurez-vous que le serveur est démarré (npm run dev)');
    return;
  }
  
  if (createResult.status === 201 && createResult.data.success) {
    console.log('✅ Commande créée avec succès!');
    console.log('   ID:', createResult.data.data.id);
    console.log('   Table:', createResult.data.data.table_number);
    console.log('   Total:', createResult.data.data.total_price, '€');
    console.log('   Statut:', createResult.data.data.status);
    
    const orderId = createResult.data.data.id;
    
    // Test 2: Récupérer la commande par ID
    console.log('\n2️⃣ Test: Récupérer la commande par ID');
    const getOrderResult = await request('GET', `/api/orders/${orderId}`);
    
    if (getOrderResult.data.success) {
      console.log('✅ Commande récupérée!');
      console.log('   Items:', getOrderResult.data.data.items.length);
    } else {
      console.log('❌ Erreur:', getOrderResult.data.error);
    }
    
    // Test 3: Mettre à jour le statut
    console.log('\n3️⃣ Test: Mettre à jour le statut');
    const updateStatusResult = await request('PATCH', `/api/orders/${orderId}/status`, {
      status: 'brewing'
    });
    
    if (updateStatusResult.data.success) {
      console.log('✅ Statut mis à jour!');
      console.log('   Nouveau statut:', updateStatusResult.data.data.status);
    } else {
      console.log('❌ Erreur:', updateStatusResult.data.error);
    }
    
    // Test 4: Récupérer les commandes de la table
    console.log('\n4️⃣ Test: Récupérer les commandes de la table 1');
    const tableOrdersResult = await request('GET', '/api/orders/table/1');
    
    if (tableOrdersResult.data.success) {
      console.log('✅ Commandes de la table récupérées!');
      console.log('   Nombre de commandes:', tableOrdersResult.data.data.length);
    } else {
      console.log('❌ Erreur:', tableOrdersResult.data.error);
    }
    
  } else {
    console.log('❌ Erreur lors de la création:', createResult.data);
  }
  
  // Test 5: Récupérer les commandes actives
  console.log('\n5️⃣ Test: Récupérer les commandes actives');
  const activeOrdersResult = await request('GET', '/api/orders/active/list');
  
  if (activeOrdersResult.data.success) {
    console.log('✅ Commandes actives récupérées!');
    console.log('   Nombre de commandes actives:', activeOrdersResult.data.data.length);
  } else {
    console.log('❌ Erreur:', activeOrdersResult.data.error);
  }
  
  console.log('\n✅ Tests terminés!');
}

// Vérifier si fetch est disponible (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  Node.js 18+ requis pour fetch. Utilisez une autre méthode de test.');
  console.log('\nOu installez node-fetch: npm install node-fetch');
  process.exit(1);
}

testOrders().catch(console.error);

