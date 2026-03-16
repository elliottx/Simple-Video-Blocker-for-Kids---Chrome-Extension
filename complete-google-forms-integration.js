// Complete Google Forms integration with your actual field IDs
// Replace the submitFeedbackData function in options.js with this

async function submitFeedbackData(data) {
  // Your Google Forms submission URL
  const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/formResponse';
  
  // Your actual field IDs (corrected from form source)
  const FIELD_MAPPING = {
    feedbackType: 'entry.843107295',    // "What type of feedback are you providing?"
    rating: 'entry.256030518',          // "How would you rate your experience?"
    feedback: 'entry.2081510831',       // "Please share your feedback, suggestions, or describe the issue:"
    version: 'entry.966685180',         // "Extension Version"
    platform: 'entry.360666787'        // "Platform/Browser"
  };

  try {
    // Prepare form data
    const formData = new FormData();
    
    // Always submit feedback type
    formData.append(FIELD_MAPPING.feedbackType, data.type);
    
    // Always submit version and platform info
    formData.append(FIELD_MAPPING.version, data.version || '1.1');
    formData.append(FIELD_MAPPING.platform, data.platform || navigator.platform + ' - ' + navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0] || 'Unknown');
    
    // Submit rating if provided (for general and beta feedback)
    if (data.rating) {
      formData.append(FIELD_MAPPING.rating, data.rating);
    }
    
    // Submit the main feedback text (handles all feedback types)
    let feedbackText = '';
    if (data.feedback) {
      feedbackText = data.feedback;
    } else if (data.description) {
      // For issue reports, include issue type in the description if available
      feedbackText = data.issueType ? `[${data.issueType}] ${data.description}` : data.description;
    }
    
    // For beta feedback, include tested features in the feedback text
    if (data.type === 'beta' && data.testedFeatures && data.testedFeatures.length > 0) {
      const betaInfo = `\n\n[Beta Features Tested: ${data.testedFeatures.join(', ')}]`;
      feedbackText = (feedbackText || '') + betaInfo;
    }
    
    if (feedbackText) {
      formData.append(FIELD_MAPPING.feedback, feedbackText);
    }

    // Submit to Google Forms
    await fetch(GOOGLE_FORMS_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors' // Required for Google Forms
    });
    
    console.log('Feedback submitted to Google Forms successfully');
    
  } catch (error) {
    console.error('Error submitting to Google Forms:', error);
    // Don't throw error - let it continue with local storage
  }
  
  // Always store locally as backup
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(['userFeedback'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        const existingFeedback = result.userFeedback || [];
        existingFeedback.push({ 
          ...data, 
          googleFormsSent: true,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 feedback entries
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
    } catch (error) {
      reject(error);
    }
  });
}