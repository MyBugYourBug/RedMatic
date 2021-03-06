const fs = require('fs');

const defaults = require('/usr/local/addons/redmatic/lib/node_modules/node-red/settings.js');
const settings = require('/usr/local/addons/redmatic/etc/settings.json');
const logging = require('/usr/local/addons/redmatic/lib/logger.js');

// Migration
if (settings.logging.console) {
    settings.logging.ain = settings.logging.console;
    delete settings.logging.console;
    fs.writeFileSync('/usr/local/addons/redmatic/etc/settings.json', JSON.stringify(settings, null, '  '));
}

// Credentials encryption key
if (fs.existsSync('/usr/local/addons/redmatic/etc/credentials.key')) {
    settings.credentialSecret = fs.readFileSync('/usr/local/addons/redmatic/etc/credentials.key').toString();
}

// Logging
delete defaults.logging.console;
Object.assign(logging.logging.ain, settings.logging.ain);

// Enable Projects Feature
if (!defaults.editorTheme) {
    defaults.editorTheme = {};
}
if (!defaults.editorTheme.projects) {
    defaults.editorTheme.projects = {};
}
defaults.editorTheme.projects.enabled = defaults.editorTheme.projects.enabled || false;

// Inject sessionExpiryTime to Rega Authentication
if (settings.adminAuth && settings.adminAuth.type === 'rega') {
    const regaAuth = require('/usr/local/addons/redmatic/lib/rega-auth.js');
    if (settings.adminAuth.sessionExpiryTime) {
        regaAuth.sessionExpiryTime = settings.adminAuth.sessionExpiryTime;
    }
    settings.adminAuth = regaAuth;
}

// Context Storage
if (!settings.contextStorage) {
    settings.contextStorage = {};
}
if (!settings.contextStorage.default) {
    settings.contextStorage.default = {};
}
if (!settings.contextStorage.default.module) {
    settings.contextStorage.default.module = 'memory';
}
if (settings.contextStorage.default.module === 'localfilesystem') {
    settings.contextStorage.default.module = 'file';
}

if (settings.contextStorage.default.module !== 'file' && settings.contextStorage.default.module !== 'memory') {
    settings.contextStorage.default.module = 'memory';
}

if (!settings.contextStorage.memory) {
    settings.contextStorage.memory = {
        'module': 'memory'
    }
}
if (!settings.contextStorage.file) {
    settings.contextStorage.file = {
        'module': 'localfilesystem',
        config: {
            dir: '/usr/local/addons/redmatic/var',
            flushInterval: 30
        }
    }
}

const defaultContextStorage = Object.assign({}, settings.contextStorage[settings.contextStorage.default.module]);
delete settings.contextStorage[settings.contextStorage.default.module];
settings.contextStorage.default = defaultContextStorage;

const result = Object.assign(
    defaults,
    settings,
    logging
);

fs.writeFileSync('/tmp/red-settings.json', JSON.stringify(result));

module.exports = result;
