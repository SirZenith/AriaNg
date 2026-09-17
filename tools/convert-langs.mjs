import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const langsDir = join(rootDir, 'legacy', 'src', 'langs');
const sampleFile = join(rootDir, 'legacy', 'i18n', 'en.sample.txt');
const defaultLanguageFile = join(rootDir, 'legacy', 'src', 'scripts', 'config', 'defaultLanguage.js');
const outDir = join(rootDir, 'src', 'locales');

function getKeyValuePair(line) {
    for (let i = 0; i < line.length; i++) {
        if (i > 0 && line.charAt(i - 1) !== '\\' && line.charAt(i) === '=') {
            return {
                key: line.substring(0, i).replace('\\=', '='),
                value: line.substring(i + 1, line.length).replace('\\=', '=')
            };
        }
    }

    return { value: line };
}

function parseLanguage(content) {
    const result = {};
    let category = '';
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.endsWith('\r')) {
            line = line.substring(0, line.length - 1);
        }

        if (!line) {
            continue;
        }

        const categoryMatch = /^\[(.+)\]$/.exec(line);

        if (categoryMatch) {
            category = categoryMatch[1];
            continue;
        }

        const pair = getKeyValuePair(line);

        if (pair && pair.key && pair.value) {
            const key = category && category !== 'global' ? category + '.' + pair.key : pair.key;
            result[key] = pair.value;
        }
    }

    return result;
}

function parseDefaultLanguage() {
    const content = readFileSync(defaultLanguageFile, 'utf8');
    const marker = 'var defaultLanguageResource = {';
    const start = content.indexOf(marker);

    if (start < 0) {
        throw new Error('Cannot find defaultLanguageResource in ' + defaultLanguageFile);
    }

    const body = content.substring(start + marker.length);
    let depth = 1;
    let index = 0;

    for (; index < body.length; index++) {
        const char = body[index];

        if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth--;

            if (depth === 0) {
                break;
            }
        }
    }

    const resource = Function('return ({' + body.substring(0, index) + '})')();
    const result = {};

    for (const [key, value] of Object.entries(resource)) {
        if (value && typeof value === 'object') {
            for (const [subKey, subValue] of Object.entries(flatten(value, key))) {
                result[subKey] = subValue;
            }
        } else {
            result[key] = value;
        }
    }

    return result;
}

function flatten(resource, prefix) {
    const result = {};

    for (const [key, value] of Object.entries(resource)) {
        const fullKey = prefix + '.' + key;

        if (value && typeof value === 'object') {
            Object.assign(result, flatten(value, fullKey));
        } else {
            result[fullKey] = value;
        }
    }

    return result;
}

function writeLanguage(lang, resource) {
    const targetDir = join(outDir, lang);
    const targetFile = join(targetDir, 'translation.json');

    mkdirSync(targetDir, { recursive: true });
    writeFileSync(targetFile, JSON.stringify(resource, null, 2) + '\n', 'utf8');

    return Object.keys(resource).length;
}

rmSync(outDir, { recursive: true, force: true });

const languages = {};
const files = readdirSync(langsDir).filter((name) => name.endsWith('.txt'));

for (const file of files) {
    const lang = file.substring(0, file.lastIndexOf('.'));
    languages[lang] = writeLanguage(lang, parseLanguage(readFileSync(join(langsDir, file), 'utf8')));
}

const english = { ...parseDefaultLanguage(), ...parseLanguage(readFileSync(sampleFile, 'utf8')) };
languages['en'] = writeLanguage('en', english);

const report = Object.entries(languages)
    .map(([lang, count]) => `${lang}: ${count} keys`)
    .join('\n');

console.log('Language resources generated into src/locales:\n' + report);
