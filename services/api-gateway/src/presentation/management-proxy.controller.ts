import { All, Body, Controller, Req, Res } from "@nestjs/common";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

const CONTENT_SERVICE_URL = process.env["CONTENT_SERVICE_URL"] ?? "http://localhost:3002";
const CONTENT_TYPE_SERVICE_URL =
  process.env["CONTENT_TYPE_SERVICE_URL"] ?? "http://localhost:3003";

@Controller("api/management")
export class ManagementProxyController {
  @All([
    "folders",
    "folders/*path",
    "contents",
    "contents/*path",
    "files",
    "files/*path",
    "content-types",
    "content-types/*path"
  ])
  async forward(
    @Req() request: IncomingMessage,
    @Res() response: ServerResponse,
    @Body() body: unknown
  ): Promise<void> {
    const requestUrl = request.url ?? "";
    const targetBaseUrl = resolveTargetBaseUrl(requestUrl);

    if (!targetBaseUrl) {
      writeJson(response, 404, { message: "Management route was not found." });
      return;
    }

    try {
      const multipart = isMultipartRequest(request);
      const forwardedResponse = await fetch(`${targetBaseUrl}${requestUrl}`, {
        method: request.method,
        headers: toForwardHeaders(request.headers, !multipart),
        body: resolveForwardBody(request, body, multipart),
        ...(multipart ? { duplex: "half" as const } : {})
      } as RequestInit & { duplex?: "half" });
      const responseBody = await forwardedResponse.text();
      const contentType = forwardedResponse.headers.get("content-type");

      response.statusCode = forwardedResponse.status;

      if (contentType) {
        response.setHeader("content-type", contentType);
      }

      response.end(responseBody);
    } catch {
      writeJson(response, 502, {
        message: "Management service is unavailable."
      });
    }
  }
}

function resolveTargetBaseUrl(requestUrl: string): string | null {
  if (requestUrl.startsWith("/api/management/content-types")) {
    return CONTENT_TYPE_SERVICE_URL;
  }

  if (
    requestUrl.startsWith("/api/management/folders") ||
    requestUrl.startsWith("/api/management/contents") ||
    requestUrl.startsWith("/api/management/files")
  ) {
    return CONTENT_SERVICE_URL;
  }

  return null;
}

function toForwardHeaders(headers: IncomingHttpHeaders, forceJsonContentType: boolean): Headers {
  const forwardedHeaders = new Headers();

  for (const [name, value] of Object.entries(headers)) {
    if (name === "host" || name === "content-length" || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      forwardedHeaders.set(name, value.join(", "));
      continue;
    }

    forwardedHeaders.set(name, value);
  }

  if (forceJsonContentType) {
    forwardedHeaders.set("content-type", "application/json");
  }

  return forwardedHeaders;
}

function shouldForwardBody(method: string | undefined): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function isMultipartRequest(request: IncomingMessage): boolean {
  const contentType = request.headers["content-type"];

  return typeof contentType === "string" && contentType.includes("multipart/form-data");
}

function resolveForwardBody(
  request: IncomingMessage,
  body: unknown,
  multipart: boolean
): BodyInit | undefined {
  if (!shouldForwardBody(request.method)) {
    return undefined;
  }

  return multipart ? (request as unknown as BodyInit) : JSON.stringify(body ?? {});
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>
): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}
