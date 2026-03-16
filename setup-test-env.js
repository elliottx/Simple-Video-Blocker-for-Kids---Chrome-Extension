const fs = require('fs');
const path = require('path');

class TestSetup {
  constructor() {
    this.projectPath = __dirname;
  }

  async setup() {
    console.log('🛠️ Setting up test environment...\n');
    
    try {
      await this.checkRequiredFiles();
      await this.validateExtensionStructure();
      await this.createTestDirectories();
      await this.setupTestData();
      
      console.log('✅ Test environment setup complete!\n');
      console.log('📋 Available test commands:');
      console.log('  npm test          - Run all extension tests');
      console.log('  npm run test-blocking  - Test blocking functionality');
      console.log('  npm run test-settings  - Test settings/options page');
      console.log('  node test-runner.js    - Run comprehensive test suite');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkRequiredFiles() {
    console.log('📂 Checking required files...');
    
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'options.html',
      'options.js',
      'options.css',
      'icon.png'
    ];

    const missingFiles = [];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectPath, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      } else {
        console.log(`  ✅ ${file}`);
      }
    }

    if (missingFiles.length > 0) {
      throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
    }
  }

  async validateExtensionStructure() {
    console.log('🔍 Validating extension structure...');
    
    // Check manifest.json
    const manifest = JSON.parse(fs.readFileSync(path.join(this.projectPath, 'manifest.json'), 'utf8'));
    
    const requiredManifestFields = [
      'manifest_version',
      'name',
      'version',
      'permissions',
      'background',
      'content_scripts',
      'action'
    ];

    for (const field of requiredManifestFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required manifest field: ${field}`);
      }
    }

    console.log('  ✅ Manifest structure valid');

    // Check for required permissions
    const requiredPermissions = ['declarativeNetRequest', 'storage', 'tabs'];
    for (const permission of requiredPermissions) {
      if (!manifest.permissions.includes(permission)) {
        throw new Error(`Missing required permission: ${permission}`);
      }
    }

    console.log('  ✅ Required permissions present');

    // Validate script files contain required functions
    const backgroundScript = fs.readFileSync(path.join(this.projectPath, 'background.js'), 'utf8');
    const requiredBackgroundFunctions = ['updateRules', 'updateBadge', 'removeAllRules'];
    
    for (const func of requiredBackgroundFunctions) {
      if (!backgroundScript.includes(func)) {
        console.warn(`  ⚠️ Background script may be missing function: ${func}`);
      }
    }

    console.log('  ✅ Background script structure valid');
  }

  async createTestDirectories() {
    console.log('📁 Creating test directories...');
    
    const testDirs = [
      'test-reports',
      'test-data'
    ];

    for (const dir of testDirs) {
      const dirPath = path.join(this.projectPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created ${dir}/`);
      } else {
        console.log(`  ✅ ${dir}/ exists`);
      }
    }
  }

  async setupTestData() {
    console.log('📊 Setting up test data...');
    
    // Create test configuration
    const testConfig = {
      testTimeout: 30000,
      retryAttempts: 3,
      browserOptions: {
        headless: false,
        devtools: false,
        slowMo: 100
      },
      testUrls: {
        youtube: [
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          'https://youtu.be/dQw4w9WgXcQ',
          'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
        ],
        tiktok: [
          'https://www.tiktok.com/@user/video/7234567890123456789'
        ],
        netflix: [
          'https://www.netflix.com/title/70143836'
        ],
        hulu: [
          'https://www.hulu.com/watch/1234567'
        ]
      },
      expectedBlockedDomains: [
        'youtube.com',
        'youtu.be',
        'youtube-nocookie.com',
        'googlevideo.com',
        'tiktok.com',
        'netflix.com',
        'nflxvideo.net',
        'nflxso.net',
        'hulu.com',
        'hulustream.com'
      ]
    };

    fs.writeFileSync(
      path.join(this.projectPath, 'test-data', 'test-config.json'),
      JSON.stringify(testConfig, null, 2)
    );

    console.log('  ✅ Test configuration created');

    // Create sample test HTML files
    const sampleTestPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Extension Test Page</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>Video Blocker Test Page</h1>
    
    <!-- Test videos that should be blocked -->
    <div id="test-videos">
        <video id="video1" controls autoplay muted>
            <source src="sample.mp4" type="video/mp4">
        </video>
        
        <video id="video2" controls>
            <source src="sample2.mp4" type="video/mp4">
        </video>
    </div>
    
    <!-- Test audio that should be muted -->
    <div id="test-audio">
        <audio id="audio1" controls>
            <source src="sample.mp3" type="audio/mpeg">
        </audio>
    </div>
    
    <!-- Test embeds that should be removed -->
    <div id="test-embeds">
        <iframe src="https://www.youtube.com/embed/testid1" width="560" height="315"></iframe>
        <iframe src="https://www.youtube-nocookie.com/embed/testid2" width="560" height="315"></iframe>
        <iframe src="https://www.tiktok.com/embed/v2/testid3" width="325" height="580"></iframe>
    </div>
    
    <!-- Custom elements -->
    <yt-embed video-id="testid4"></yt-embed>
    
    <script>
        // Test script to verify blocking
        window.testResults = {
            videosFound: document.querySelectorAll('video').length,
            audiosFound: document.querySelectorAll('audio').length,
            iframesFound: document.querySelectorAll('iframe').length,
            customElementsFound: document.querySelectorAll('yt-embed').length
        };
        
        // Simulate dynamic content loading
        setTimeout(() => {
            const dynamicVideo = document.createElement('video');
            dynamicVideo.id = 'dynamic-video';
            dynamicVideo.controls = true;
            dynamicVideo.src = 'dynamic.mp4';
            document.getElementById('test-videos').appendChild(dynamicVideo);
        }, 2000);
    </script>
</body>
</html>
    `;

    fs.writeFileSync(
      path.join(this.projectPath, 'test-data', 'sample-test-page.html'),
      sampleTestPage
    );

    console.log('  ✅ Sample test page created');
  }

  static async checkDependencies() {
    console.log('🔧 Checking dependencies...');
    
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      console.error('❌ package.json not found. Run npm init first.');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredDeps = ['puppeteer'];
    const missingDeps = [];

    for (const dep of requiredDeps) {
      if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
        missingDeps.push(dep);
      }
    }

    if (missingDeps.length > 0) {
      console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
      console.log('💡 Install with: npm install');
      return false;
    }

    console.log('✅ All dependencies found');
    return true;
  }

  static async generateReadme() {
    const readme = `# Simple Video Blocker for Kids - Testing

This directory contains automated tests for the Simple Video Blocker extension.

## Prerequisites

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Load Extension in Chrome**
   - Open Chrome and go to \`chrome://extensions/\`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this directory
   - Note the extension ID for reference

## Running Tests

### Quick Test
\`\`\`bash
npm test
\`\`\`

### Comprehensive Tests
\`\`\`bash
# Test all functionality
node test-runner.js

# Test blocking specifically
node test-blocking.js

# Test settings/options
node test-settings.js
\`\`\`

### Individual Test Suites
\`\`\`bash
npm run test-blocking  # Blocking functionality
npm run test-settings  # Settings and options
npm run test-all       # All tests sequentially
\`\`\`

## Test Reports

After running tests, you'll find reports in:
- \`test-report.json\` - Machine-readable comprehensive report
- \`test-report.md\` - Human-readable comprehensive report
- \`blocking-test-report.json\` - Blocking-specific results
- \`settings-test-report.json\` - Settings-specific results

## What Gets Tested

### Extension Basics
- ✅ Manifest structure and permissions
- ✅ Required files present
- ✅ Extension loads correctly
- ✅ Options page accessibility

### Blocking Functionality
- ✅ YouTube URL blocking
- ✅ TikTok URL blocking
- ✅ Netflix URL blocking
- ✅ Hulu URL blocking
- ✅ Embedded content removal
- ✅ Video/audio element blocking
- ✅ Network request interception
- ✅ Play() method interception

### Settings & Options
- ✅ Default settings (all blocked)
- ✅ Toggle functionality
- ✅ Settings persistence
- ✅ Visual feedback
- ✅ Save notifications
- ✅ Error handling
- ✅ Responsive design

### Advanced Features
- ✅ Badge status updates
- ✅ Tab reload on setting changes
- ✅ Dynamic content blocking
- ✅ Error recovery
- ✅ Performance validation

## Troubleshooting

### Common Issues

1. **"Extension not found" Error**
   - Make sure the extension is loaded in Chrome
   - Check that Developer mode is enabled
   - Verify all required files are present

2. **Tests Failing**
   - Check Chrome console for errors
   - Ensure no other extensions are interfering
   - Try running tests individually to isolate issues

3. **Network Tests Failing**
   - Check internet connection
   - Some tests may fail if test URLs are inaccessible
   - VPN or corporate firewalls may interfere

### Getting Help

1. Check the test reports for detailed error messages
2. Look at Chrome DevTools console during test runs
3. Review the extension's console logs
4. Ensure all dependencies are installed correctly

## Test Configuration

Modify \`test-data/test-config.json\` to:
- Change test timeouts
- Add new test URLs
- Adjust browser options
- Configure retry attempts

## Adding New Tests

1. Add test functions to the appropriate test class
2. Use the \`addResult(testName, passed, details)\` method
3. Follow the existing pattern for async operations
4. Update this README with new test descriptions

## Test Environment

- **Browser**: Chrome (headless: false by default for debugging)
- **Test Framework**: Custom Puppeteer-based framework
- **Reports**: JSON and Markdown formats
- **Cleanup**: Automatic browser cleanup after tests

## Success Criteria

- **Overall**: 80%+ pass rate
- **Blocking**: 90%+ pass rate
- **Settings**: 85%+ pass rate

Tests are designed to be comprehensive and catch real-world usage issues.
`;

    fs.writeFileSync(path.join(__dirname, 'TEST-README.md'), readme);
    console.log('✅ Test documentation created: TEST-README.md');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TestSetup();
  
  TestSetup.checkDependencies()
    .then(depsOk => {
      if (!depsOk) {
        console.log('\n💡 Run: npm install');
        process.exit(1);
      }
      return setup.setup();
    })
    .then(() => {
      return TestSetup.generateReadme();
    })
    .then(() => {
      console.log('\n🎉 Test environment ready!');
      console.log('👉 Next steps:');
      console.log('   1. Load extension in Chrome (Developer mode)');
      console.log('   2. Run: npm test');
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = TestSetup;