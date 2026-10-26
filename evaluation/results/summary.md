# Summary

Policies: 83 (8 with an uncertain expected result, marked with (?))

## Results on the corrected samples

| Validator | Correct | Invalid accepted as valid | Valid rejected as invalid |
|---|---|---|---|
| odrl-validator | 77/83 (93%) | 1 | 5 |
| odrlapi | 80/83 (96%) | 1 | 2 |

## Results on the original samples

| Validator | Correct | Invalid accepted as valid | Valid rejected as invalid |
|---|---|---|---|
| odrl-validator | 68/83 (82%) | 0 | 15 |
| odrlapi | 80/83 (96%) | 1 | 2 |

## Disagreements between the validators

### odrlapi-samples/sample022.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix dct: <http://purl.org/dc/terms/> .

  #valid. (example 20 in the IM)
  <http://odrlapi.appspot.com/samples/sample022>
      dct:source <http://w3c.github.io/poe/model/> ;
      a odrl:Agreement ;
      odrl:profile <http://example.com/odrl:profile:09> ;
      odrl:obligation [
          odrl:target <http://example.com/photoAlbum:55> ;
          odrl:assigner <http://example.com/org:43> ;
          odrl:assignee <http://example.com/person:44> ;
          odrl:action [
              rdf:value odrl:compensate ;
              odrl:refinement [
                  odrl:leftOperand odrl:payAmount;
                  odrl:operator odrl:eq;
                  odrl:rightOperand 500;
                  odrl:unit <http://dbpedia.org/resource/Euro>
              ] 
          ] 
      ] .
  ```

  </details>

- **odrl-validator**: invalid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assignee should be a Party or PartyCollection.
  - Warning: The assigner should be a Party or PartyCollection.
  - Violation: The rightOperand of odrl:payAmount must be an xsd:decimal.
- **odrlapi**: valid
  - valid
  - warning. Please consider using Actions with a URI

### odrlapi-samples/sample023.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix dct: <http://purl.org/dc/terms/> .

  #valid. (example 13 in the IM)
  <http://odrlapi.appspot.com/samples/sample023>
      dct:source <http://w3c.github.io/poe/model/> ;
      a odrl:Offer ;
      odrl:profile <http://example.com/odrl:profile:10> ;
      odrl:obligation [
          odrl:target <http://example.com/document:1234> ;
          odrl:assigner <http://example.com/org:616> ;
          odrl:assignee <http://example.com/person:44> ;
          odrl:action [
              rdf:value odrl:print;
              odrl:refinement [
                  odrl:leftOperand odrl:percentage;
                  odrl:operator odrl:lteq;
                  odrl:rightOperand 50;
              ] 
          ] 
      ] .
  ```

  </details>

- **odrl-validator**: invalid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assignee should be a Party or PartyCollection.
  - Warning: The assigner should be a Party or PartyCollection.
  - Violation: The rightOperand of odrl:percentage must be an xsd:decimal from 0 to 100.
- **odrlapi**: valid
  - valid
  - warning. Please consider using Actions with a URI

### odrlapi-samples/sample045.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix dct: <http://purl.org/dc/terms/> .

  #valid. (example 32-33 in the spec)
  <http://odrlapi.appspot.com/samples/sample045>
      dct:source <http://w3c.github.io/poe/model/> ;
      a odrl:Policy ;
      odrl:profile <http://example.com/odrl:profile:30> ;
      odrl:assigner <http://example.com/org-01> ;
      odrl:obligation [
          odrl:target <http://example.com/asset:terms-and-conditions> ;
          odrl:action odrl:reviewPolicy
      ] .

  <http://odrlapi.appspot.com/samples/sample045b>
      a odrl:Agreement ;
      odrl:profile <http://example.com/odrl:profile:30> ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/sample045> ;
      odrl:assignee <http://example.com/user:0001> ;
      odrl:permission [
          odrl:target <http://example.com/asset:555> ;
          odrl:action odrl:display
      ] .
  ```

  </details>

- **odrl-validator**: invalid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assigner should be a Party or PartyCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assignee should be a Party or PartyCollection.
  - Violation: An Agreement rule must have one assigner.
- **odrlapi**: valid
  - valid
  - Warning: agreements, offers and sets are incompatibles

### odrlapi-samples/sample046.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix dct: <http://purl.org/dc/terms/> .

  #valid. Nested inheritance is allowed, possibly from more than policy
  <http://odrlapi.appspot.com/samples/policyA>
      a odrl:Policy ;
      dct:source "victor" ;
      odrl:assigner <http://example.com/org-01> ;
      odrl:target <http://example.com/asset:terms-and-conditions> ;
      odrl:obligation [
          odrl:action odrl:reviewPolicy
      ] .

  <http://odrlapi.appspot.com/samples/policyB>
      a odrl:Policy ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/policyA> ;
      odrl:permission [
          odrl:target <http://example.com/asset:8623> ;
          odrl:assignee <http://example.com/assigneeB> ;
          odrl:action odrl:display
      ] .

  <http://odrlapi.appspot.com/samples/policyC>
      a odrl:Policy ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/policyB> ;
      odrl:permission [
          odrl:target <http://example.com/asset:8623> ;
          odrl:action odrl:print
      ] .

  <http://odrlapi.appspot.com/samples/policyD>
      a odrl:Policy ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/policyE> ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/policyB> ;
      odrl:permission [
          odrl:target <http://example.com/asset:8623> ;
          odrl:action odrl:reproduce
      ] .

  <http://odrlapi.appspot.com/samples/policyE>
      a odrl:Policy ;
      odrl:permission [
          odrl:target <http://example.com/asset:8623> ;
          odrl:action odrl:anonymize
      ] .

  <http://odrlapi.appspot.com/samples/policyF>
      a odrl:Policy ;
      odrl:permission [
          odrl:target <http://example.com/asset:8623> ;
          odrl:action odrl:execute
      ] .
  ```

  </details>

- **odrl-validator**: valid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assigner should be a Party or PartyCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assignee should be a Party or PartyCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: Target should be a Asset or AssetCollection.
- **odrlapi**: invalid
  - not valid. Permissions must have at least one target

### odrlapi-samples/sample047.ttl

- **Expected**: invalid (inheritance must not be circular)

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix dct: <http://purl.org/dc/terms/> .

  #invalid. Inheritance must not be circular.
  <http://odrlapi.appspot.com/samples/sample047>
      a odrl:Policy ;
      dct:source "victor" ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/sample047b> ;
      odrl:target <http://example.com/asset:terms-and-conditions> ;
      odrl:obligation [
          odrl:action odrl:reviewPolicy
      ] .

  <http://odrlapi.appspot.com/samples/sample047b>
      a odrl:Policy ;
      odrl:inheritFrom <http://odrlapi.appspot.com/samples/sample047> ;
      odrl:permission [
          odrl:assigner <http://example.com/asset:555> ;
          odrl:target <http://example.com/asset:terms-and-conditions> ;
          odrl:action odrl:display
      ] .
  ```

  </details>

- **odrl-validator**: valid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assigner should be a Party or PartyCollection.
- **odrlapi**: invalid
  - not valid. Policy inheritance graph cannot be cyclic!

### odrlapi-samples/sample053.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
  @prefix dct: <http://purl.org/dc/terms/> .
  @prefix p1: <http://odrlapi.appspot.com/profile> .

  #valid. With logical constraint defined in an a profile

  <http://odrlapi.appspot.com/samples/sample053>
      a odrl:Set ;
      dct:source "victor";
      odrl:profile <http://odrlapi.appspot.com/profile> ;
      odrl:permission [
          odrl:target <http://example.com/book/1999> ;
          odrl:assigner <http://example.com/org/paisley-park> ;
          odrl:action odrl:play ;
          odrl:constraint [
              p1:unknown ( <http://example.com/p:88/C1> ) ;
          ]    
     ] .

  <http://example.com/p:88/C1> 
      a odrl:Constraint ;
      odrl:leftOperand "media" ;
      odrl:operator odrl:eq ;
      odrl:rightOperand odrl:online .
  ```

  </details>

- **odrl-validator**: invalid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assigner should be a Party or PartyCollection.
  - Violation: Each constraint must conform to ODRL constraint or ODRL logical constraint.
  - Warning: The constraint leftOperand should be part of the ODRL vocabulary or typed as odrl:LeftOperand.
- **odrlapi**: valid
  - valid

### odrlapi-samples/sample061.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
  @prefix p1: <http://odrlapi.appspot.com/profile/> .
  @prefix dct: <http://purl.org/dc/terms/> .

  #valid. unknown operator, but profile included
  <http://odrlapi.appspot.com/samples/sample061>
      a odrl:Policy;
      dct:creator "victor" ;
      odrl:profile p1:myprofile  ;
      odrl:permission [
          a odrl:Permission ;
          odrl:target <http://odrlapi.appspot.com/samples/asset000> ;
          odrl:action odrl:play ;
          odrl:constraint [
              odrl:leftOperand odrl:dateTime ;
              odrl:operator p1:mystery ;
              odrl:rightOperand "2017-12-31"^^xsd:date
          ]  
      ] .
  ```

  </details>

- **odrl-validator**: invalid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The operator should be a standard ODRL operators.
  - Violation: odrl:dateTime must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.
- **odrlapi**: valid
  - valid

### odrlapi-samples/sample076.ttl

- **Expected**: invalid (rightOperand is a blank node)

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix dct: <http://purl.org/dc/terms/> .
  @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

  #invalid. rightOperand is a blank node
  <http://odrlapi.appspot.com/samples/sample076>
      dct:source "victor" ;
      a odrl:Offer ;
      odrl:profile <http://example.com/odrl:profile:07> ;
      odrl:permission [
          odrl:target <http://example.com/game:9090> ;
          odrl:assigner <http://example.com/org:xyz> ;
          odrl:action odrl:play ;
          odrl:constraint [
              odrl:leftOperand odrl:dateTime ;
              odrl:operator odrl:lteq ;
              odrl:rightOperand [
                  rdfs:comment "Right operand without URI"
              ]
          ]            
      ] .
  ```

  </details>

- **odrl-validator**: invalid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assigner should be a Party or PartyCollection.
  - Violation: Each constraint must conform to ODRL constraint or ODRL logical constraint.
  - Violation: The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime.
  - Violation: A Constraint must declare exactly one odrl:rightOperand, given as a literal, an IRI, an odrl:RightOperand instance, or a list of these.
- **odrlapi**: valid
  - valid

### odrlapi-samples/sample079.ttl

- **Expected**: valid

  <details><summary>Policy (Turtle)</summary>

  ```turtle
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix ex: <http://example.org/> .

  odrl:share odrl:implies odrl:distribute . 
  odrl:move odrl:implies odrl:delete . 
   
  #valid
  <http://odrlapi.appspot.com/samples/sample079>
      a odrl:Policy;
      odrl:permission [
          a odrl:Permission ;
          odrl:target ex:PartA ;
          odrl:action odrl:share ;
          odrl:assignee ex:Bob
      ] ;
      odrl:prohibition [
          a odrl:Prohibition ;
          odrl:target ex:PartB ;
          odrl:action odrl:move ;
          odrl:assignee ex:Bob
      ] .
  ```

  </details>

- **odrl-validator**: valid
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assignee should be a Party or PartyCollection.
  - Warning: Target should be a Asset or AssetCollection.
  - Warning: The assignee should be a Party or PartyCollection.
- **odrlapi**: invalid
  - not valid. Undefined action while the policy does not use a profile.

## Original and corrected samples

| Policy | Expected | odrl-validator (original → corrected) | odrlapi (original → corrected) | Why odrl-validator rejected the original |
|---|---|---|---|---|
| odrlapi-samples/sample020.ttl | valid | invalid → valid | valid → valid | The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime. |
| odrlapi-samples/sample024.ttl | valid | invalid → valid | valid → valid | A LogicalConstraint must contain one of odrl:and, odrl:or, odrl:xone, or odrl:andSequence.<br>Missing expected value <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil> |
| odrlapi-samples/sample026.ttl | valid | invalid → valid | valid → valid | The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime. |
| odrlapi-samples/sample032.ttl | valid | invalid → valid | valid → valid | Error: Expected entity but got eof on line 16. |
| odrlapi-samples/sample035.ttl | valid | invalid → valid | valid → valid | The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime. |
| odrlapi-samples/sample036.ttl | valid (?) | invalid → valid | valid → valid | A Rule must have one action.<br>A Prohibition must have one odrl:target. |
| odrlapi-samples/sample047.ttl | invalid | invalid → valid | invalid → invalid | A Permission must have one odrl:target. |
| odrlapi-samples/sample053.ttl | valid | invalid → invalid | valid → valid | Each constraint must conform to ODRL constraint or ODRL logical constraint. |
| odrlapi-samples/sample055.ttl | valid | invalid → valid | valid → valid | A Rule must have one action. |
| odrlapi-samples/sample058.ttl | invalid | invalid → invalid | invalid → invalid | Error: Expected punctuation to follow "http://www.w3.org/ns/odrl/2/play" on line 13. |
| odrlapi-samples/sample060.ttl | invalid | invalid → invalid | invalid → invalid | Error: Expected punctuation to follow "http://www.w3.org/ns/odrl/2/play" on line 13. |
| odrlapi-samples/sample061.ttl | valid | invalid → invalid | valid → valid | odrl:dateTime must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.<br>The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime. |
| odrlapi-samples/sample065.ttl | invalid | invalid → invalid | invalid → invalid | A Rule must have one action.<br>A collection with refinement must have one source. |
| odrlapi-samples/sample066.ttl | invalid | invalid → invalid | invalid → invalid | A Rule must have one action.<br>A collection with refinement must have one source. |
| odrlapi-samples/sample067.ttl | valid | invalid → valid | valid → valid | A Rule must have one action. |
| odrlapi-samples/sample070.ttl | valid | invalid → valid | valid → valid | Error: Expected entity but got eof on line 15. |
| odrlapi-samples/sample071.ttl | valid | invalid → valid | valid → valid | Error: Expected entity but got eof on line 16. |
| odrlapi-samples/sample076.ttl | invalid | invalid → invalid | valid → valid | Error: Expected declaration to end with a dot on line 6. |
