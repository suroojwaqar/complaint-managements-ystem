// Test script to verify phone number formatting
// Run with: node scripts/test-phone-format.js

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  
  // If number starts with 0, replace with country code (assuming Pakistan +92)
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  
  // If no country code, add Pakistan code
  if (!cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  
  return cleaned + '@c.us';
}

// Test different phone number formats
const testNumbers = [
  '0334398234',    // Pakistani local format
  '334398234',     // Without leading zero
  '923343982340',  // With country code
  '+923343982340', // With + and country code
];

console.log('=== PHONE NUMBER FORMATTING TEST ===');
testNumbers.forEach(number => {
  const formatted = formatPhoneNumber(number);
  console.log(`${number} → ${formatted}`);
});

console.log('\n=== YOUR EXAMPLE FROM WAAPI DOCS ===');
console.log('Expected: 0334398234@c.us');
console.log('Our format:', formatPhoneNumber('0334398234'));

console.log('\n=== RECOMMENDATION ===');
console.log('Use your actual WhatsApp number in format: 923001234567');
console.log('This will become: 923001234567@c.us');