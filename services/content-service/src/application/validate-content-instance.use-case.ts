import type {
  ContentInstanceValidationInput,
  ContentValidationResult
} from "@ecmp/shared-types";

import { validateContentInstanceData } from "../domain/content-validation";
import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";
import { ContentTypeSchemaNotFoundError } from "./content-validation.errors";

export class ValidateContentInstanceUseCase {
  constructor(private readonly schemaReader: ContentTypeSchemaReader) {}

  async execute(input: ContentInstanceValidationInput): Promise<ContentValidationResult> {
    const schema = input.schemaVersion
      ? await this.schemaReader.findByNameAndVersion(input.contentType, input.schemaVersion)
      : await this.schemaReader.findLatestActiveByName(input.contentType);

    if (!schema) {
      throw new ContentTypeSchemaNotFoundError(input.contentType, input.schemaVersion);
    }

    return validateContentInstanceData(schema, input.data);
  }
}
