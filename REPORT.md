# Report

These are the results of the benchmark with the 389 policies of the dataset (7 groups, see [README.md](README.md)). We used these versions:

- odrl-validator 0.2.0, commit `0e6b7e4`, with the TOSL and DPV-ODRL profiles
- odrlapi, commit `9949458`

All the results, with the policies and the messages of each validator, are in [evaluation/results/summary.md](evaluation/results/summary.md).
We consider a policy invalid if the validator gives a violation or a conflict. Warnings are not taken into account.
The expected result of 6 policies is still not clear (sample037, sample038, sample039, sample040, sample049, sample050). They are counted, and they are marked with (?) in the summary.

## Results

| Validator | Correct | Invalid accepted as valid | Valid rejected as invalid |
|---|---|---|---|
| odrl-validator | 386/389 (99%) | 1 (sample047) | 2 (sample021, sample045) |
| odrlapi | 358/389 (92%) | 25 | 6 |

By group:

| Group | Policies | Expected invalid | odrl-validator | odrlapi |
|---|---|---|---|---|
| elena-test | 11 | 8 | 11/11 (100%) | 5/11 (45%) |
| odrl-dpv | 29 | 0 | 29/29 (100%) | 29/29 (100%) |
| odrl-evaluator-test-suite | 29 | 12 | 29/29 (100%) | 23/29 (79%) |
| odrlapi-samples | 83 | 37 | 80/83 (96%) | 71/83 (86%) |
| rdflicenses | 179 | 179 | 179/179 (100%) | 179/179 (100%) |
| tosl-elsevier | 17 | 0 | 17/17 (100%) | 15/17 (88%) |
| tosl-openai | 41 | 3 | 41/41 (100%) | 36/41 (88%) |

There is no policy where both validators are wrong.
In odrl-dpv and rdflicenses both validators get the same result: the DPV policies are all valid, and all the rdflicenses fail for the same reason (a permission without target).

## Where odrl-validator fails

| Policy | Expected | What happens |
|---|---|---|
| sample021 | valid | There is a permission and a prohibition of the same action, but the policy says `odrl:conflict odrl:perm`, so the permission wins. odrl-validator does not apply the conflict strategy, so it reports a conflict. |
| sample045 | valid | The Agreement does not have its own assigner, it takes it from the policy in `odrl:inheritFrom`. odrl-validator does not apply the inheritance, so it says that the assigner is missing. |
| sample047 | invalid | The inheritance is circular. odrl-validator does not check the inheritance, so it accepts the policy. |

To sum up, odrl-validator does not support **inheritance** (sample045, sample047) and the **conflict strategy** (sample021).

## Where odrlapi fails

Invalid policies that odrlapi accepts (25):

| What odrlapi does not check | Policies |
|---|---|
| Conflicts: a permission and a prohibition of the same action, or two constraints that cannot be true together | elena-test test-03, test-05, test-06, test-07 |
| A prohibition without target (it only checks permissions) | policy-2, policy-4, policy-6 |
| Datatypes: `odrl:dateTime` with `odrl:isA` or with "tomorrow", `odrl:spatial` with strings | test-09, test-10, openai_37_prohibition03 |
| The operands of a logical constraint must be a list (`( :c1 :c2 )`, not `:c1, :c2`) | policy-15, policy-20, policy-21 |
| Literals instead of IRIs (`odrl:action "reproduce"`, `odrl:leftOperand "media"`) | sample024, sample034, sample053 |
| Terms of a profile that is declared but not available | sample056, sample059, sample061, sample063 |
| Other modelling errors: a remedy that is a prohibition, a rule that is a permission and a prohibition, a right operand that is a blank node, `foaf:age` as left operand | sample036, sample051, sample076, openai_02_permission01, Europe_terms_of_use_2024 |

Valid policies that odrlapi rejects (6):

| Policy | What happens |
|---|---|
| API_Service_Agreement_2017, clause-2.2 (tosl-elsevier), openai_36_permission26 | The assigner and the assignee are given in the policy, not in each rule. This is allowed in ODRL (a compact policy, ODRL IM 2.7.1), but odrlapi says "Agreements must have an assigner and an assignee". |
| sample046, openai_04_permission02 | odrlapi says "Permissions must have at least one target". In sample046 the target is inherited from another policy, so we think the problem is in how odrlapi works with nested inheritance. |
| sample079 | odrlapi says "Undefined action while the policy does not use a profile". |

## Errors detected

The tables above only say if the result (valid or invalid) is correct. Here we look at the errors: for each invalid policy, which of its expected errors the validator reports. For example, test-01 has a permission and a prohibition without action and without target, so it has 3 errors: a rule without action, a permission without target and a prohibition without target. odrl-validator detects the 3, and odrlapi only the permission without target.

The expected errors and the messages of the validators are written in a different way, so we group both into categories (see `CATEGORIES` in [evaluation/compare.mjs](evaluation/compare.mjs)). A validator detects an error if one of its messages is of the same category.

| Validator | Errors detected | Policies with all their errors detected |
|---|---|---|
| odrl-validator | 322/332 (97%) | 229/239 (96%) |
| odrlapi | 221/332 (67%) | 144/239 (60%) |

odrlapi stops at the first error it finds, and it does not check some kinds of errors at all: a rule without action, a prohibition without target, conflicts, datatypes and the operator allowed for each left operand.

The 10 errors that odrl-validator does not detect are:

- **A rule inside another rule** (5 errors): no validator checks it.
- **Inheritance** (2 errors): the same problem as in sample047.
- **Unknown action** (2 errors) and **the operands of a logical constraint** (1 error).

The numbers for each category are in [evaluation/results/summary.md](evaluation/results/summary.md).

## Original and corrected samples

We corrected 19 samples of odrlapi-samples and 1 file of tosl-openai (see [dataset/odrlapi-samples/README.md](dataset/odrlapi-samples/README.md) and [dataset/tosl-openai/README.md](dataset/tosl-openai/README.md)). The originals are in the `original/` folder of each group.

| Validator | odrlapi-samples, original | odrlapi-samples, corrected | tosl-openai, original | tosl-openai, corrected |
|---|---|---|---|---|
| odrl-validator | 73/83 (88%) | 80/83 (96%) | 40/41 (98%) | 41/41 (100%) |
| odrlapi | 71/83 (86%) | 71/83 (86%) | 36/41 (88%) | 36/41 (88%) |

After the corrections, the result of odrl-validator is different in 10 files. The results of odrlapi are the same.

These are the reasons why odrl-validator rejected the originals:

- **Turtle syntax errors** (sample032, sample070, sample071): it is not possible to read the file.
- **Dates without a datatype** (sample020, sample026, sample035): the ODRL Vocabulary says they must be `xsd:date` or `xsd:dateTime`.
- **Modelling errors** (sample055, sample067): there is an `odrl:action` outside the rule.
- **A constraint outside the policy** (openai_38_liability06): the liability with the constraint was not linked to the policy, so the TOSL profile did not apply to it. The same link is missing in the [TOSL example](https://github.com/isa-group/tosl/blob/main/examples/openai/Europe_terms_of_use_2024.ttl).

With one correction, odrl-validator gets a worse result. The original sample047 did not have a target, and odrl-validator rejected it because of that. When we added the target, the only problem left was the circular inheritance, and odrl-validator does not detect it.

### Why does odrlapi give the same result with the original and the corrected samples?

Because odrlapi does not check the things that we corrected:

- **Turtle syntax errors**: odrlapi reads the files with Jena, which accepts some errors that n3 does not accept, for example a missing `.` at the end of the file. So it can read the originals that n3 cannot read (sample032, sample070, sample071, sample076).
- **Datatypes**: odrlapi does not check them, so it accepts dates without `xsd:date` (sample020, sample026, sample035).
- **Modelling errors**: odrlapi does not check them either. For example, it accepts an `odrl:action` outside the rule (sample055, sample067).

## Warnings

odrl-validator gives warnings in 195 of the 389 policies. Most of them are these three messages, which appear in almost all the policies because the policies do not declare the type of the assets and the parties:

| Warning | Times |
|---|---|
| Target should be a Asset or AssetCollection. | 271 |
| The assigner should be a Party or PartyCollection. | 271 |
| The assignee should be a Party or PartyCollection. | 253 |

It also says when a policy declares a profile that is not available, for example "Profile http://example.com/odrl:profile:07 is not supported: terms from this profile are not validated".

odrlapi gives warnings in 32 policies.
