const fs = require('fs');
const path = require('path');

class FeedbackTester {
  constructor() {
    this.results = [];
  }

  addResult(test, passed, details = '') {
    this.results.push({ test, passed, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}${details ? ' - ' + details : ''}`);
  }

  testBetaFeatureMarkup() {
    console.log('🧪 Testing Beta Feature Markup...\n');

    try {
      const optionsHtml = fs.readFileSync(path.join(__dirname, 'options.html'), 'utf8');
      
      // Check for beta badges
      this.addResult('Beta badge in section header', optionsHtml.includes('<span class="beta-badge">BETA</span>'));
      
      // Check for beta notice
      this.addResult('Beta notice section exists', optionsHtml.includes('class="beta-notice"'));
      this.addResult('Beta feedback link exists', optionsHtml.includes('id="betaFeedbackLink"'));
      
      // Check Netflix/Hulu marked as beta
      this.addResult('Netflix marked as beta feature', 
        optionsHtml.includes('Netflix <span class="feature-badge beta">BETA</span>'));
      this.addResult('Hulu marked as beta feature',
        optionsHtml.includes('Hulu <span class="feature-badge beta">BETA</span>'));
      
      // Check experimental descriptions
      this.addResult('Netflix shows experimental description',
        optionsHtml.includes('Block Netflix streaming content (experimental)'));
      this.addResult('Hulu shows experimental description',
        optionsHtml.includes('Block Hulu streaming content (experimental)'));

    } catch (error) {
      this.addResult('Beta feature markup test failed', false, error.message);
    }
  }

  testFeedbackModalStructure() {
    console.log('\n📝 Testing Feedback Modal Structure...\n');

    try {
      const optionsHtml = fs.readFileSync(path.join(__dirname, 'options.html'), 'utf8');
      
      // Check modal exists
      this.addResult('Feedback modal exists', optionsHtml.includes('id="feedbackModal"'));
      
      // Check feedback buttons
      this.addResult('Send Feedback button exists', optionsHtml.includes('id="feedbackBtn"'));
      this.addResult('Report Issue button exists', optionsHtml.includes('id="reportIssueBtn"'));
      
      // Check tabs
      this.addResult('General feedback tab exists', optionsHtml.includes('data-tab="general"'));
      this.addResult('Beta feedback tab exists', optionsHtml.includes('data-tab="beta"'));
      this.addResult('Issue report tab exists', optionsHtml.includes('data-tab="issue"'));
      
      // Check form fields
      this.addResult('General feedback textarea exists', optionsHtml.includes('id="generalFeedback"'));
      this.addResult('Beta feedback textarea exists', optionsHtml.includes('id="betaFeedback"'));
      this.addResult('Issue description textarea exists', optionsHtml.includes('id="issueDescription"'));
      
      // Check star ratings
      const starRatingCount = (optionsHtml.match(/class="star-rating"/g) || []).length;
      this.addResult('Star rating components exist', starRatingCount >= 2, `Found ${starRatingCount} star ratings`);
      
      // Check issue type dropdown
      this.addResult('Issue type selector exists', optionsHtml.includes('id="issueType"'));

    } catch (error) {
      this.addResult('Feedback modal structure test failed', false, error.message);
    }
  }

  testFeedbackCSS() {
    console.log('\n🎨 Testing Feedback CSS Styles...\n');

    try {
      const optionsCss = fs.readFileSync(path.join(__dirname, 'options.css'), 'utf8');
      
      // Check beta feature styles
      this.addResult('Beta badge styles defined', optionsCss.includes('.beta-badge'));
      this.addResult('Beta notice styles defined', optionsCss.includes('.beta-notice'));
      this.addResult('Beta feature item styles defined', optionsCss.includes('.setting-item.beta-feature'));
      this.addResult('Feature badge styles defined', optionsCss.includes('.feature-badge.beta'));
      
      // Check feedback button styles
      this.addResult('Feedback button styles defined', optionsCss.includes('.feedback-btn'));
      this.addResult('Report button styles defined', optionsCss.includes('.report-btn'));
      
      // Check modal styles
      this.addResult('Modal overlay styles defined', optionsCss.includes('.modal-overlay'));
      this.addResult('Modal content styles defined', optionsCss.includes('.modal-content'));
      this.addResult('Tab styles defined', optionsCss.includes('.tab-btn'));
      this.addResult('Star rating styles defined', optionsCss.includes('.star-rating'));
      
      // Check for animations/transitions
      this.addResult('Modal has transition animations', optionsCss.includes('transition:') && optionsCss.includes('transform:'));

    } catch (error) {
      this.addResult('Feedback CSS test failed', false, error.message);
    }
  }

  testFeedbackJavaScript() {
    console.log('\n⚙️ Testing Feedback JavaScript...\n');

    try {
      const optionsJs = fs.readFileSync(path.join(__dirname, 'options.js'), 'utf8');
      
      // Check core feedback functions
      this.addResult('Modal control functions exist', 
        optionsJs.includes('function openModal') && optionsJs.includes('function closeModal'));
      this.addResult('Tab switching functionality exists', optionsJs.includes('function switchTab'));
      this.addResult('Star rating functionality exists', optionsJs.includes('updateStars'));
      
      // Check form handling
      this.addResult('Feedback data collection exists', optionsJs.includes('function collectFeedbackData'));
      this.addResult('Feedback validation exists', optionsJs.includes('function validateFeedback'));
      this.addResult('Feedback submission exists', optionsJs.includes('function submitFeedbackData'));
      
      // Check event listeners
      this.addResult('Feedback button event listeners exist', 
        optionsJs.includes('feedbackBtn.addEventListener') && optionsJs.includes('reportIssueBtn.addEventListener'));
      this.addResult('Beta feedback link event listener exists', optionsJs.includes('betaFeedbackLink.addEventListener'));
      
      // Check storage integration
      this.addResult('Local storage integration exists', 
        optionsJs.includes('chrome.storage.local') && optionsJs.includes('userFeedback'));

    } catch (error) {
      this.addResult('Feedback JavaScript test failed', false, error.message);
    }
  }

  testFeedbackViewer() {
    console.log('\n👀 Testing Feedback Viewer...\n');

    try {
      const viewerExists = fs.existsSync(path.join(__dirname, 'view-feedback.html'));
      this.addResult('Feedback viewer HTML exists', viewerExists);
      
      if (viewerExists) {
        const viewerHtml = fs.readFileSync(path.join(__dirname, 'view-feedback.html'), 'utf8');
        
        this.addResult('Feedback dashboard structure exists', viewerHtml.includes('User Feedback Dashboard'));
        this.addResult('Statistics section exists', viewerHtml.includes('id="statsSection"'));
        this.addResult('Filter controls exist', viewerHtml.includes('id="typeFilter"'));
        this.addResult('Export functionality exists', viewerHtml.includes('id="exportBtn"'));
        this.addResult('Feedback rendering logic exists', viewerHtml.includes('function renderFeedback'));
      }

    } catch (error) {
      this.addResult('Feedback viewer test failed', false, error.message);
    }
  }

  generateUsageInstructions() {
    console.log('\n📋 Feedback System Usage Instructions...\n');
    console.log('🔧 FOR DEVELOPERS:');
    console.log('   1. Feedback is stored in chrome.storage.local under "userFeedback" key');
    console.log('   2. Open view-feedback.html in browser to see collected feedback');
    console.log('   3. Export data as JSON for analysis');
    console.log('   4. Integrate with backend service by updating submitFeedbackData()');
    console.log('');
    console.log('👥 FOR USERS:');
    console.log('   1. Click "📝 Send Feedback" button in options page');
    console.log('   2. Choose feedback type: General, Beta Features, or Report Issue');
    console.log('   3. Fill out the form and submit');
    console.log('   4. Feedback is stored locally and can be exported');
    console.log('');
    console.log('🚀 BETA FEATURES:');
    console.log('   • Netflix and Hulu are clearly marked as BETA');
    console.log('   • Users can specifically provide beta feature feedback');
    console.log('   • Beta notice encourages users to share experiences');
    console.log('');
    console.log('🔗 BACKEND INTEGRATION:');
    console.log('   • Uncomment the fetch() call in submitFeedbackData()');
    console.log('   • Set up endpoint to receive feedback JSON');
    console.log('   • Consider adding authentication for production use');
  }

  runAllTests() {
    console.log('🧪 Feedback System Testing\n');
    console.log('='.repeat(60));

    this.testBetaFeatureMarkup();
    this.testFeedbackModalStructure();
    this.testFeedbackCSS();
    this.testFeedbackJavaScript();
    this.testFeedbackViewer();

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log('\n📊 TEST RESULTS');
    console.log('='.repeat(30));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${successRate}%`);

    if (successRate >= 90) {
      console.log('\n🎉 EXCELLENT! Feedback system is ready.');
    } else if (successRate >= 75) {
      console.log('\n✅ GOOD! Minor issues found.');
    } else {
      console.log('\n⚠️ NEEDS WORK. Several issues found.');
    }

    if (passedTests < totalTests) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.test}: ${result.details || 'Failed'}`);
      });
    }

    this.generateUsageInstructions();
    console.log('\n' + '='.repeat(60));
    
    return successRate >= 85;
  }
}

if (require.main === module) {
  const tester = new FeedbackTester();
  tester.runAllTests();
}

module.exports = FeedbackTester;