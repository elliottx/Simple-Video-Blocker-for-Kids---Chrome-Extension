// Google Forms integration for Simple Video Blocker feedback

class GoogleFormsFeedback {
  
  static generateGoogleFormsCode() {
    return `
async function submitFeedbackData(data) {
  // Google Forms submission URL (replace with your form's URL)
  const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';
  
  // Map your form field IDs here (get from Google Forms)
  const FIELD_MAPPING = {
    feedbackType: 'entry.1234567890',    // Replace with actual field ID
    rating: 'entry.2345678901',          // Replace with actual field ID  
    feedback: 'entry.3456789012',        // Replace with actual field ID
    issueType: 'entry.4567890123',       // Replace with actual field ID
    version: 'entry.5678901234',         // Replace with actual field ID
    platform: 'entry.6789012345',       // Replace with actual field ID
    testedFeatures: 'entry.7890123456'   // Replace with actual field ID
  };

  try {
    // Prepare form data
    const formData = new FormData();
    formData.append(FIELD_MAPPING.feedbackType, data.type);
    formData.append(FIELD_MAPPING.version, data.version);
    formData.append(FIELD_MAPPING.platform, data.platform);
    
    if (data.rating) {
      formData.append(FIELD_MAPPING.rating, data.rating);
    }
    
    if (data.feedback) {
      formData.append(FIELD_MAPPING.feedback, data.feedback);
    }
    
    if (data.issueType) {
      formData.append(FIELD_MAPPING.issueType, data.issueType);
    }
    
    if (data.description) {
      formData.append(FIELD_MAPPING.feedback, data.description);
    }
    
    if (data.testedFeatures) {
      formData.append(FIELD_MAPPING.testedFeatures, data.testedFeatures.join(', '));
    }

    // Submit to Google Forms
    await fetch(GOOGLE_FORMS_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors' // Required for Google Forms
    });
    
    console.log('Feedback submitted to Google Forms');
    
    // Also store locally as backup
    return new Promise((resolve) => {
      chrome.storage.local.get(['userFeedback'], (result) => {
        const existingFeedback = result.userFeedback || [];
        existingFeedback.push(data);
        
        if (existingFeedback.length > 50) {
          existingFeedback.splice(0, existingFeedback.length - 50);
        }
        
        chrome.storage.local.set({ userFeedback: existingFeedback }, () => {
          resolve();
        });
      });
    });
    
  } catch (error) {
    console.error('Error submitting to Google Forms:', error);
    throw error;
  }
}`;
  }

  static generateInstructions() {
    return `
# Google Forms Feedback Setup Instructions

## 📋 How it works:
1. Create a Google Form with fields for feedback
2. Users submit feedback through your extension
3. Feedback automatically goes to your Google Form responses
4. You get email notifications and can view in Google Sheets

## 🔧 Setup Steps:

### Step 1: Create Google Form
1. Go to https://forms.google.com
2. Create a new form titled "Video Blocker Feedback"
3. Add these fields:
   - Feedback Type (Multiple choice: General, Beta, Issue)
   - Rating (Linear scale: 1-5)
   - Feedback Text (Paragraph)
   - Issue Type (Multiple choice: various options)
   - Extension Version (Short answer)
   - Platform (Short answer)
   - Beta Features Tested (Checkboxes: Netflix, Hulu)

### Step 2: Get Form Field IDs
1. Open your form
2. Click "Preview" 
3. Right-click and "View Page Source"
4. Search for "entry." to find field IDs like "entry.1234567890"
5. Replace the field IDs in the code above

### Step 3: Get Form URL
1. In your form, click "Send"
2. Get the link and extract the form ID
3. Format: https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse
4. Replace YOUR_FORM_ID in the code above

### Step 4: Set up notifications
1. In Google Forms, go to "Responses" tab
2. Click the three dots → "Get email notifications for new responses"
3. Link to Google Sheets for easy analysis

### Step 5: Update your extension
Replace the submitFeedbackData function in options.js with the code above.

## ✅ Pros:
- ✅ Automatic submission
- ✅ Email notifications
- ✅ Google Sheets integration
- ✅ Free and reliable
- ✅ Easy data analysis
- ✅ No server setup needed

## ❌ Cons:
- ❌ Requires Google account
- ❌ Users might not trust Google Forms
- ❌ Limited customization

## 📊 You'll receive:
- Email notifications for each feedback
- Structured data in Google Sheets
- Automatic timestamps
- Easy filtering and analysis
`;
  }

  static run() {
    console.log('📋 Google Forms Feedback Setup\n');
    console.log('='.repeat(60));
    console.log(this.generateInstructions());
    console.log('\n💻 Updated JavaScript Code:');
    console.log('='.repeat(60));
    console.log(this.generateGoogleFormsCode());
    console.log('='.repeat(60));
  }
}

if (require.main === module) {
  GoogleFormsFeedback.run();
}

module.exports = GoogleFormsFeedback;