# Assets Directory

This directory contains static assets for the Chrome extension.

## Structure

- `icons/` - Extension icons in various sizes
- `images/` - Images used in the extension UI
- `fonts/` - Custom fonts (if any)
- `data/` - Static data files

## Icon Requirements

- **16x16px** - Browser toolbar icon
- **32x32px** - Windows taskbar icon
- **48x48px** - Extension management page
- **128x128px** - Chrome Web Store

## Image Formats

- Use PNG format for icons with transparency
- Use SVG for scalable graphics
- Optimize images for web delivery

## Usage

Assets in this directory are accessible via `chrome.runtime.getURL()` in the extension code.
