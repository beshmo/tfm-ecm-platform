import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type {
  ContentCreateInput,
  ContentId,
  ContentRecord,
  ContentReplaceInput,
  FolderId
} from "@ecmp/shared-types";
import { firstValueFrom } from "rxjs";

import { toApiClientError } from "../../../shared/infrastructure/api-client-error";

@Injectable({ providedIn: "root" })
export class ContentApiClient {
  constructor(private readonly http: HttpClient) {}

  async listContents(folderId: FolderId): Promise<ContentRecord[]> {
    try {
      const encodedFolderId = encodeURIComponent(folderId);

      return await firstValueFrom(
        this.http.get<ContentRecord[]>(`/api/management/contents?folderId=${encodedFolderId}`)
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async createContent(input: ContentCreateInput): Promise<ContentRecord> {
    try {
      return await firstValueFrom(this.http.post<ContentRecord>("/api/management/contents", input));
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async replaceContent(contentId: ContentId, input: ContentReplaceInput): Promise<ContentRecord> {
    try {
      return await firstValueFrom(
        this.http.put<ContentRecord>(
          `/api/management/contents/${encodeURIComponent(contentId)}`,
          input
        )
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async deleteContent(contentId: ContentId): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`/api/management/contents/${encodeURIComponent(contentId)}`)
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }
}
