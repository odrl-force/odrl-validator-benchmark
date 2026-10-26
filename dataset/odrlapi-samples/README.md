# odrlapi samples

The 83 example policies of [odrlapi](https://github.com/oeg-upm/licensius/tree/master/odrlapi), the ODRL validator by Victor Rodríguez-Doncel.
Source: `odrlapi/src/main/webapp/samples` in [oeg-upm/licensius](https://github.com/oeg-upm/licensius), commit `9949458`.

Each sample starts with a comment that says the expected result and why, for example `#invalid due to missing assigner in Offer`.
The expected results in `../../expected.csv` are taken from these comments.

## Changes to the original samples

The originals are kept in `original/`. The samples in this folder are the corrected ones:

- **Turtle syntax errors** (a missing `;` or `.`), which made the file impossible to read: sample058, sample060, sample070, sample071, sample076.
- **Modelling errors**: the sample failed or passed for a different reason than the one in its comment ([commit 2f60866](https://github.com/odrl-force/odrl-validator/commit/2f60866)):

  | Sample | What it tests | What was wrong |
  |---|---|---|
  | sample024 | valid | The operands of `odrl:xone` were not a list |
  | sample032 | valid, asset given outside the policy | It used the IRI of sample031 instead of sample032, and it ended with `;` instead of `.` (a Turtle syntax error) |
  | sample036 | valid (?), recursive remedy | The prohibition was nested inside another `odrl:prohibition` |
  | sample047 | invalid, circular inheritance | It had no target, so it also failed for that reason |
  | sample053 | valid, logical constraint from a profile | The value was not a list |
  | sample055, sample067 | valid | `odrl:action` was inside the target or the assignee, not in the rule |
  | sample065, sample066 | invalid, collection without source | The same `odrl:action` error, so they also failed for that reason |

- **Dates without a datatype**: the right operand of `odrl:dateTime` MUST be an `xsd:date` or `xsd:dateTime` ([ODRL Vocabulary](https://www.w3.org/TR/odrl-vocab/#term-dateTime)), but these samples wrote it as plain text. We added `^^xsd:date` (and the `xsd` prefix): sample020, sample026, sample035, sample061.
