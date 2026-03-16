# Simple Video Blocker for Kids

A Chrome extension designed for parents to control their children's access to video content across the web. Smart defaults block high-risk platforms while allowing trusted streaming services.

## 🚀 Current Version: 1.2

## 📋 Features

### Core Blocking Functionality
- **Network-level blocking** using Chrome's declarativeNetRequest API
- **DOM-level blocking** for enhanced content removal
- **Smart badge indicators** showing blocking status (▶️ allowed, ⏸️ blocked)
- **Automatic tab refresh** when settings change

### Platform Support
- ✅ **YouTube** - Comprehensive blocking across all domains (youtube.com, youtu.be, youtube-nocookie.com, googlevideo.com)
- ✅ **TikTok** - Full coverage including mobile domains (tiktok.com, vm.tiktok.com, vt.tiktok.com, tiktokv.com, tiktokcdn.com, musical.ly)
- ✅ **Netflix** - Streaming service blocking (netflix.com, nflxvideo.net, nflxso.net) 
- ✅ **Hulu** - Streaming service blocking (hulu.com, hulustream.com)

### Smart Defaults
- **YouTube**: Blocked by default (high-risk content)
- **TikTok**: Blocked by default (high-risk content) 
- **Netflix**: Allowed by default (subscription service)
- **Hulu**: Allowed by default (subscription service)

### User Interface
- **Modern, responsive settings page** with toggle switches
- **Visual status indicators** (red for blocked, green for allowed)
- **Click-anywhere toggle** functionality on setting items
- **Real-time save status** notifications
- **Beta feature labeling** for streaming services

### Feedback & Support
- **Direct Google Forms integration** for user feedback
- **Chrome Web Store review button** to encourage ratings
- **Comprehensive error handling** with user-friendly messages
- **Automatic settings persistence** across browser sessions

## 📊 Version History

### Version 1.1 (Released)
**Major Features Added:**
- ✅ **Smart Default Settings**: Netflix/Hulu allowed by default, YouTube/TikTok blocked
- ✅ **Chrome Web Store Review Integration**: Added review button to encourage user ratings
- ✅ **Google Forms Feedback System**: Direct integration with feedback collection
- ✅ **Enhanced TikTok Blocking**: Added comprehensive domain coverage for mobile platforms
- ✅ **Improved Settings Persistence**: Better initialization and storage handling
- ✅ **UI/UX Improvements**: Modern interface with better visual feedback

**Technical Improvements:**
- Fixed Netflix and Hulu blocking implementation
- Added comprehensive error handling throughout
- Implemented browser badge status indicators  
- Enhanced testing infrastructure
- Improved default settings initialization
- Better storage sync reliability

**Bug Fixes:**
- Fixed TikTok not working when set to "allowed"
- Resolved settings not persisting across updates
- Fixed race conditions in storage initialization

### Version 1.0 (Initial Release)
- Basic YouTube and TikTok blocking functionality
- Simple settings interface
- Network-level content blocking

### Version 1.2 (Current)
**Major Features Added:**
- 🔒 **PIN Protection System**: 4-digit PIN locks with failed attempt lockouts
- ⏰ **Advanced Time Management**: Daily timers (30min-6hrs) and weekly scheduling
- 🔔 **5-Minute Warning Notifications**: Alerts before timer expires or schedule blocks resume  
- 📅 **24-Hour Weekly Schedule**: Granular control over allowed video times (1am-12am format)
- 🎨 **New UI Design**: Clean white/orange theme replacing purple gradient
- 🚦 **Enhanced Badge System**: Play button (▶️) when allowed, pause button (⏸️) when blocked
- 🛡️ **Comprehensive Parental Controls**: Settings protected by PIN authentication

**Technical Improvements:**
- Automatic schedule enforcement with 5-minute background checking
- Smart notification system preventing spam alerts
- Timer countdown with automatic blocking resumption
- Enhanced permission system including notifications
- Improved time-based rule management
- Real-time badge updates reflecting current blocking status

**Security Features:**
- PIN lockout system (5 minutes after 3 failed attempts)
- Protected settings changes requiring authentication
- Secure storage of parental control preferences

## 🛠 Technical Details

### Architecture
- **Manifest V3** Chrome extension
- **Service Worker** background script for network blocking
- **Content Scripts** for DOM-level blocking enhancement
- **Options Page** for user settings management

### Permissions Required
- `declarativeNetRequest` - Core blocking functionality
- `storage` - Settings persistence
- `declarativeNetRequestFeedback` - Blocking rule diagnostics  
- `tabs` - Tab refresh and badge updates
- `notifications` - Warning notifications for timers/schedule
- `<all_urls>` - Cross-site blocking capability

### File Structure
```
├── manifest.json          # Extension configuration
├── background.js          # Service worker with blocking rules
├── content.js            # DOM-level content blocking
├── options.html          # Settings page UI
├── options.js            # Settings page functionality
├── options.css           # Settings page styling
├── parental-controls.js   # PIN protection and time management
├── icon.png              # Extension icon
└── README.md             # This documentation
```

## 🔒 Privacy & Security

- **No data collection** - Extension operates entirely locally
- **No external servers** - All processing happens in browser
- **Settings stored locally** - User preferences never leave device
- **Open source approach** - Code is transparent and auditable

## 🌐 Browser Support

- **Chrome** - Full support (Manifest V3)
- **Edge** - Compatible (Chromium-based)
- **Other Chromium browsers** - Generally compatible

## 📦 Installation

1. Download from [Chrome Web Store](https://chromewebstore.google.com/detail/simple-video-blocker-for/gilffjhghogfgfdjinemcccoealbnoeg)
2. Click "Add to Chrome"
3. Extension icon appears in browser toolbar
4. Click icon or go to settings to configure blocking preferences

## ⚙️ Configuration

1. **Click extension icon** or right-click → "Options"
2. **Toggle platforms** - Click anywhere on a platform row to toggle
3. **Visual feedback** - Red background = blocked, Green = allowed
4. **Settings auto-save** - Changes persist automatically
5. **Badge indicator** - Shows X/4 blocked platforms count

## 🐛 Troubleshooting

### Videos Still Playing?
- Check if platform is set to "BLOCKED" in settings
- Try refreshing the page after changing settings
- Clear browser cache if issues persist

### Settings Not Saving?
- Check Chrome storage permissions
- Try closing and reopening options page
- Look for error messages in save status area

### Badge Not Updating?
- Extension may need browser restart
- Check if Chrome has latest extension version

## 🤝 Support & Feedback

- **Feedback Form**: Built-in Google Forms integration
- **Chrome Store**: Leave reviews and ratings
- **Issues**: Report bugs through feedback system

## 🔄 Development Status

**Current Focus**: Version 1.2 published with advanced parental controls
**Last Updated**: September 2025
**Active Maintenance**: Yes

---

*Simple Video Blocker for Kids - Keeping families safe online with smart, configurable content controls.*