const axios = require('axios');

async function checkDashboard() {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/loyalty');
    console.log('Dashboard Loyalty Accounts:', res.data.data.accounts.map(a => `${a.customer_name} - ${a.phone_number} - ${a.points} pts`));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkDashboard();
