// Debug Google Forms 400 Error
// This will help identify what's causing the submission failure

console.log('🔍 Debugging Google Forms 400 Error');

// Test the exact form submission manually
function testGoogleFormsSubmission() {
    console.log('🧪 Testing Google Forms submission with correct parameters...');
    
    // Your form URL and field IDs
    const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/formResponse';
    
    const FIELD_MAPPING = {
        feedbackType: 'entry.843107295',
        rating: 'entry.256030518', 
        feedback: 'entry.2081510831',
        version: 'entry.966685180',
        platform: 'entry.360666787'
    };
    
    // Test data
    const testData = {
        type: 'general',
        rating: '5',
        feedback: 'TEST SUBMISSION: This is a test of the Google Forms integration to debug the 400 error.',
        version: '1.1',
        platform: 'MacIntel - Chrome/119.0 - Test Environment'
    };
    
    console.log('📝 Test data:', testData);
    
    // Create FormData exactly as the extension does
    const formData = new FormData();
    
    // Add each field individually and log it
    console.log('🔧 Building FormData...');
    
    formData.append(FIELD_MAPPING.feedbackType, testData.type);
    console.log(`  ✅ Added: ${FIELD_MAPPING.feedbackType} = "${testData.type}"`);
    
    formData.append(FIELD_MAPPING.version, testData.version);
    console.log(`  ✅ Added: ${FIELD_MAPPING.version} = "${testData.version}"`);
    
    formData.append(FIELD_MAPPING.platform, testData.platform);
    console.log(`  ✅ Added: ${FIELD_MAPPING.platform} = "${testData.platform}"`);
    
    formData.append(FIELD_MAPPING.rating, testData.rating);
    console.log(`  ✅ Added: ${FIELD_MAPPING.rating} = "${testData.rating}"`);
    
    formData.append(FIELD_MAPPING.feedback, testData.feedback);
    console.log(`  ✅ Added: ${FIELD_MAPPING.feedback} = "${testData.feedback}"`);
    
    // Log all FormData entries
    console.log('📋 Complete FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    console.log('🚀 Submitting to Google Forms...');
    
    // Submit with detailed error handling
    fetch(GOOGLE_FORMS_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
    }).then(response => {
        console.log('📡 Response received:', {
            status: response.status,
            statusText: response.statusText,
            type: response.type,
            ok: response.ok,
            url: response.url
        });
        
        if (response.type === 'opaque') {
            console.log('✅ Success! (no-cors mode - response is opaque but likely succeeded)');
            console.log('📧 Check your Google Form responses and email notifications');
        } else if (response.ok) {
            console.log('✅ Success! Form submitted successfully');
            return response.text();
        } else {
            console.error(`❌ Error: ${response.status} ${response.statusText}`);
        }
    }).then(text => {
        if (text) {
            console.log('📄 Response text:', text);
        }
    }).catch(error => {
        console.error('❌ Network error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    });
}

// Alternative: Test with a regular form submission (not fetch)
function testDirectFormSubmission() {
    console.log('🧪 Testing direct form submission method...');
    
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://docs.google.com/forms/d/e/1FAIpQLSfd-ZUiDCOylX7BTwNpnS-_A2Da-UBtVFnb2idDjmNfdBcU9Q/formResponse';
    form.target = '_blank';
    form.style.display = 'none';
    
    // Add fields
    const fields = [
        { name: 'entry.843107295', value: 'general' },
        { name: 'entry.256030518', value: '5' },
        { name: 'entry.2081510831', value: 'DIRECT FORM TEST: Testing direct form submission to debug 400 error' },
        { name: 'entry.966685180', value: '1.1-TEST' },
        { name: 'entry.360666787', value: navigator.platform + ' - Direct Test' }
    ];
    
    fields.forEach(field => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field.name;
        input.value = field.value;
        form.appendChild(input);
        console.log(`  Added field: ${field.name} = "${field.value}"`);
    });
    
    document.body.appendChild(form);
    
    console.log('🚀 Submitting form directly...');
    form.submit();
    
    // Clean up
    setTimeout(() => {
        if (document.body.contains(form)) {
            document.body.removeChild(form);
        }
        console.log('🧹 Form cleaned up');
    }, 1000);
}

// Check if required fields are missing
function validateRequiredFields() {
    console.log('🔍 Checking which fields are required...');
    
    // Based on your form HTML, these fields are marked as required:
    const requiredFields = [
        'entry.843107295', // Feedback Type (required)
        'entry.2081510831'  // Feedback Text (required)
    ];
    
    const optionalFields = [
        'entry.256030518',  // Rating (optional)
        'entry.966685180',  // Extension Version (optional) 
        'entry.360666787'   // Platform/Browser (optional)
    ];
    
    console.log('📝 Required fields:', requiredFields);
    console.log('📝 Optional fields:', optionalFields);
    
    // Check if we're missing any required fields
    const testSubmission = {
        'entry.843107295': 'general',
        'entry.2081510831': 'Test feedback text'
    };
    
    console.log('✅ Minimum required submission:', testSubmission);
    
    return { requiredFields, optionalFields, testSubmission };
}

// Export functions for testing
window.testGoogleFormsSubmission = testGoogleFormsSubmission;
window.testDirectFormSubmission = testDirectFormSubmission;
window.validateRequiredFields = validateRequiredFields;

// Run validation immediately
validateRequiredFields();

console.log('\n🛠️ Available test functions:');
console.log('  testGoogleFormsSubmission() - Test fetch submission');
console.log('  testDirectFormSubmission() - Test direct form submission');
console.log('  validateRequiredFields() - Check required field mapping');

console.log('\n🎯 Common causes of 400 errors:');
console.log('  1. Missing required fields');
console.log('  2. Invalid field names/IDs');
console.log('  3. Form is not accepting responses'); 
console.log('  4. CSRF or validation tokens missing');
console.log('  5. Rate limiting or spam detection');