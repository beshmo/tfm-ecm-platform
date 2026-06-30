import type { StaticFileId } from "@ecmp/shared-types";

export interface StaticFileIdGenerator {
  next(): StaticFileId;
}
