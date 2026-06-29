import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Folder, FolderId } from "@ecmp/shared-types";
import { firstValueFrom } from "rxjs";

import { toApiClientError } from "../../../shared/infrastructure/api-client-error";

@Injectable({ providedIn: "root" })
export class FolderApiClient {
  constructor(private readonly http: HttpClient) {}

  async listFolders(): Promise<Folder[]> {
    try {
      return await firstValueFrom(this.http.get<Folder[]>("/api/management/folders"));
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async getFolder(folderId: FolderId): Promise<Folder> {
    try {
      return await firstValueFrom(
        this.http.get<Folder>(`/api/management/folders/${encodeURIComponent(folderId)}`)
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }
}
