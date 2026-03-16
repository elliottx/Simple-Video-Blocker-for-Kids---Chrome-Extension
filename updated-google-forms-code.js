// Updated Google Forms integration for your simplified form

async function submitFeedbackData(data) {
  // Your Google Forms submission URL
  const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/formResponse';
  
  // Your actual field IDs (based on what you found)
  const FIELD_MAPPING = {
    feedbackType: 'entry.843107295',    // First field - Feedback Type
    rating: 'entry.256030518',          // Second field - Rating
    feedback: 'entry.NEED_TO_FIND',     // Third field - Feedback Text (you need to find this)
    version: 'entry.NEED_TO_FIND',      // Fourth field - Extension Version (you need to find this)
    platform: 'entry.NEED_TO_FIND'      // Fifth field - Platform/Browser (you need to find this)
  };

  try {
    // Prepare form data
    const formData = new FormData();
    
    // Always submit feedback type
    formData.append(FIELD_MAPPING.feedbackType, data.type);
    
    // Always submit version and platform info
    formData.append(FIELD_MAPPING.version, data.version || '1.1');
    formData.append(FIELD_MAPPING.platform, data.platform || navigator.platform);
    
    // Submit rating if provided (for general and beta feedback)
    if (data.rating) {
      formData.append(FIELD_MAPPING.rating, data.rating);
    }
    
    // Submit the main feedback text (handles both feedback and issue descriptions)
    let feedbackText = '';
    if (data.feedback) {
      feedbackText = data.feedback;
    } else if (data.description) {
      // For issue reports, include issue type in the description
      feedbackText = data.issueType ? `[${data.issueType}] ${data.description}` : data.description;
    }
    
    if (feedbackText) {
      formData.append(FIELD_MAPPING.feedback, feedbackText);
    }
    
    // For beta feedback, include tested features in the feedback text
    if (data.type === 'beta' && data.testedFeatures && data.testedFeatures.length > 0) {
      const betaInfo = `\n\n[Beta Features Tested: ${data.testedFeatures.join(', ')}]`;
      const currentFeedback = feedbackText || '';
      formData.append(FIELD_MAPPING.feedback, currentFeedback + betaInfo);
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
        existingFeedback.push({ ...data, googleFormsSent: true });
        
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