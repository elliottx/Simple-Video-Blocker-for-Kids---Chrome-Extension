# 📋 Google Forms Feedback Setup Guide

## Step-by-Step Instructions

### 🔧 **Step 1: Create Your Google Form**

1. **Go to** [https://forms.google.com](https://forms.google.com)
2. **Click** "Create" or "+" to make a new form
3. **Title your form**: "Simple Video Blocker - User Feedback"
4. **Add a description**: "Help us improve the Simple Video Blocker extension by sharing your experience."

### 📝 **Step 2: Add Form Fields**

Add these **exact fields** in this order:

#### Field 1: Feedback Type
- **Type**: Multiple choice
- **Question**: "What type of feedback are you providing?"
- **Options**:
  - General
  - Beta
  - Issue
- **Make required**: ✅

#### Field 2: Rating (for General/Beta feedback)
- **Type**: Linear scale
- **Question**: "How would you rate your experience?"
- **Scale**: 1 to 5
- **Labels**: 1 = Poor, 5 = Excellent
- **Make required**: ❌ (optional)

#### Field 3: Feedback Text
- **Type**: Paragraph
- **Question**: "Please share your feedback, suggestions, or describe the issue:"
- **Make required**: ✅

#### Field 4: Issue Type (for bug reports)
- **Type**: Multiple choice
- **Question**: "What type of issue are you reporting?"
- **Options**:
  - Platform not being blocked
  - Platform blocked when should be allowed
  - Settings not saving
  - Performance issues
  - User interface bug
  - Other
- **Make required**: ❌ (optional)

#### Field 5: Extension Version
- **Type**: Short answer
- **Question**: "Extension version (auto-filled)"
- **Make required**: ❌ (optional)

#### Field 6: Platform/Browser
- **Type**: Short answer  
- **Question**: "Browser and operating system (auto-filled)"
- **Make required**: ❌ (optional)

#### Field 7: Beta Features Tested
- **Type**: Checkboxes
- **Question**: "Which beta features did you test? (Netflix/Hulu)"
- **Options**:
  - Netflix blocking
  - Hulu blocking
- **Make required**: ❌ (optional)

### 🔍 **Step 3: Get Form Field IDs**

1. **Click "Preview"** (eye icon) in your form
2. **Right-click** on the preview page → **"View Page Source"**
3. **Press Ctrl+F** (or Cmd+F) and search for **"entry."**
4. **Find the entry IDs** for each field. They look like `entry.1234567890`
5. **Write them down**:

```
Feedback Type: entry._______
Rating: entry._______
Feedback Text: entry._______
Issue Type: entry._______
Extension Version: entry._______
Platform: entry._______
Beta Features: entry._______
```

### 🔗 **Step 4: Get Your Form URL**

1. **Click "Send"** button in your form
2. **Click the link icon** (🔗)
3. **Copy the URL** - it looks like:
   `https://docs.google.com/forms/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/viewform`
4. **Extract the form ID** (the long string between `/d/` and `/viewform`)
5. **Your submission URL** will be:
   `https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse`

### 📧 **Step 5: Enable Email Notifications**

1. **Go to "Responses" tab** in your form
2. **Click the three dots** (⋮) in the top right
3. **Select "Get email notifications for new responses"**
4. **Turn on the toggle** - you'll now get emails for every submission!

### 📊 **Step 6: Link to Google Sheets (Optional)**

1. **In "Responses" tab**, click the **Google Sheets icon**
2. **Create a new spreadsheet** or select existing one
3. **All responses** will automatically populate the sheet
4. **Perfect for analysis** and tracking trends

### 💻 **Step 7: Update Your Extension Code**

Replace the `submitFeedbackData` function in your `options.js` file:

```javascript
async function submitFeedbackData(data) {
  // Replace YOUR_FORM_ID with your actual form ID
  const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';
  
  // Replace these with your actual entry IDs from Step 3
  const FIELD_MAPPING = {
    feedbackType: 'entry.1234567890',    // Your Feedback Type field ID
    rating: 'entry.2345678901',          // Your Rating field ID
    feedback: 'entry.3456789012',        // Your Feedback Text field ID
    issueType: 'entry.4567890123',       // Your Issue Type field ID
    version: 'entry.5678901234',         // Your Extension Version field ID
    platform: 'entry.6789012345',       // Your Platform field ID
    testedFeatures: 'entry.7890123456'   // Your Beta Features field ID
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
}
```

### 🧪 **Step 8: Test Your Setup**

1. **Reload your extension** in Chrome
2. **Open the options page**
3. **Click "📝 Send Feedback"**
4. **Fill out and submit** a test feedback
5. **Check your email** - you should get a notification!
6. **Check your Google Form responses** to see the data

### 🎉 **You're Done!**

Now every time a user submits feedback through your extension:
- ✅ **You get an instant email notification**
- ✅ **Data is stored in Google Sheets automatically**
- ✅ **Feedback is backed up locally in the extension**
- ✅ **You can analyze trends and patterns easily**

### 📞 **Need Help?**

If you run into issues:
1. **Check the browser console** for errors
2. **Verify your form field IDs** are correct
3. **Test with a simple form first** to make sure the concept works
4. **Make sure your form is set to accept responses**

### 🔒 **Privacy Note**

Users will be submitting data to Google Forms. Consider:
- **Adding a privacy notice** in your extension
- **Being transparent** about data collection
- **Following GDPR/privacy regulations** if applicable