import type {
  ContentId,
  ContentInstanceData,
  ContentStatus,
  ContentTypeName,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";

export interface ContentRecordEntity {
  contentId: ContentId;
  folderId: FolderId;
  contentType: ContentTypeName;
  schemaVersion: ContentTypeVersion;
  version: number;
  status: ContentStatus;
  data: ContentInstanceData;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentRecordInput {
  contentId: ContentId;
  folderId: FolderId;
  contentType: ContentTypeName;
  schemaVersion: ContentTypeVersion;
  data: ContentInstanceData;
  now?: Date;
}

export interface ReplaceContentRecordInput {
  contentType?: ContentTypeName;
  folderId: FolderId;
  schemaVersion: ContentTypeVersion;
  data: ContentInstanceData;
  now?: Date;
}

export interface PatchContentRecordInput {
  contentType?: ContentTypeName;
  folderId?: FolderId;
  schemaVersion?: ContentTypeVersion;
  data?: ContentInstanceData;
  now?: Date;
}

export class ImmutableContentTypeError extends Error {
  constructor(existingContentType: ContentTypeName, requestedContentType: ContentTypeName) {
    super(
      `Content type cannot be changed from '${existingContentType}' to '${requestedContentType}'.`
    );
    this.name = "ImmutableContentTypeError";
  }
}

export function createContentRecord(input: CreateContentRecordInput): ContentRecordEntity {
  const now = input.now ?? new Date();

  return {
    contentId: input.contentId,
    folderId: input.folderId,
    contentType: input.contentType,
    schemaVersion: input.schemaVersion,
    version: 1,
    status: "draft",
    data: cloneContentData(input.data),
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function replaceContentRecord(
  content: ContentRecordEntity,
  input: ReplaceContentRecordInput
): ContentRecordEntity {
  assertContentTypeUnchanged(content.contentType, input.contentType);
  const now = input.now ?? new Date();

  return {
    ...cloneContentRecord(content),
    folderId: input.folderId,
    schemaVersion: input.schemaVersion,
    version: content.version + 1,
    data: cloneContentData(input.data),
    updatedAt: new Date(now)
  };
}

export function patchContentRecord(
  content: ContentRecordEntity,
  input: PatchContentRecordInput
): ContentRecordEntity {
  assertContentTypeUnchanged(content.contentType, input.contentType);
  const now = input.now ?? new Date();
  const existing = cloneContentRecord(content);

  return {
    ...existing,
    folderId: input.folderId ?? existing.folderId,
    schemaVersion: input.schemaVersion ?? existing.schemaVersion,
    version: content.version + 1,
    data: input.data ? { ...existing.data, ...cloneContentData(input.data) } : existing.data,
    updatedAt: new Date(now)
  };
}

export function cloneContentRecord(content: ContentRecordEntity): ContentRecordEntity {
  return {
    ...content,
    data: cloneContentData(content.data),
    createdAt: new Date(content.createdAt),
    updatedAt: new Date(content.updatedAt)
  };
}

export function cloneContentData(data: ContentInstanceData): ContentInstanceData {
  return structuredClone(data) as ContentInstanceData;
}

function assertContentTypeUnchanged(
  existingContentType: ContentTypeName,
  requestedContentType?: ContentTypeName
): void {
  if (requestedContentType && requestedContentType !== existingContentType) {
    throw new ImmutableContentTypeError(existingContentType, requestedContentType);
  }
}
