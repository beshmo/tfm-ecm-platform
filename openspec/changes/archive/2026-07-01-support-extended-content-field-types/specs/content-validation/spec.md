## MODIFIED Requirements

### Requirement: Validate supported primitive field types

The system SHALL validate `string`, `integer`, `date`, `time`, `boolean`, `datetime`, `decimal`, `html`, and `uri` field values without implicit coercion.

#### Scenario: String field accepts strings only

- **WHEN** a `string` field value is not a JavaScript string
- **THEN** validation returns an `INVALID_STRING` error

#### Scenario: Integer field accepts integer numbers only

- **WHEN** an `integer` field value is not a JavaScript number or is not `Number.isInteger(value)`
- **THEN** validation returns an `INVALID_INTEGER` error

#### Scenario: Date field accepts strict valid ISO calendar dates only

- **WHEN** a `date` field value is not a valid `YYYY-MM-DD` calendar date
- **THEN** validation returns an `INVALID_DATE` error

#### Scenario: Time field accepts strict time values only

- **WHEN** a `time` field value is not a valid `HH:mm:ss` time
- **THEN** validation returns an `INVALID_TIME` error

#### Scenario: Boolean field accepts booleans only

- **WHEN** a `boolean` field value is not a JavaScript boolean
- **THEN** validation returns an `INVALID_BOOLEAN` error

#### Scenario: Datetime field requires timezone

- **WHEN** a `datetime` field value is not a string timestamp with an explicit `Z` or numeric timezone offset
- **THEN** validation returns an `INVALID_DATETIME` error

#### Scenario: Decimal field accepts finite numbers only

- **WHEN** a `decimal` field value is not a JavaScript number or is not finite
- **THEN** validation returns an `INVALID_DECIMAL` error

#### Scenario: HTML field accepts strings only

- **WHEN** an `html` field value is not a JavaScript string
- **THEN** validation returns an `INVALID_HTML` error

#### Scenario: URI field accepts absolute URI strings only

- **WHEN** a `uri` field value is not a syntactically valid absolute URI string
- **THEN** validation returns an `INVALID_URI` error
