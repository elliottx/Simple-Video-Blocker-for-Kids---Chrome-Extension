# YouTube and TikTok Video Blocker Chrome Extension

## Overview

This Chrome extension is designed to block YouTube and TikTok videos across all websites. It provides a comprehensive solution to prevent video content from these platforms from loading, helping prevent kids from watchingbrain rot videos.

## Features

1. **Video Blocking**: Blocks YouTube and TikTok videos embedded on any website.
2. **Audio Muting**: Automatically mutes and pauses any audio or video elements.
3. **Iframe Removal**: Removes iframes containing YouTube or TikTok content.
4. **Custom Embed Removal**: Eliminates YouTube custom embed elements.
5. **Periodic Checking**: Continuously scans for and removes new video content.

## How It Works

The extension uses a combination of techniques to ensure comprehensive blocking:

1. **Declarative Net Request Rules**: Blocks requests to YouTube and TikTok resources.
2. **Content Script**: Actively removes video elements and iframes from the DOM.
3. **Background Script**: Manages the extension's overall functionality.

## Technical Details

- **Manifest Version**: 3
- **Permissions**: declarativeNetRequest
- **Host Permissions**: <all_urls>
- **Content Script**: Runs on all URLs
- **Rule Resources**: Defined in rules.json

## Installation

1. Download the extension files.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the extension directory.

## Usage

Once installed, the extension works automatically on all websites. No user interaction is required.

## Note

This extension is intended for personal use and should be used responsibly. Be aware that blocking video content may affect the functionality of some websites.
