# Simple Video Blocker - Test Scenarios

## Test Environment Setup
1. Load extension in Chrome Developer Mode
2. Open Chrome DevTools Console to monitor logs
3. Have test URLs ready for each platform

## Core Platform Blocking Tests

### YouTube Blocking Tests
**Test URLs:**
- Direct: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Short URL: `https://youtu.be/dQw4w9WgXcQ`
- Embedded: Test on sites with YouTube embeds (news sites, blogs)
- No-cookie: `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ`

**Expected Results:**
- Network requests to YouTube domains blocked
- Video elements removed from DOM
- Audio muted and playback prevented
- Embedded YouTube iframes removed from third-party sites

### TikTok Blocking Tests
**Test URLs:**
- Direct: `https://www.tiktok.com/@username/video/123456789`
- Embedded: Test on sites with TikTok embeds

**Expected Results:**
- Network requests to TikTok domains blocked
- Video elements removed from DOM
- Embedded TikTok content removed

### Netflix Blocking Tests
**Test URLs:**
- Direct: `https://www.netflix.com/title/123456`
- Test video playback if you have account access

**Expected Results:**
- Network requests to Netflix and CDN domains blocked
- Video playback prevented
- Media elements muted and paused

### Hulu Blocking Tests
**Test URLs:**
- Direct: `https://www.hulu.com/watch/123456`
- Test video playback if you have account access

**Expected Results:**
- Network requests to Hulu and CDN domains blocked
- Video playback prevented
- Media elements muted and paused

## Settings and Options Tests

### Options Page Functionality
1. **Access Test**: Click extension icon → should open options page
2. **Default State**: Fresh install should show all platforms blocked
3. **Toggle Test**: Toggle each platform and verify:
   - Visual feedback (color changes)
   - Save status notification
   - Settings persist after page refresh
4. **Bulk Changes**: Toggle multiple platforms quickly
5. **Error Handling**: Test with network disconnected

### Storage Tests
1. **Persistence**: Change settings, restart browser, verify settings maintained
2. **Sync**: Test settings sync across different Chrome profiles (if applicable)
3. **Corruption**: Test with corrupted storage data

## Real-World Integration Tests

### Embedded Content Tests
**Test Sites with Video Embeds:**
- News websites (CNN, BBC, etc.)
- Social media platforms
- Blog posts with embedded videos
- Educational sites with YouTube content

**Verification Steps:**
1. Visit site with blocked platform embeds
2. Verify embedded content is removed/blocked
3. Verify page functionality remains intact
4. Check console for error messages

### Dynamic Content Tests
1. **Single Page Applications**: Test on sites that load video content dynamically
2. **Infinite Scroll**: Test on sites with continuous content loading
3. **AJAX Loading**: Test video content loaded via JavaScript

### Tab Reload Tests
1. Change settings while platform tabs are open
2. Verify affected tabs reload automatically
3. Verify only relevant tabs are reloaded

## Performance and Edge Cases

### Performance Tests
1. **Memory Usage**: Monitor extension memory consumption over time
2. **CPU Usage**: Check performance impact during heavy video browsing
3. **Network Impact**: Verify blocking doesn't slow down other requests

### Edge Case Tests
1. **Rapid Setting Changes**: Toggle settings rapidly
2. **Multiple Tabs**: Test with many tabs of blocked platforms open
3. **Slow Networks**: Test with simulated slow network conditions
4. **Offline Mode**: Test behavior when network is unavailable

### Error Recovery Tests
1. **Extension Restart**: Disable/re-enable extension while blocking active
2. **Chrome Restart**: Test state recovery after browser restart
3. **Update Simulation**: Test extension update scenarios

## Badge and Visual Feedback Tests

### Badge Display Tests
1. **Default State**: All blocked should show "4/4" with red background
2. **Partial Blocking**: Some blocked should show count with orange background
3. **All Allowed**: Nothing blocked should show no badge with green background
4. **Hover Text**: Verify detailed status in tooltip

### Visual Feedback Tests
1. **Options Page Colors**: Verify red/green tinting for blocked/allowed states
2. **Save Notifications**: Test success and error notification display
3. **Responsive Design**: Test options page on different screen sizes

## Browser Compatibility Tests

### Chrome Manifest V3 Tests
1. **Service Worker**: Verify background script works as service worker
2. **Declarative Net Request**: Test rule updates work correctly
3. **Storage API**: Verify chrome.storage.sync functionality
4. **Permissions**: Test required permissions are sufficient

## Debugging and Logging Tests

### Console Output Tests
1. **Background Script**: Verify appropriate logging in service worker
2. **Content Script**: Check content script logs on blocked sites
3. **Options Page**: Verify settings change logging
4. **Error Scenarios**: Confirm error logging for troubleshooting

## User Experience Tests

### Installation Flow
1. **Fresh Install**: Test first-time user experience
2. **Default Settings**: Verify all platforms blocked by default
3. **Options Discovery**: Test how users find options page

### Parental Control Validation
1. **Ease of Use**: Non-technical parent can configure
2. **Clear Feedback**: Status is clearly communicated
3. **Reliability**: Blocking works consistently across browsing scenarios

## Testing Checklist

### Pre-Release Testing
- [ ] All core platform blocking tests pass
- [ ] Options page fully functional
- [ ] Badge displays correctly in all states
- [ ] Error handling graceful
- [ ] Performance acceptable
- [ ] Real-world site compatibility verified
- [ ] Settings persist correctly
- [ ] Tab reload functionality works
- [ ] Extension icon click opens options
- [ ] Console logs appropriate (not excessive)

### Regression Testing (After Changes)
- [ ] All previous functionality still works
- [ ] New features integrate properly
- [ ] Performance hasn't degraded
- [ ] Error handling still robust

## Manual Testing Script

1. **Install Extension**
   - Load in developer mode
   - Verify all platforms blocked by default
   - Check badge shows "4/4" in red

2. **Test Each Platform**
   - Visit direct platform URLs
   - Verify blocking active
   - Check embedded content on news sites

3. **Test Settings Changes**
   - Open options page via extension icon
   - Toggle each platform individually
   - Verify immediate feedback and persistence

4. **Test Edge Cases**
   - Multiple tabs with blocked content
   - Rapid setting changes
   - Browser restart scenarios

5. **Verify User Experience**
   - Clear visual feedback
   - Appropriate error messages
   - Smooth performance