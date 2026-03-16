// Webhook.site feedback integration

class WebhookFeedback {
  
  static generateCode() {
    return `
// Replace submitFeedbackData function with this:
async function submitFeedbackData(data) {
  // Get your unique webhook URL from https://webhook.site
  const WEBHOOK_URL = 'https://webhook.site/your-unique-id';
  
  try {
    // Send to webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Simple-Video-Blocker-Extension'
      },
      body: JSON.stringify({
        ...data,
        submittedAt: new Date().toISOString(),
        source: 'Simple Video Blocker Extension'
      })
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    console.log('Feedback sent to webhook successfully');
    
  } catch (error) {
    console.error('Webhook submission failed:', error);
    // Continue with local storage even if webhook fails
  }
  
  // Always store locally as backup
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['userFeedback'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      
      const existingFeedback = result.userFeedback || [];
      existingFeedback.push({ ...data, webhookSent: true });
      
      if (existingFeedback.length > 50) {
        existingFeedback.splice(0, existingFeedback.length - 50);
      }
      
      chrome.storage.local.set({ userFeedback: existingFeedback }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  });
}`;
  }

  static generateInstructions() {
    return `
# Webhook Feedback Setup (Recommended)

## 🌐 How it works:
1. User submits feedback in extension
2. Extension automatically sends data to your webhook
3. You receive real-time notifications
4. Data is viewable instantly on webhook dashboard

## 🔧 Setup Steps:

### Step 1: Create webhook
1. Go to https://webhook.site
2. You'll get a unique URL like: https://webhook.site/abc123
3. Copy this URL

### Step 2: Update extension
1. Replace 'your-unique-id' with your webhook ID in the code below
2. Replace submitFeedbackData function in options.js

### Step 3: Set up notifications (Optional)
1. On webhook.site, click "Edit"
2. Add email/Slack/Discord notifications
3. Set up custom response templates
4. Export data to JSON/CSV

## ✅ Pros:
- ✅ Real-time automatic submission
- ✅ No user action required
- ✅ Email/Slack notifications available
- ✅ Easy data export
- ✅ Free tier available
- ✅ JSON format ready for analysis
- ✅ Works reliably

## ❌ Cons:
- ❌ Data visible on third-party service
- ❌ Free tier has limitations
- ❌ Requires internet connection

## 📊 You'll receive:
- Instant webhook notifications
- Structured JSON data
- Real-time dashboard view
- Export capabilities
- Optional email/Slack alerts

## 🔒 Privacy Note:
Webhook.site is public by default. For sensitive data, consider:
- Paid webhook services with privacy
- Your own server endpoint
- Local-only storage with manual export
`;
  }

  static run() {
    console.log('🌐 Webhook Feedback Setup (Recommended)\n');
    console.log('='.repeat(60));
    console.log(this.generateInstructions());
    console.log('\n💻 JavaScript Code:');
    console.log('='.repeat(60));
    console.log(this.generateCode());
    console.log('='.repeat(60));
  }
}

if (require.main === module) {
  WebhookFeedback.run();
}

module.exports = WebhookFeedback;