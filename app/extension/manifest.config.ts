import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Page Snapshot',
  version: '0.0.1',
  description: 'Capture the current page DOM and forward it to a configured endpoint for processing.',
  action: {
    default_title: 'Page Snapshot',
    default_popup: 'popup.html',
    default_icon: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    }
  },
  background: {
    service_worker: 'src/background/main.ts',
    type: 'module'
  },
  options_page: 'options.html',
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png'
  },
  permissions: ['activeTab', 'scripting', 'storage', 'notifications'],
  optional_permissions: ['contextMenus'],
  host_permissions: ['<all_urls>']
});
