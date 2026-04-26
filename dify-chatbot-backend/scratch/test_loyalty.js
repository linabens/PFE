const axios = require('axios');

async function testLoyalty() {
  try {
    console.log('Testing Loyalty Registration...');
    const regRes = await axios.post('http://localhost:3000/api/loyalty/register', {
      customer_name: 'Test Mobile User',
      phone_number: '12345678'
    });
    console.log('Registration Success:', regRes.data);

    console.log('\nTesting Loyalty Login...');
    const loginRes = await axios.post('http://localhost:3000/api/loyalty/login', {
      phone_number: '12345678'
    });
    console.log('Login Success:', loginRes.data);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testLoyalty();
