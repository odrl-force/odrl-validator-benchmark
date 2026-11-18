// Compares the results of each validator with the expected.json of each group in dataset/
// and writes evaluation/results/comparison.csv (one row per policy) and evaluation/results/summary.md.
// Usage: node evaluation/compare.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

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

// Each folder in dataset/ is a group of policies with its own expected.json. The file of each policy is relative to its group.
const GROUPS = readdirSync(join(ROOT, 'dataset'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(ROOT, 'dataset', d.name, 'expected.json'))).map((d) => d.name).sort();
const expected = GROUPS.flatMap((group) => JSON.parse(readFileSync(join(ROOT, 'dataset', group, 'expected.json'), 'utf8'))
    .map((e) => ({ ...e, group, file: `${group}/${e.file}` })));
const results = Object.fromEntries(VALIDATORS.map((v) => [ v, Object.fromEntries(readCsv(join(import.meta.dirname, 'results', `${v}.csv`)).map((r) => [ r.file, r ])) ]));
// A policy is invalid for a validator if the validator reports a violation or a conflict.
// odrl-validator reports conflicts apart from `valid`, but in ODRL a conflict without a conflict strategy makes the policy void
// (the default strategy is odrl:invalid, ODRL IM 2.10). odrlapi does not report conflicts, so it has no conflicts column.
const result = (v, file) => {
    const r = results[v][file];
    if (!r) return '-';
    return r.valid === 'true' && !(Number(r.conflicts) > 0) ? 'valid' : 'invalid';
};

const rows = expected.map((e) => ({
    group: e.group,
    file: e.file,
    expected: e.expected.valid ? 'valid' : 'invalid',
    uncertain: e.uncertain === true,
    ...Object.fromEntries(VALIDATORS.map((v) => [ v, result(v, e.file) ])),
}));

// Counts are on all the policies. Policies with an uncertain expected result are marked with (?) in the tables.
// The original of a corrected sample is in the original/ folder. Samples that only exist as JSON-LD in odrlapi
// (sample075, sample077) have no Turtle original, so the converted version is used for them.
const originalOf = (file) => `${dirname(file)}/original/${basename(file)}`;
const onOriginal = (v, r) => (results[v][originalOf(r.file)] ? result(v, originalOf(r.file)) : r[v]);
// Only some groups have an original/ folder, with the policies before our corrections.
const correctedGroups = GROUPS.filter((group) => existsSync(join(ROOT, 'dataset', group, 'original')));

const score = (v, list, resultOf) => {
    const correct = list.filter((r) => resultOf(v, r) === r.expected).length;
    return `${correct}/${list.length} (${Math.round(100 * correct / list.length)}%)`;
};

function scoreTable(title, list, resultOf) {
    lines.push('', `## ${title}`, '', '| Validator | Correct | Invalid accepted as valid | Valid rejected as invalid |', '|---|---|---|---|');
    for (const v of VALIDATORS) {
        const missed = list.filter((r) => r.expected === 'invalid' && resultOf(v, r) === 'valid').length;
        const falseAlarms = list.filter((r) => r.expected === 'valid' && resultOf(v, r) === 'invalid').length;
        lines.push(`| ${v} | ${score(v, list, resultOf)} | ${missed} | ${falseAlarms} |`);
    }
}

const lines = [ '# Summary', '', `Policies: ${rows.length} in ${GROUPS.length} groups (${rows.filter((r) => r.uncertain).length} with an uncertain expected result, marked with (?))` ];
scoreTable('Results on all the policies', rows, (v, r) => r[v]);

lines.push('', '## Results by group', '', `| Group | Policies | Expected invalid | ${VALIDATORS.join(' | ')} |`, `|---|---|---|${VALIDATORS.map(() => '---|').join('')}`);
for (const group of GROUPS) {
    const list = rows.filter((r) => r.group === group);
    lines.push(`| ${group} | ${list.length} | ${list.filter((r) => r.expected === 'invalid').length} | ${VALIDATORS.map((v) => score(v, list, (v2, r) => r[v2])).join(' | ')} |`);
}

for (const group of correctedGroups) {
    const list = rows.filter((r) => r.group === group);
    scoreTable(`Results on the original samples of ${group}`, list, onOriginal);
}

const expectedLabel = (r) => `${r.expected}${r.uncertain ? ' (?)' : ''}`;
// The messages of each validator: odrl-validator separates them with ' | ', odrlapi writes '\n' between them.
const messages = {
    'odrl-validator': (file) => (results['odrl-validator'][file]?.messages || '').split(' | ').filter(Boolean),
    odrlapi: (file) => (results.odrlapi[file]?.text || '').split('\\n').map((m) => m.trim()).filter(Boolean),
};
const reasons = Object.fromEntries(expected.map((e) => [ e.file, e.expected.validationResults ]));

// Errors detected: for each invalid policy, which of the expected errors each validator reports.
// The expected errors (validationResults and conflicts in expected.json) and the messages of the validators are written
// differently, so both are grouped into the same categories. A validator detects an error if one of its messages
// is of the same category. A validator with no message for a category never detects it.
const CATEGORIES = [
    { name: 'Turtle syntax error', expected: /Turtle syntax error/, 'odrl-validator': /^Error: /, odrlapi: /could not be parsed/ },
    { name: 'No policy', expected: /no-policy/, 'odrl-validator': /No valid policy provided/, odrlapi: /There is no policy/ },
    { name: 'Policy without rules', expected: /without rules/i, 'odrl-validator': /at least one permission, obligation or prohibition/, odrlapi: /at least one permission, obligation or prohibition/ },
    { name: 'Policy without IRI', expected: /no identifier/, 'odrl-validator': /identified by an IRI/, odrlapi: /identificative URI/ },
    { name: 'Rule without action', expected: /without action/, 'odrl-validator': /must have one action/ },
    { name: 'Permission without target', expected: /Permission without (action and )?target|permission has no asset/, 'odrl-validator': /A Permission must have one odrl:target/, odrlapi: /Permissions must have at least one target/ },
    { name: 'Prohibition without target', expected: /Prohibition without (action and )?target/, 'odrl-validator': /A Prohibition must have one odrl:target/ },
    { name: 'Missing assigner', expected: /missing assigner/, 'odrl-validator': /must have one assigner/, odrlapi: /without assigner|must have an assigner/ },
    { name: 'Missing assignee', expected: /missing assignee/, 'odrl-validator': /must have one assignee/, odrlapi: /and an assignee/ },
    { name: 'Rule inside another rule', expected: /inside another rule/ },
    { name: 'Unknown action', expected: /Actions that are not in the ODRL|unknown action/, 'odrl-validator': /Action is neither part|action outside the ODRL vocabulary/, odrlapi: /Undefined action/ },
    { name: 'Unknown left operand', expected: /unknown element in LeftOperand|foaf:age/, 'odrl-validator': /leftOperand should be part|constraint term .*outside the ODRL vocabulary/, odrlapi: /Undefined left operand/ },
    { name: 'Unknown operator', expected: /unknown element in operator/, 'odrl-validator': /operator should be a standard|constraint term .*outside the ODRL vocabulary/, odrlapi: /Undefined operator/ },
    { name: 'Unknown conflict strategy', expected: /conflict strategy/, 'odrl-validator': /conflict strategy must be/, odrlapi: /Undefined conflict strategy/ },
    { name: 'Malformed constraint', expected: /Constraint without leftOperand|Several right operands|constraint lacks|two left operands|wrong refinement|right operand reference to a literal|rightOperand is a blank node/, 'odrl-validator': /A Constraint must|Each constraint must conform/, odrlapi: /Constraints must have exactly/ },
    { name: 'Operands of a logical constraint', expected: /operands .*not a list|operands must be constraints/, 'odrl-validator': /RdfListNodeShape|LogicalConstraint must contain/, odrlapi: /operand values must be unique Constraint/ },
    { name: 'Wrong right operand value', expected: /right operand of odrl:dateTime|odrl:spatial must be IRIs/, 'odrl-validator': /The rightOperand of odrl:/ },
    { name: 'Operator not allowed for the left operand', expected: /must only be used with comparison operators/, 'odrl-validator': /must only be used with comparison operators/ },
    { name: 'Collection without source', expected: /lacks source/, 'odrl-validator': /collection with refinement must have one source/, odrlapi: /must have a odrl:source/ },
    { name: 'Inheritance', expected: /inheritance|inheritsFrom/i, 'odrl-validator': /inheritFrom/, odrlapi: /inheritance|inheritsFrom/ },
    { name: 'Remedy with a consequence', expected: /remedy/, 'odrl-validator': /remedy/, odrlapi: /remedy/ },
    { name: 'Conflict between rules', expected: /^Conflict: /, 'odrl-validator': /^Conflict: / },
];
const expectedErrors = (e) => [ ...e.expected.validationResults, ...e.expected.conflicts.map((c) => `Conflict: ${c}`) ];
const categoriesOf = (texts, key) => new Set(texts.flatMap((t) => CATEGORIES.filter((c) => c[key]?.test(t)).map((c) => c.name)));
const errors = expected.filter((e) => !e.expected.valid).map((e) => {
    const texts = expectedErrors(e);
    const uncategorised = texts.filter((t) => !CATEGORIES.some((c) => c.expected.test(t)));
    if (uncategorised.length) throw new Error(`${e.file}: no category for the expected error "${uncategorised[0]}"`);
    const wanted = categoriesOf(texts, 'expected');
    return { file: e.file, wanted, ...Object.fromEntries(VALIDATORS.map((v) => [ v, new Set([ ...categoriesOf(messages[v](e.file), v) ].filter((c) => wanted.has(c))) ])) };
}).filter((e) => e.wanted.size > 0);
const totalWanted = errors.reduce((n, e) => n + e.wanted.size, 0);
for (const r of rows) {
    const e = errors.find((x) => x.file === r.file);
    for (const v of VALIDATORS) r[`${v} errors`] = e ? `${e[v].size}/${e.wanted.size}` : '';
}

lines.push('', '## Errors detected', '',
    `For each invalid policy, which of the expected errors the validator reports. ${errors.length} invalid policies, ${totalWanted} expected errors.`,
    'The expected errors and the messages of the validators are grouped into categories (see `CATEGORIES` in `evaluation/compare.mjs`).',
    '', '| Validator | Errors detected | Policies with all their errors detected |', '|---|---|---|');
for (const v of VALIDATORS) {
    const found = errors.reduce((n, e) => n + e[v].size, 0);
    const complete = errors.filter((e) => e[v].size === e.wanted.size).length;
    lines.push(`| ${v} | ${found}/${totalWanted} (${Math.round(100 * found / totalWanted)}%) | ${complete}/${errors.length} (${Math.round(100 * complete / errors.length)}%) |`);
}
lines.push('', '### Errors detected by category', '', `| Category | Expected | ${VALIDATORS.join(' | ')} |`, `|---|---|${VALIDATORS.map(() => '---|').join('')}`);
for (const c of CATEGORIES) {
    const list = errors.filter((e) => e.wanted.has(c.name));
    if (list.length === 0) continue;
    lines.push(`| ${c.name} | ${list.length} | ${VALIDATORS.map((v) => `${list.filter((e) => e[v].has(c.name)).length}${c[v] ? '' : ' (not checked)'}`).join(' | ')} |`);
}

// Error messages of the validators that are in no category: if a validator adds a new kind of error,
// it shows up here, so that CATEGORIES can be updated.
const isError = (m) => !/^(Warning:|valid$|warning|Warning|Please consider)/.test(m);
const uncategorisedMessages = Object.fromEntries(VALIDATORS.map((v) => [ v, [ ...new Set(Object.keys(results[v])
    .flatMap((file) => messages[v](file)).filter(isError).map((m) => m.replace(/^(not valid\. ?|Violation: )/, '').replace(/ on line \d+\.?$/, ''))
    .filter((m) => !CATEGORIES.some((c) => c[v]?.test(m)))) ].sort() ]));
lines.push('', '### Error messages in no category', '');
for (const v of VALIDATORS) {
    lines.push(`- **${v}**: ${uncategorisedMessages[v].length ? '' : 'none'}`, ...uncategorisedMessages[v].map((m) => `  - ${m}`));
}

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

const header = [ 'group', 'file', 'expected', 'uncertain', ...VALIDATORS, ...VALIDATORS.map((v) => `${v} errors`) ];
writeFileSync(join(import.meta.dirname, 'results', 'comparison.csv'), [ header.join(','), ...rows.map((r) => header.map((k) => r[k]).join(',')) ].join('\n') + '\n');
writeFileSync(join(import.meta.dirname, 'results', 'summary.md'), lines.join('\n') + '\n');
// Only the result tables are printed; the details are in the summary.
console.log(lines.slice(0, lines.indexOf('## Disagreements between the validators')).join('\n').trim());
console.log('\nDetails: evaluation/results/summary.md');
