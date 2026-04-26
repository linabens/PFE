const axios = require('axios');

async function testAnalytics() {
  try {
    console.log('Fetching Analytics Data for 7 days...');
    const res = await axios.get('http://localhost:3000/api/admin/analytics?period=7', {
      headers: {
        // Need to pass a valid admin token, but we can't easily without login.
        // Actually, maybe I can just test the function directly via the controller.
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testAnalytics();
