import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";
import { firstValueFrom } from "rxjs";

import { toApiClientError } from "../../../shared/infrastructure/api-client-error";

@Injectable({ providedIn: "root" })
export class ContentTypeApiClient {
  constructor(private readonly http: HttpClient) {}

  async listSchemas(): Promise<ContentTypeSchemaSummary[]> {
    try {
      return await firstValueFrom(
        this.http.get<ContentTypeSchemaSummary[]>("/api/management/content-types")
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async getLatestSchema(name: ContentTypeName): Promise<ContentTypeSchemaDefinition> {
    try {
      return await firstValueFrom(
        this.http.get<ContentTypeSchemaDefinition>(
          `/api/management/content-types/${encodeURIComponent(name)}`
        )
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async getSchemaVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition> {
    try {
      return await firstValueFrom(
        this.http.get<ContentTypeSchemaDefinition>(
          `/api/management/content-types/${encodeURIComponent(name)}/versions/${encodeURIComponent(
            version
          )}`
        )
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async createSchema(schemaSource: string): Promise<ContentTypeSchemaDefinition> {
    try {
      return await firstValueFrom(
        this.http.post<ContentTypeSchemaDefinition>("/api/management/content-types", {
          schemaSource
        })
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async replaceSchemaVersion(
    name: ContentTypeName,
    version: ContentTypeVersion,
    schemaSource: string
  ): Promise<ContentTypeSchemaDefinition> {
    try {
      return await firstValueFrom(
        this.http.put<ContentTypeSchemaDefinition>(
          `/api/management/content-types/${encodeURIComponent(name)}/versions/${encodeURIComponent(
            version
          )}`,
          { schemaSource }
        )
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }

  async deactivateSchemaVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(
          `/api/management/content-types/${encodeURIComponent(name)}/versions/${encodeURIComponent(
            version
          )}`
        )
      );
    } catch (error) {
      throw toApiClientError(error);
    }
  }
}
