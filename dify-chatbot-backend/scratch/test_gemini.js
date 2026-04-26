// Test the chatbot with multiple question types
const questions = [
  'Hello!',
  'What is on the menu?',
  'How much is a latte?',
  'Revenue summary',
  'What is trending?',
  'How to manage staff?',
  'Tell me about tables and QR codes',
  'How to create a promotion?',
  'Help',
  'What is an espresso?',
];

async function test() {
  for (const q of questions) {
    try {
      const res = await fetch('http://localhost:3001/chat/guest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: q }),
      });
      const data = await res.json();
      if (data.success) {
        const preview = data.data.message.content.substring(0, 100).replace(/\n/g, ' ');
        console.log(`✅ "${q}" → ${preview}...`);
      } else {
        console.log(`❌ "${q}" → FAIL`);
      }
    } catch (e) {
      console.log(`❌ "${q}" → ERROR: ${e.message}`);
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }
}

test();
