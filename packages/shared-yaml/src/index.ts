export interface ParsedSchemaDefinition {
  name: string;
  version: string;
  fields: Record<string, unknown>;
}

export interface SchemaParser {
  parse(source: string): ParsedSchemaDefinition;
}

export class NotImplementedSchemaParser implements SchemaParser {
  parse(_source: string): ParsedSchemaDefinition {
    throw new Error("YAML schema parsing is not implemented in the Phase 2 scaffold.");
  }
}
