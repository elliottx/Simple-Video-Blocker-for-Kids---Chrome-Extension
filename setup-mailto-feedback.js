// Simple mailto: feedback system

class MailtoFeedback {
  
  static generateCode() {
    return `
// Replace submitFeedbackData function with this:
async function submitFeedbackData(data) {
  // Your email address for feedback
  const FEEDBACK_EMAIL = 'your-email@example.com';
  
  // Create email content
  let subject = encodeURIComponent(\`Video Blocker Feedback - \${data.type}\`);
  let body = encodeURIComponent(\`
Extension Feedback Submission

Type: \${data.type}
Version: \${data.version}
Date: \${new Date(data.timestamp).toLocaleString()}
Platform: \${data.platform}

\${ data.rating ? \`Rating: \${data.rating}/5 stars\\n\` : '' }
\${ data.feedback ? \`Feedback:\\n\${data.feedback}\\n\\n\` : '' }
\${ data.description ? \`Issue Description:\\n\${data.description}\\n\\n\` : '' }
\${ data.issueType ? \`Issue Type: \${data.issueType}\\n\` : '' }
\${ data.testedFeatures ? \`Beta Features Tested: \${data.testedFeatures.join(', ')}\\n\` : '' }

---
System Info:
User Agent: \${data.userAgent}
Platform: \${data.platform}
Extension Version: \${data.version}
  \`);
  
  // Create mailto link
  const mailtoLink = \`mailto:\${FEEDBACK_EMAIL}?subject=\${subject}&body=\${body}\`;
  
  // Open email client
  window.open(mailtoLink);
  
  // Store locally as well
  return new Promise((resolve) => {
    chrome.storage.local.get(['userFeedback'], (result) => {
      const existingFeedback = result.userFeedback || [];
      existingFeedback.push({ ...data, emailSent: true });
      
      if (existingFeedback.length > 50) {
        existingFeedback.splice(0, existingFeedback.length - 50);
      }
      
      chrome.storage.local.set({ userFeedback: existingFeedback }, () => {
        resolve();
      });
    });
  });
}`;
  }

  static generateInstructions() {
    return `
# Mailto Feedback Setup

## 📧 How it works:
1. User clicks "Send Feedback"
2. Extension opens their email client with pre-filled message
3. User clicks "Send" in their email client
4. You receive formatted feedback in your inbox

## 🔧 Setup:
1. Replace 'your-email@example.com' with your actual email
2. Replace submitFeedbackData function in options.js with the code below
3. That's it! No servers or accounts needed.

## ✅ Pros:
- ✅ Dead simple setup
- ✅ Users trust their own email
- ✅ No third-party services
- ✅ Works offline
- ✅ Automatic formatting

## ❌ Cons:
- ❌ Requires user to have email client configured
- ❌ User can modify/not send email
- ❌ Not automatic (requires user action)
- ❌ May not work on mobile

## 📧 You'll receive:
- Well-formatted emails with all feedback data
- Subject line indicates feedback type
- All system information included
- Easy to filter and organize
`;
  }

  static run() {
    console.log('📧 Mailto Feedback Setup\n');
    console.log('='.repeat(60));
    console.log(this.generateInstructions());
    console.log('\n💻 JavaScript Code:');
    console.log('='.repeat(60));
    console.log(this.generateCode());
    console.log('='.repeat(60));
  }
}

if (require.main === module) {
  MailtoFeedback.run();
}

module.exports = MailtoFeedback;