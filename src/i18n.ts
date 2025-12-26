import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let nlsConfig: any = {};
let initialized = false;

export function init(context: vscode.ExtensionContext) {
    if (initialized) return;
    // Simple detection for Japanese. For others, fallback to English (default in code)
    if (vscode.env.language === 'ja') {
            try {
                const nlsPath = path.join(context.extensionPath, 'package.nls.ja.json');
                if (fs.existsSync(nlsPath)) {
                    const content = fs.readFileSync(nlsPath, 'utf8');
                    nlsConfig = JSON.parse(content);
                }
            } catch (e) {
                console.error('MPC: Failed to load Japanese translations', e);
            }
    }
    initialized = true;
}

export function localize(key: string, defaultMessage: string): string {
    if (nlsConfig && nlsConfig[key]) {
        return nlsConfig[key];
    }
    return defaultMessage;
}

export function localizeArgs(key: string, defaultMessage: string, formattedString: string): string {
    let msg = localize(key, defaultMessage);
    return msg.replace('{0}', formattedString);
}
