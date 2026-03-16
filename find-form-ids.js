// Google Forms Field ID Finder Helper

console.log(`
🔍 FIND GOOGLE FORMS FIELD IDs

After creating your Google Form, follow these steps:

1. 📋 Open your Google Form
2. 👁️ Click "Preview" (eye icon)
3. 🖱️ Right-click on preview page → "View Page Source"
4. 🔍 Press Ctrl+F (Cmd+F) and search for: entry.
5. 📝 Look for patterns like this:

   name="entry.1234567890"  ← This is your field ID!

6. 🎯 Match them to your fields:

EXAMPLE FIELD MAPPINGS:
======================
// First field (Feedback Type) 
feedbackType: 'entry.1234567890',

// Second field (Rating)
rating: 'entry.2345678901', 

// Third field (Feedback Text)
feedback: 'entry.3456789012',

// Fourth field (Issue Type)
issueType: 'entry.4567890123',

// Fifth field (Extension Version)
version: 'entry.5678901234',

// Sixth field (Platform)
platform: 'entry.6789012345',

// Seventh field (Beta Features)
testedFeatures: 'entry.7890123456'

💡 TIPS:
- Field IDs appear in the same order as your form fields
- Each field has a unique entry.xxxxxxxxxx ID
- Copy ONLY the numbers after "entry."
- Double-check by looking at field names in the source

🧪 QUICK TEST METHOD:
1. Submit a test response to your form manually
2. Check if it appears in your Google Form responses
3. If it works manually, the IDs are correct!

Once you have your IDs, replace them in options.js:

const FIELD_MAPPING = {
  feedbackType: 'entry.YOUR_ID_HERE',
  rating: 'entry.YOUR_ID_HERE', 
  feedback: 'entry.YOUR_ID_HERE',
  issueType: 'entry.YOUR_ID_HERE',
  version: 'entry.YOUR_ID_HERE',
  platform: 'entry.YOUR_ID_HERE',
  testedFeatures: 'entry.YOUR_ID_HERE'
};
`);

// Also provide a bookmarklet for easier field ID extraction
const bookmarklet = `
javascript:(function(){
  const entries = [];
  document.querySelectorAll('[name^="entry."]').forEach((input, index) => {
    const id = input.name;
    const label = input.closest('.freebirdFormviewerViewItemsItemItem')?.querySelector('.freebirdFormviewerViewItemsItemItemTitleContainer')?.textContent || 'Unknown field';
    entries.push({index: index + 1, id: id, label: label.trim()});
  });
  
  let output = 'GOOGLE FORMS FIELD IDs:\\n\\n';
  entries.forEach(entry => {
    output += \`Field \${entry.index}: \${entry.label}\\n\`;
    output += \`ID: \${entry.id}\\n\\n\`;
  });
  
  output += 'Copy these IDs to your options.js FIELD_MAPPING!';
  
  alert(output);
  console.log('Field IDs:', entries);
})();
`;

console.log(`
🔖 BONUS: BOOKMARKLET FOR EASY ID EXTRACTION
============================================

Copy this entire line and save it as a bookmark:

${bookmarklet}

Then:
1. Go to your Google Form preview
2. Click the bookmarklet 
3. It will show you all field IDs in a popup!

This makes finding field IDs much easier! 🎉
`);

console.log(`
📧 FINAL CHECKLIST:
===================
□ Created Google Form with 7 fields
□ Found all entry.xxxxxxxx field IDs
□ Updated FIELD_MAPPING in options.js
□ Updated GOOGLE_FORMS_URL with your form ID
□ Enabled email notifications in Google Forms
□ Tested feedback submission
□ Received email notification

Once all checked, you're ready to receive feedback! ✅
`);

module.exports = { bookmarklet };