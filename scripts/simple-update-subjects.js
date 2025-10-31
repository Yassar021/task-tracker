// Simple script to check current assignments
// Since we can't access DB directly, let's check if there are any existing assignments via API

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function checkAssignments() {
  try {
    console.log('🔍 Checking existing assignments...');

    const response = await fetch(`${BASE_URL}/api/assignments`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('✅ No assignments endpoint found - database might be empty');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const assignments = await response.json();

    if (!assignments || assignments.length === 0) {
      console.log('✅ No assignments found in database');
      return;
    }

    console.log(`📊 Found ${assignments.length} assignments:`);
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.subject} - ${assignment.title}`);
    });

    // Check which subjects need updating
    const NEW_SUBJECTS = [
      "AGAMA ISLAM",
      "AGAMA KRISTEN",
      "AGAMA KATOLIK",
      "AGAMA HINDU",
      "PENDIDIKAN AGAMA",
      "PANCASILA",
      "BAHASA INDONESIA",
      "MATEMATIKA",
      "IPA",
      "IPS",
      "BAHASA INGGRIS",
      "PJOK",
      "INFORMATIKA",
      "SENI, BUDAYA DAN PRAKARYA",
      "MANDARIN"
    ];

    console.log('\n🔄 Checking which assignments need subject updates...');

    assignments.forEach(assignment => {
      if (!NEW_SUBJECTS.includes(assignment.subject)) {
        console.log(`⚠️  Needs update: "${assignment.subject}" → (find new mapping)`);
      } else {
        console.log(`✅ Already correct: "${assignment.subject}"`);
      }
    });

  } catch (error) {
    console.log('❌ Could not check assignments:', error.message);
    console.log('💡 This might mean the server is not running or database is not accessible');
  }
}

console.log('🚀 Starting subjects update check...');
checkAssignments().then(() => {
  console.log('✅ Check completed');
}).catch(error => {
  console.error('❌ Check failed:', error);
});