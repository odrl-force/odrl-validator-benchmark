// Validates every policy (.ttl) in the dataset folder with odrl-validator,
// and writes the results to evaluation/results/odrl-validator.csv.
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Parser } from 'n3';
import { ODRLValidator } from 'odrl-validator';

const ROOT = join(import.meta.dirname, '..', '..');
const files = readdirSync(join(ROOT, 'dataset'), { recursive: true }).filter((file) => file.endsWith('.ttl')).sort();
const validator = new ODRLValidator();

const csv = (value) => `"${String(value).replaceAll('"', '""')}"`;
const rows = [ 'file,valid,violations,warnings,messages' ];

for (const file of files) {
    let valid = false;
    let violations = 0;
    let warnings = 0;
    let messages = [];
    try {
        const quads = new Parser({ baseIRI: 'http://example.com/' }).parse(readFileSync(join(ROOT, 'dataset', file), 'utf8'));
        const result = await validator.validate(quads);
        valid = result.valid;
        for (const r of result.validationResults) {
            const severity = r.severity?.endsWith('Warning') ? 'Warning' : 'Violation';
            if (severity === 'Warning') {
                warnings++;
            } else {
                violations++;
            }
            messages.push(`${severity}: ${r.message}`);
        }
        messages.push(...result.conflicts.map((c) => `Conflict: ${c.message}`));
    } catch (error) {
        violations = 1;
        messages = [ `Error: ${error.message}` ];
    }
    rows.push([ file, valid, violations, warnings, csv(messages.join(' | ')) ].join(','));
    console.log(`${file}: ${valid ? 'valid' : 'NOT valid'}`);
}

writeFileSync(join(ROOT, 'evaluation', 'results', 'odrl-validator.csv'), rows.join('\n') + '\n');
