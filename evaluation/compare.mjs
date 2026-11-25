// Compares the results of each validator with the expected.json of each group in dataset/
// and writes evaluation/results/comparison.csv (one row per policy) and evaluation/results/summary.md.
// Usage: node evaluation/compare.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const VALIDATORS = [ 'odrl-validator', 'odrlapi', 'odrl-multi-agent-shacl' ];

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
// (the default strategy is odrl:invalid, ODRL IM 2.10). odrlapi and the SHACL shapes do not report conflicts
// (odrlapi.csv has no conflicts column).
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
// The table with the original samples is only for odrlapi-samples, where we corrected many samples.
// tosl-openai also has an original/ folder, but with only one file.
const correctedGroups = [ 'odrlapi-samples' ].filter((group) => existsSync(join(ROOT, 'dataset', group, 'original')));

// Errors detected: for each invalid policy, which of the expected errors each validator reports.
// The expected errors (validationResults and conflicts in expected.json) and the messages of the validators are written
// differently, so both are grouped into the same categories. A validator detects an error if one of its messages
// is of the same category. A validator with no message for a category never detects it.
const CATEGORIES = [
    // odrlapi reads the files with Jena, which accepts some syntax errors: "partly" in the table "What each validator checks".
    { name: 'Turtle syntax error', expected: /Turtle syntax error/, 'odrl-validator': /^Error: /, odrlapi: /could not be parsed/, 'odrl-multi-agent-shacl': /^Error: /,
        partly: { odrlapi: 'Turtle syntax error, odrlapi: it accepts some syntax errors, like a missing "." at the end of the file (the originals of sample032, sample070, sample071 and sample076).' } },
    { name: 'No policy', expected: /no-policy/, 'odrl-validator': /No valid policy provided/, odrlapi: /There is no policy/ },
    { name: 'Policy without rules', expected: /without rules/i, 'odrl-validator': /at least one permission, obligation or prohibition/, odrlapi: /at least one permission, obligation or prohibition/, 'odrl-multi-agent-shacl': /must contain at least one rule/ },
    // The SHACL shapes require an odrl:uid triple, so this message appears in almost every policy (see validators/odrl-multi-agent-shacl/README.md).
    { name: 'Policy without IRI', expected: /no identifier/, 'odrl-validator': /identified by an IRI/, odrlapi: /identificative URI/, 'odrl-multi-agent-shacl': /exactly one IRI uid/ },
    { name: 'Rule without action', expected: /without action/, 'odrl-validator': /must have one action/, 'odrl-multi-agent-shacl': /must have at least one IRI action/ },
    { name: 'Permission without target', expected: /Permission without (action and )?target|permission has no asset/, 'odrl-validator': /A Permission must have one odrl:target/, odrlapi: /Permissions must have at least one target/, 'odrl-multi-agent-shacl': /Permission must have at least one IRI target/ },
    { name: 'Prohibition without target', expected: /Prohibition without (action and )?target/, 'odrl-validator': /A Prohibition must have one odrl:target/, 'odrl-multi-agent-shacl': /Prohibition must have at least one IRI target/ },
    { name: 'Missing assigner', expected: /missing assigner/, 'odrl-validator': /must have one assigner/, odrlapi: /without assigner|must have an assigner/, 'odrl-multi-agent-shacl': /must identify (an )?assigner/ },
    { name: 'Missing assignee', expected: /missing assignee/, 'odrl-validator': /must have one assignee/, odrlapi: /and an assignee/, 'odrl-multi-agent-shacl': /assigner and assignee/ },
    // odrl-validator reads a rule with odrl:permission/prohibition/obligation inside as a policy, and says that it is not of a policy type.
    // This message only appears in the policies with a rule inside another rule.
    { name: 'Rule inside another rule', expected: /inside another rule/, 'odrl-validator': /Value is not in http:\/\/www\.w3\.org\/ns\/odrl\/2\/Policy/ },
    { name: 'Unknown action', expected: /Actions that are not in the ODRL|unknown action/, 'odrl-validator': /Action is neither part|action outside the ODRL vocabulary/, odrlapi: /Undefined action/ },
    { name: 'Unknown left operand', expected: /unknown element in LeftOperand|foaf:age/, 'odrl-validator': /leftOperand should be part|constraint term .*outside the ODRL vocabulary/, odrlapi: /Undefined left operand/ },
    { name: 'Unknown operator', expected: /unknown element in operator/, 'odrl-validator': /operator should be a standard|constraint term .*outside the ODRL vocabulary/, odrlapi: /Undefined operator/ },
    { name: 'Unknown conflict strategy', expected: /conflict strategy/, 'odrl-validator': /conflict strategy must be/, odrlapi: /Undefined conflict strategy/ },
    { name: 'Malformed constraint', expected: /Constraint without leftOperand|Several right operands|constraint lacks|two left operands|wrong refinement|right operand reference to a literal|rightOperand is a blank node/, 'odrl-validator': /A Constraint must|Each constraint must conform/, odrlapi: /Constraints must have exactly/, 'odrl-multi-agent-shacl': /^(Violation: )?Constraint needs/ },
    { name: 'Operands of a logical constraint', expected: /operands .*not a list|operands must be constraints/, 'odrl-validator': /RdfListNodeShape|LogicalConstraint must contain/, odrlapi: /operand values must be unique Constraint/, 'odrl-multi-agent-shacl': /LogicalConstraint needs/ },
    { name: 'Wrong right operand value', expected: /right operand of odrl:dateTime|odrl:spatial must be IRIs/, 'odrl-validator': /The rightOperand of odrl:/ },
    { name: 'Operator not allowed for the left operand', expected: /must only be used with comparison operators/, 'odrl-validator': /must only be used with comparison operators/ },
    { name: 'Collection without source', expected: /lacks source/, 'odrl-validator': /collection with refinement must have one source/, odrlapi: /must have a odrl:source/ },
    { name: 'Inheritance', expected: /inheritance|inheritsFrom/i, 'odrl-validator': /inheritFrom/, odrlapi: /inheritance|inheritsFrom/,
        partly: {
            'odrl-validator': 'Inheritance, odrl-validator: it checks that odrl:inheritFrom refers to an existing policy (sample049, sample050), but it does not detect circular inheritance (sample047, sample048) and it does not apply the inheritance (sample045).',
            odrlapi: 'Inheritance, odrlapi: it detects the inheritance errors, but it does not apply nested inheritance well (sample046).',
        } },
    { name: 'Wrong remedy', expected: /remedy/, 'odrl-validator': /remedy/, odrlapi: /remedy/, 'odrl-multi-agent-shacl': /remedy must not have a consequence/ },
    { name: 'Rule that is a permission and a prohibition', expected: /both a permission and a prohibition/, 'odrl-validator': /A permission must be an odrl:Permission/ },
    { name: 'Conflict between rules', expected: /^Conflict: /, 'odrl-validator': /^Conflict: / },
];

const score = (v, list, resultOf) => {
    const correct = list.filter((r) => resultOf(v, r) === r.expected).length;
    return `${correct}/${list.length} (${Math.round(100 * correct / list.length)}%)`;
};

function scoreTable(title, list, resultOf) {
    lines.push('', `## ${title}`, '', '"Invalid accepted as valid" is the worst mistake: a wrong policy passes as correct.', '', '| Validator | Correct | Invalid accepted as valid | Valid rejected as invalid |', '|---|---|---|---|');
    for (const v of VALIDATORS) {
        const missed = list.filter((r) => r.expected === 'invalid' && resultOf(v, r) === 'valid').length;
        const falseAlarms = list.filter((r) => r.expected === 'valid' && resultOf(v, r) === 'invalid').length;
        lines.push(`| ${v} | ${score(v, list, resultOf)} | ${missed} | ${falseAlarms} |`);
    }
}

const lines = [ '# Summary', '', `${rows.length} policies in ${GROUPS.length} groups. A policy is invalid for a validator if it reports a violation or a conflict. Warnings do not count.` ];
scoreTable('Results on all the policies', rows, (v, r) => r[v]);

lines.push('', '## Results by group', '', 'Correct results in each folder of `dataset/`.', '', `| Group | Policies | Expected invalid | ${VALIDATORS.join(' | ')} |`, `|---|---|---|${VALIDATORS.map(() => '---|').join('')}`);
for (const group of GROUPS) {
    const list = rows.filter((r) => r.group === group);
    lines.push(`| ${group} | ${list.length} | ${list.filter((r) => r.expected === 'invalid').length} | ${VALIDATORS.map((v) => score(v, list, (v2, r) => r[v2])).join(' | ')} |`);
}

for (const group of correctedGroups) {
    const list = rows.filter((r) => r.group === group);
    lines.push('', `## Results on the original samples of ${group}`, '',
        'The samples before our corrections (see `dataset/odrlapi-samples/README.md`). The last column is the result with the corrected samples.',
        '', '| Validator | Correct (original) | Invalid accepted as valid | Valid rejected as invalid | Correct (corrected) |', '|---|---|---|---|---|');
    for (const v of VALIDATORS) {
        const missed = list.filter((r) => r.expected === 'invalid' && onOriginal(v, r) === 'valid').length;
        const falseAlarms = list.filter((r) => r.expected === 'valid' && onOriginal(v, r) === 'invalid').length;
        lines.push(`| ${v} | ${score(v, list, onOriginal)} | ${missed} | ${falseAlarms} | ${score(v, list, (v2, r) => r[v2])} |`);
    }
}

// What each validator checks: a validator checks a kind of error if it has a message for it (see CATEGORIES below).
// This explains most of the differences in the results.
lines.push('', '## What each validator checks', '',
    'Which kinds of errors each validator reports in this dataset. "no": we never saw this kind of message from the validator. "partly": see the notes below the table.',
    '', `| Kind of error | ${VALIDATORS.join(' | ')} |`, `|---|${VALIDATORS.map(() => '---|').join('')}`);
for (const c of CATEGORIES) {
    lines.push(`| ${c.name} | ${VALIDATORS.map((v) => (c.partly?.[v] ? 'partly' : c[v] ? 'yes' : 'no')).join(' | ')} |`);
}
const partlyNotes = CATEGORIES.flatMap((c) => Object.values(c.partly ?? {}));
if (partlyNotes.length) lines.push('', 'Notes:', '', ...partlyNotes.map((note) => `- ${note}`));

// The time of each validator, measured by run-benchmark.sh (only the validation, not the installation).
const timesFile = join(import.meta.dirname, 'results', 'times.csv');
if (existsSync(timesFile)) {
    const minutes = (seconds) => (seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`);
    lines.push('', '## Time', '',
        'Time to validate all the files of `dataset/`, with the original samples. It depends on the computer. odrlapi is slower because it starts Java for each file.',
        '', '| Validator | Files | Time | Time per file |', '|---|---|---|---|');
    for (const t of readCsv(timesFile)) {
        lines.push(`| ${t.validator} | ${t.files} | ${minutes(Number(t.seconds))} | ${(Number(t.seconds) / Number(t.files)).toFixed(2)} s |`);
    }
}

const expectedLabel = (r) => `${r.expected}${r.uncertain ? ' (?)' : ''}`;
// The messages of each validator: odrlapi writes '\n' between them, the others separate them with ' | '.
const messages = Object.fromEntries(VALIDATORS.map((v) => [ v, (file) => (results[v][file]?.messages || '').split(' | ').filter(Boolean) ]));
messages.odrlapi = (file) => (results.odrlapi[file]?.text || '').split('\\n').map((m) => m.trim()).filter(Boolean);
const reasons = Object.fromEntries(expected.map((e) => [ e.file, e.expected.validationResults ]));

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
    `For each invalid policy (${errors.length}), which of its expected errors (${totalWanted}) the validator reports. To compare them, the expected errors and the messages are grouped into categories (\`CATEGORIES\` in \`evaluation/compare.mjs\`).`,
    '',
    '**This is an approximate measure.** The main result is "Results on all the policies", because:',
    '',
    '- We chose the categories. Another person could group the messages in a different way.',
    '- It does not check that the message is about the same rule as the expected error.',
    '- One message can count for two categories, for example "assigner and assignee".',
    '- Warnings also count.',
    '- Many categories have only 1 or 2 expected errors.',
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
lines.push('', '### Error messages in no category', '', 'Messages that are in no category. If a validator adds a new kind of error, it appears here.', '');
for (const v of VALIDATORS) {
    lines.push(`- **${v}**: ${uncategorisedMessages[v].length ? '' : 'none'}`, ...uncategorisedMessages[v].map((m) => `  - ${m}`));
}

lines.push('', '## Disagreements between the validators', '', 'The policies where the validators do not give the same result, with the policy and the messages of each validator.');
for (const r of rows.filter((r) => new Set(VALIDATORS.map((v) => r[v])).size > 1)) {
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
lines.push('', '## Original and corrected samples', '', 'The files that we corrected, with the result of each validator before and after the correction.', '', `| Policy | Expected | ${VALIDATORS.map((v) => `${v} (original → corrected)`).join(' | ')} | Why odrl-validator rejected the original |`, `|---|---|${VALIDATORS.map(() => '---|').join('')}---|`);
for (const r of changed) {
    lines.push(`| ${r.file} | ${expectedLabel(r)} | ${VALIDATORS.map((v) => `${result(v, originalOf(r.file))} → ${r[v]}`).join(' | ')} | ${rejection(originalOf(r.file))} |`);
}

const header = [ 'group', 'file', 'expected', 'uncertain', ...VALIDATORS, ...VALIDATORS.map((v) => `${v} errors`) ];
writeFileSync(join(import.meta.dirname, 'results', 'comparison.csv'), [ header.join(','), ...rows.map((r) => header.map((k) => r[k]).join(',')) ].join('\n') + '\n');
writeFileSync(join(import.meta.dirname, 'results', 'summary.md'), lines.join('\n') + '\n');
// Only the result tables are printed; the details are in the summary.
console.log(lines.slice(0, lines.indexOf('## Disagreements between the validators')).join('\n').trim());
console.log('\nDetails: evaluation/results/summary.md');
