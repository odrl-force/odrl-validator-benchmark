# ODRL Evaluator test suite

Policies of the [ODRL Test Suite](https://github.com/SolidLabResearch/ODRL-Test-Suite), from the paper [Interoperable Interpretation and Evaluation of ODRL Policies](https://link.springer.com/chapter/10.1007/978-3-031-94578-6_11).
Copied from [odrl-force/odrl-validator](https://github.com/odrl-force/odrl-validator), commit `e329d2f` (`data/policies`).

These policies were written to test an ODRL evaluator, not a validator, so some of them are not valid ODRL. For example, policy-1 to policy-7 have rules without a target, and the ODRL Information Model says that a Permission and a Prohibition MUST have one target.

The expected results are in [expected.json](expected.json). We decided them by reading each policy with the [ODRL Information Model](https://www.w3.org/TR/odrl-model/) and the [ODRL Vocabulary](https://www.w3.org/TR/odrl-vocab/).
