## ADDED Requirements

### Requirement: CMIS maps extended content field property types
The system SHALL expose extended ECMP content schema field types through CMIS property definitions using the closest supported CMIS property type.

#### Scenario: Boolean field maps to CMIS boolean
- **WHEN** CMIS type discovery exposes a user content type schema with a `boolean` field
- **THEN** the matching CMIS property definition uses property type `boolean`

#### Scenario: Datetime field maps to CMIS datetime
- **WHEN** CMIS type discovery exposes a user content type schema with a `datetime` field
- **THEN** the matching CMIS property definition uses property type `datetime`

#### Scenario: Decimal field maps to CMIS numeric property
- **WHEN** CMIS type discovery exposes a user content type schema with a `decimal` field
- **THEN** the matching CMIS property definition uses the supported CMIS numeric property type selected by the shared contract

#### Scenario: HTML and URI fields map to CMIS string
- **WHEN** CMIS type discovery exposes user content type schema fields of type `html` or `uri`
- **THEN** the matching CMIS property definitions use property type `string`

#### Scenario: Extended field values are exposed as CMIS property values
- **WHEN** a CMIS object response includes an ECMP content record with extended field values
- **THEN** the object properties include those values under the matching `ecmp:<fieldName>` property names when the values are scalar CMIS-compatible values
