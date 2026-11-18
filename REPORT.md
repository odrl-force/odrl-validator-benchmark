# Report

These are the results of the benchmark with the 83 odrlapi samples. We used these versions:

- odrl-validator, commit `33a82d7`
- odrlapi, commit `9949458`

All the results, with the policies and the messages of each validator, are in [evaluation/results/summary.md](evaluation/results/summary.md).
We consider a policy valid if the validator does not give any violation. Warnings are not taken into account.

## Results

| Validator | Corrected samples | Original samples |
|---|---|---|
| odrl-validator | 77/83 (93%) | 68/83 (82%) |
| odrlapi | 80/83 (96%) | 80/83 (96%) |

With the corrected samples:

| Validator | Invalid accepted as valid | Valid rejected as invalid |
|---|---|---|
| odrl-validator | 1 (sample047) | 5 (sample022, sample023, sample045, sample053, sample061) |
| odrlapi | 1 (sample076) | 2 (sample046, sample079) |

There is no policy where both validators are wrong. The 9 policies with a wrong result are wrong in only one of the validators.

## Where odrl-validator fails

| Policy | Expected | What happens |
|---|---|---|
| sample022, sample023 | valid | The right operands are `500` and `50`, so they are `xsd:integer`. odrl-validator asks for an `xsd:decimal` in `odrl:payAmount` and `odrl:percentage`. But `xsd:integer` is a subtype of `xsd:decimal`, so the values are correct. |
| sample045 | valid | The Agreement does not have its own assigner, it takes it from the policy in `odrl:inheritFrom`. odrl-validator does not apply the inheritance, so it says that the assigner is missing. |
| sample047 | invalid | The inheritance is circular. odrl-validator does not check the inheritance, so it accepts the policy. |
| sample053 | valid | The constraint uses a property of a profile (`p1:unknown`). odrl-validator does not know this profile, and it says that the constraint is not an ODRL constraint. |
| sample061 | valid | The operator `p1:mystery` is from a profile. With `odrl:dateTime`, odrl-validator only accepts the standard comparison operators. |

To sum up:

- **Inheritance** is not supported: sample045 and sample047.
- **Profiles** are not considered: sample053 and sample061. If a policy declares a profile, the terms of this profile should not make the policy invalid.
- **Datatypes** are too strict: sample022 and sample023. XSD subtypes should be accepted.

## Where odrlapi fails

| Policy | Expected | What happens |
|---|---|---|
| sample046 | valid | odrlapi says "Permissions must have at least one target", but all the permissions in the file have a target. The only rule without a target is the obligation of `policyA`, and it takes the target of the policy. We think the problem is in how odrlapi works with nested inheritance. |
| sample076 | invalid | The right operand is a blank node, and odrlapi does not check this. |
| sample079 | valid | odrlapi says "Undefined action while the policy does not use a profile". |

## Original and corrected samples

We corrected 18 samples (see [dataset/odrlapi-samples/README.md](dataset/odrlapi-samples/README.md)). After the corrections, the result of odrl-validator is different in 11 of them. The results of odrlapi are the same.

These are the reasons why odrl-validator rejected the originals:

- **Turtle syntax errors** (sample032, sample070, sample071): it is not possible to read the file.
- **Dates without a datatype** (sample020, sample026, sample035): the ODRL Vocabulary says they must be `xsd:date` or `xsd:dateTime`.
- **Modelling errors** (sample024, sample036, sample055, sample067): the samples do not follow the ODRL model, for example there is an `odrl:action` outside the rule.

odrlapi accepts all these originals. It does not check the datatype of the dates. It also accepts files with Turtle syntax errors, for example the original sample076, that n3 cannot read.

With one correction, odrl-validator gets a worse result. The original sample047 did not have a target, and odrl-validator rejected it because of that. When we added the target, the only problem left was the circular inheritance, and odrl-validator does not detect it.

### Why does odrlapi give the same result with the original and the corrected samples?

Because odrlapi does not check the things that we corrected:

- **Turtle syntax errors**: odrlapi reads the files with Jena, which accepts some errors that n3 does not accept, for example a missing `.` at the end of the file. So it can read the originals that n3 cannot read (sample032, sample070, sample071, sample076).
- **Datatypes**: odrlapi does not check them, so it accepts dates without `xsd:date` (sample020, sample026, sample035).
- **Modelling errors**: odrlapi does not check them either. For example, it accepts an `odrl:action` outside the rule (sample055, sample067).

## Warnings

odrl-validator gives warnings in 80 of the 83 policies. Most of them are these three messages, which appear in almost all the policies because the samples do not declare the type of the assets and the parties:

| Warning | Times |
|---|---|
| Target should be a Asset or AssetCollection. | 106 |
| The assigner should be a Party or PartyCollection. | 69 |
| The assignee should be a Party or PartyCollection. | 32 |

odrlapi gives warnings in 17 policies.
