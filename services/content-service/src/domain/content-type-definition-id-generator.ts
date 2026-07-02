import type { ContentTypeDefinitionId } from "@ecmp/shared-types";

export interface ContentTypeDefinitionIdGenerator {
  next(): ContentTypeDefinitionId;
}
