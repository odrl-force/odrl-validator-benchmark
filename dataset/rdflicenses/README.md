# RDFLicenses

Licenses (Apache, GPL, Creative Commons, ...) written as ODRL policies, from [Licensius](https://github.com/oeg-upm/licensius).
Copied from [odrl-force/odrl-validator](https://github.com/odrl-force/odrl-validator), commit `e329d2f` (`data/rdflicenses`).

They were written for an older version of ODRL, so none of them is valid ODRL 2.2. Almost all of them have rules without a target. Some of them also use actions that are neither in the ODRL vocabulary nor in a declared profile, for example the `ldr:` actions or `cc:Copyleft`. The usual Creative Commons actions (`cc:Reproduction`, `cc:Distribution`, ...) are fine: they are part of the ODRL Common Vocabulary. The reasons of each license are in [expected.json](expected.json).
