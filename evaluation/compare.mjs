// Compares the results of each validator with dataset/expected.json
// and writes evaluation/results/comparison.csv (one row per policy) and evaluation/results/summary.md.
// Usage: node evaluation/compare.mjs
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const VALIDATORS = [ 'odrl-validator', 'odrlapi' ];

// Minimal CSV parser: handles quoted fields with commas and escaped quotes.
function readCsv(path) {
    const [ header, ...lines ] = readFileSync(path, 'utf8').trim().split('\n');
    const keys = header.split(',');
    return lines.map((line) => {
        const values = [ ...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(,|$)/g) ].map((m) => m[1].replace(/^"|"$/g, '').replaceAll('""', '"'));
        return Object.fromEntries(keys.map((key, i) => [ key, values[i] ]));
    });
}

const expected = JSON.parse(readFileSync(join(ROOT, 'dataset', 'expected.json'), 'utf8'));
const results = Object.fromEntries(VALIDATORS.map((v) => [ v, Object.fromEntries(readCsv(join(import.meta.dirname, 'results', `${v}.csv`)).map((r) => [ r.file, r ])) ]));
const result = (v, file) => (results[v][file] ? (results[v][file].valid === 'true' ? 'valid' : 'invalid') : '-');

const rows = expected.map((e) => ({
    file: e.file,
    expected: e.expected.valid ? 'valid' : 'invalid',
    uncertain: e.uncertain === true,
    ...Object.fromEntries(VALIDATORS.map((v) => [ v, result(v, e.file) ])),
}));

// Counts are on all the policies. Policies with an uncertain expected result are marked with (?) in the tables.
// The original of a corrected sample is in the original/ folder. Samples that only exist as JSON-LD in odrlapi
// (sample075, sample077) have no Turtle original, so the converted version is used for them.
const originalOf = (file) => file.replace('/', '/original/');
const onOriginal = (v, r) => (results[v][originalOf(r.file)] ? result(v, originalOf(r.file)) : r[v]);

function scoreTable(title, resultOf) {
    lines.push('', `## ${title}`, '', '| Validator | Correct | Invalid accepted as valid | Valid rejected as invalid |', '|---|---|---|---|');
    for (const v of VALIDATORS) {
        const correct = rows.filter((r) => resultOf(v, r) === r.expected).length;
        const missed = rows.filter((r) => r.expected === 'invalid' && resultOf(v, r) === 'valid').length;
        const falseAlarms = rows.filter((r) => r.expected === 'valid' && resultOf(v, r) === 'invalid').length;
        lines.push(`| ${v} | ${correct}/${rows.length} (${Math.round(100 * correct / rows.length)}%) | ${missed} | ${falseAlarms} |`);
    }
}

const lines = [ '# Summary', '', `Policies: ${rows.length} (${rows.filter((r) => r.uncertain).length} with an uncertain expected result, marked with (?))` ];
scoreTable('Results on the corrected samples', (v, r) => r[v]);
scoreTable('Results on the original samples', onOriginal);

const expectedLabel = (r) => `${r.expected}${r.uncertain ? ' (?)' : ''}`;
// The messages of each validator: odrl-validator separates them with ' | ', odrlapi writes '\n' between them.
const messages = {
    'odrl-validator': (file) => (results['odrl-validator'][file]?.messages || '').split(' | ').filter(Boolean),
    odrlapi: (file) => (results.odrlapi[file]?.text || '').split('\\n').map((m) => m.trim()).filter(Boolean),
};
const reasons = Object.fromEntries(expected.map((e) => [ e.file, e.expected.validationResults ]));

lines.push('', '## Disagreements between the validators');
for (const r of rows.filter((r) => r['odrl-validator'] !== r.odrlapi)) {
    lines.push('', `### ${r.file}`, '');
    lines.push(`- **Expected**: ${expectedLabel(r)}${reasons[r.file].length > 0 ? ` (${reasons[r.file].join('; ')})` : ''}`);
    // The policy itself, folded so that it takes little space.
    const policy = readFileSync(join(ROOT, 'dataset', r.file), 'utf8').trim();
    // Indented by two spaces so that it is shown inside the "Expected" item.
    lines.push('', ...[ '<details><summary>Policy (Turtle)</summary>', '', '```turtle', ...policy.split('\n'), '```', '', '</details>' ].map((line) => (line ? `  ${line}` : '')), '');
    for (const v of VALIDATORS) {
        lines.push(`- **${v}**: ${r[v]}`, ...messages[v](r.file).map((m) => `  - ${m}`));
    }
}

// Samples we corrected: compare the result on the original and on the corrected version.
const changed = rows.filter((r) => results[VALIDATORS[0]][originalOf(r.file)]
    && readFileSync(join(ROOT, 'dataset', originalOf(r.file)), 'utf8') !== readFileSync(join(ROOT, 'dataset', r.file), 'utf8'));
// Why odrl-validator rejected the original: its violations, or the error when the file could not be read.
const rejection = (file) => [ ...new Set(messages['odrl-validator'](file).filter((m) => !m.startsWith('Warning:')).map((m) => m.replace(/^Violation: /, ''))) ].join('<br>');
lines.push('', '## Original and corrected samples', '', '| Policy | Expected | odrl-validator (original → corrected) | odrlapi (original → corrected) | Why odrl-validator rejected the original |', '|---|---|---|---|---|');
for (const r of changed) {
    lines.push(`| ${r.file} | ${expectedLabel(r)} | ${VALIDATORS.map((v) => `${result(v, originalOf(r.file))} → ${r[v]}`).join(' | ')} | ${rejection(originalOf(r.file))} |`);
}

const header = [ 'file', 'expected', 'uncertain', ...VALIDATORS ];
writeFileSync(join(import.meta.dirname, 'results', 'comparison.csv'), [ header.join(','), ...rows.map((r) => header.map((k) => r[k]).join(',')) ].join('\n') + '\n');
writeFileSync(join(import.meta.dirname, 'results', 'summary.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
