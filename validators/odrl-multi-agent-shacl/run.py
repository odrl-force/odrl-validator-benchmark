# Validates every policy (.ttl) in the dataset folder with the SHACL shapes of odrl-multi-agent-llm
# and writes the results to evaluation/results/odrl-multi-agent-shacl.csv, in the same format as odrl-validator.csv.
# The validation is the same as in backend/agents/validator/shacl_validator.py (pyshacl, inference="rdfs", advanced=True),
# with the shapes as they are.
# Run setup.sh first.
# Usage, from the root of this repository: validators/odrl-multi-agent-shacl/.venv/bin/python validators/odrl-multi-agent-shacl/run.py
import csv
from pathlib import Path

from pyshacl import validate
from rdflib import Graph, RDF
from rdflib.namespace import SH

ROOT = Path(__file__).resolve().parents[2]
one_line = lambda text: ' '.join(str(text).split())

shapes = Graph().parse(Path(__file__).parent / 'odrl_shapes.ttl', format='turtle')

files = sorted(p.relative_to(ROOT / 'dataset').as_posix() for p in (ROOT / 'dataset').rglob('*.ttl'))
rows = []
for file in files:
    violations = warnings = 0
    messages = []
    try:
        # The same base IRI as odrl-validator, for the policies with relative IRIs.
        data = Graph().parse(ROOT / 'dataset' / file, format='turtle', publicID='http://example.com/')
        _, report, _ = validate(data, shacl_graph=shapes, inference='rdfs', advanced=True, debug=False)
        for r in report.subjects(RDF.type, SH.ValidationResult):
            message = one_line(next(report.objects(r, SH.resultMessage), 'ODRL shape violation'))
            if next(report.objects(r, SH.resultSeverity), SH.Violation) == SH.Violation:
                violations += 1
                messages.append(f'Violation: {message}')
            else:
                warnings += 1
                messages.append(f'Warning: {message}')
    except Exception as error:
        violations = 1
        messages = [f'Error: {one_line(error)}']
    valid = violations == 0
    rows.append([file, str(valid).lower(), violations, warnings, 0, ' | '.join(messages)])
    print(f"{file}: {'valid' if valid else 'NOT valid'}")

with open(ROOT / 'evaluation' / 'results' / 'odrl-multi-agent-shacl.csv', 'w', newline='') as out:
    writer = csv.writer(out, lineterminator='\n')
    writer.writerow(['file', 'valid', 'violations', 'warnings', 'conflicts', 'messages'])
    writer.writerows(rows)
