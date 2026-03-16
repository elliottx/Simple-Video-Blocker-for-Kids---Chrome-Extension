# Simple Video Blocker for Kids - Testing

This directory contains automated tests for the Simple Video Blocker extension.

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this directory
   - Note the extension ID for reference

## Running Tests

### Quick Test
```bash
npm test
```

### Comprehensive Tests
```bash
# Test all functionality
node test-runner.js

# Test blocking specifically
node test-blocking.js

# Test settings/options
node test-settings.js
```

### Individual Test Suites
```bash
npm run test-blocking  # Blocking functionality
npm run test-settings  # Settings and options
npm run test-all       # All tests sequentially
```

## Test Reports

After running tests, you'll find reports in:
- `test-report.json` - Machine-readable comprehensive report
- `test-report.md` - Human-readable comprehensive report
- `blocking-test-report.json` - Blocking-specific results
- `settings-test-report.json` - Settings-specific results

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

Modify `test-data/test-config.json` to:
- Change test timeouts
- Add new test URLs
- Adjust browser options
- Configure retry attempts

## Adding New Tests

1. Add test functions to the appropriate test class
2. Use the `addResult(testName, passed, details)` method
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
