import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { FolderId, StaticFile, StaticFileId, StaticFileUpdateInput } from "@ecmp/shared-types";
import { firstValueFrom } from "rxjs";

import { toApiClientError } from "../../../shared/infrastructure/api-client-error";

@Injectable({ providedIn: "root" })
export class StaticFileApiClient {
  constructor(private readonly http: HttpClient) {}

  async listFiles(folderId: FolderId): Promise<StaticFile[]> {
    try {
      const encodedFolderId = encodeURIComponent(folderId);

      return await firstValueFrom(
        this.http.get<StaticFile[]>(`/api/management/files?folderId=${encodedFolderId}`)
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async uploadFile(folderId: FolderId, file: File): Promise<StaticFile> {
    const formData = new FormData();
    formData.append("folderId", folderId);
    formData.append("file", file);

    try {
      return await firstValueFrom(this.http.post<StaticFile>("/api/management/files", formData));
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async renameFile(fileId: StaticFileId, input: StaticFileUpdateInput): Promise<StaticFile> {
    try {
      return await firstValueFrom(
        this.http.patch<StaticFile>(`/api/management/files/${encodeURIComponent(fileId)}`, input)
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async deleteFile(fileId: StaticFileId): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`/api/management/files/${encodeURIComponent(fileId)}`)
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }
}
