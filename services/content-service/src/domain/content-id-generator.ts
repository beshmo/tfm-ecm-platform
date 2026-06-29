import type { ContentId } from "@ecmp/shared-types";

export interface ContentIdGenerator {
  next(): ContentId;
}
