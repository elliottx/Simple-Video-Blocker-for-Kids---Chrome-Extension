# YouTube Channel Whitelist Feature

> Allow parents to whitelist specific YouTube channels while keeping YouTube blocked overall.

## Problem
Parents want kids to access educational content (Khan Academy, Crash Course, etc.) but block everything else on YouTube. Currently SVB is all-or-nothing for YouTube.

## How It Works
1. YouTube stays "blocked" overall
2. Parents add channel URLs or names to a whitelist in settings
3. When YouTube is blocked BUT a whitelisted channel is detected:
   - The channel page loads normally
   - Videos FROM that channel play normally
   - All other YouTube content (homepage, search, recommendations sidebar) stays hidden/blocked

## Implementation

### Settings UI (options.html/options.js)
- New section: "Allowed YouTube Channels"
- Text input + "Add" button
- List of added channels with remove buttons
- Accepts: channel URL, @handle, or channel name
- Stored in chrome.storage.sync as `allowedChannels: ["@KhanAcademy", "@CrashCourse", ...]`

### Content Script (content.js)
When YouTube is blocked:
1. Check current URL for `/channel/`, `/@`, or `/c/` paths
2. If current page is a whitelisted channel → don't block
3. If watching a video → check the channel name element on the page
4. If channel matches whitelist → allow video to play
5. Hide sidebar recommendations, comments (optional toggle)
6. Hide homepage content (force redirect to a "blocked" page or show only whitelisted channel links)

### Background Script (background.js)
- Don't block network requests to youtube.com if whitelist has entries
- Instead, let content.js handle selective blocking via DOM manipulation
- This means: when whitelist is active, YouTube loads but non-whitelisted content is hidden

## Channel Detection
YouTube channel identifiers:
- `@handle` (e.g., @KhanAcademy)
- Channel ID (e.g., UCsvqVGtbbyHaMoevxPAq9Fg)
- Custom URL (e.g., /c/khanacademy)

On video pages, the channel name appears in:
- `ytd-channel-name` element
- `#owner` section
- Meta tags

## Success Criteria
- Parent can add/remove channels in settings
- Whitelisted channel pages load when YouTube is "blocked"
- Videos from whitelisted channels play
- Non-whitelisted YouTube content is hidden
- Works with Shorts from whitelisted channels too
