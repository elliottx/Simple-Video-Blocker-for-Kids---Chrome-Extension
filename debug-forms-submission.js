// Debug Google Forms Submission
// Use this to test and debug the exact submission

async function debugGoogleFormsSubmission() {
    console.log('🔍 Debug: Starting Google Forms submission test...');
    
    // Your exact form details
    const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/formResponse';
    
    const FIELD_MAPPING = {
        feedbackType: 'entry.978849860',    // "What type of feedback are you providing?"
        rating: 'entry.1927586933',         // "How would you rate your experience?"
        feedback: 'entry.1917941285',       // "Please share your feedback, suggestions, or describe the issue:"
        version: 'entry.789264437',         // "Extension Version"
        platform: 'entry.1271589939'       // "Platform/Browser"
    };
    
    console.log('🎯 Form URL:', GOOGLE_FORMS_URL);
    console.log('🔑 Field Mapping:', FIELD_MAPPING);
    
    // Test data
    const testData = {
        type: 'general',
        feedback: 'DEBUG TEST: This is a test submission to verify Google Forms integration is working correctly.',
        rating: '5',
        version: '1.1-DEBUG',
        platform: navigator.platform + ' - DEBUG TEST'
    };
    
    console.log('📝 Test Data:', testData);
    
    // Create FormData and log each field
    const formData = new FormData();
    
    console.log('🔧 Adding form fields...');
    formData.append(FIELD_MAPPING.feedbackType, testData.type);
    console.log(`  ✅ ${FIELD_MAPPING.feedbackType} = "${testData.type}"`);
    
    formData.append(FIELD_MAPPING.rating, testData.rating);
    console.log(`  ✅ ${FIELD_MAPPING.rating} = "${testData.rating}"`);
    
    formData.append(FIELD_MAPPING.feedback, testData.feedback);
    console.log(`  ✅ ${FIELD_MAPPING.feedback} = "${testData.feedback}"`);
    
    formData.append(FIELD_MAPPING.version, testData.version);
    console.log(`  ✅ ${FIELD_MAPPING.version} = "${testData.version}"`);
    
    formData.append(FIELD_MAPPING.platform, testData.platform);
    console.log(`  ✅ ${FIELD_MAPPING.platform} = "${testData.platform}"`);
    
    // Log all FormData entries
    console.log('📋 Complete FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    try {
        console.log('🚀 Sending POST request...');
        
        const response = await fetch(GOOGLE_FORMS_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        
        console.log('📡 Response received:', response);
        console.log('  Status:', response.status);
        console.log('  Type:', response.type);
        console.log('  OK:', response.ok);
        
        // With no-cors, we can't read the response, but if no error was thrown, it likely worked
        console.log('✅ Submission completed (no-cors prevents detailed response analysis)');
        console.log('📧 Check your Google Form responses and email notifications!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Submission failed:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        return false;
    }
}

// Alternative test with a direct form submission (more reliable)
function testDirectFormSubmission() {
    console.log('🧪 Creating invisible test form for direct submission...');
    
    // Create a temporary form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/formResponse';
    form.target = '_blank';
    form.style.display = 'none';
    
    // Add form fields
    const fields = [
        { name: 'entry.978849860', value: 'general' },
        { name: 'entry.1927586933', value: '5' },
        { name: 'entry.1917941285', value: 'DIRECT FORM TEST: Testing direct form submission method' },
        { name: 'entry.789264437', value: '1.1-DIRECT-TEST' },
        { name: 'entry.1271589939', value: navigator.platform + ' - DIRECT TEST' }
    ];
    
    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.name;
        input.value = field.value;
        form.appendChild(input);
        console.log(`  Added field: ${field.name} = "${field.value}"`);
    });
    
    // Add form to page and submit
    document.body.appendChild(form);
    console.log('🚀 Submitting form directly...');
    form.submit();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(form);
        console.log('🧹 Test form cleaned up');
    }, 1000);
    
    console.log('✅ Direct form submission completed - check your responses!');
}

// Export functions for console testing
window.debugGoogleFormsSubmission = debugGoogleFormsSubmission;
window.testDirectFormSubmission = testDirectFormSubmission;

console.log('🛠️ Debug functions loaded! You can run:');
console.log('  debugGoogleFormsSubmission() - Test the fetch method');
console.log('  testDirectFormSubmission() - Test direct form submission');