import { All, Body, Controller, Req, Res } from "@nestjs/common";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

const CONTENT_SERVICE_URL = process.env["CONTENT_SERVICE_URL"] ?? "http://localhost:3002";

@Controller("api/cmis")
export class CmisProxyController {
  @All(["", "*path"])
  async forward(
    @Req() request: IncomingMessage,
    @Res() response: ServerResponse,
    @Body() body: unknown
  ): Promise<void> {
    const requestUrl = request.url ?? "";

    try {
      const multipart = isMultipartRequest(request);
      const form = isFormRequest(request);
      const forwardedResponse = await fetch(`${CONTENT_SERVICE_URL}${requestUrl}`, {
        method: request.method,
        headers: toForwardHeaders(request.headers, !multipart && !form),
        body: resolveForwardBody(request, body, multipart, form),
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
        message: "CMIS service is unavailable."
      });
    }
  }
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

function isFormRequest(request: IncomingMessage): boolean {
  const contentType = request.headers["content-type"];

  return typeof contentType === "string" && contentType.includes("application/x-www-form-urlencoded");
}

function resolveForwardBody(
  request: IncomingMessage,
  body: unknown,
  multipart: boolean,
  form: boolean
): BodyInit | undefined {
  if (!shouldForwardBody(request.method)) {
    return undefined;
  }

  if (multipart) {
    return request as unknown as BodyInit;
  }

  if (form) {
    return new URLSearchParams(isPlainObject(body) ? toStringRecord(body) : {});
  }

  return JSON.stringify(body ?? {});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function toStringRecord(record: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record)
      .filter((entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === "string" || typeof entry[1] === "number" || typeof entry[1] === "boolean"
      )
      .map(([key, value]) => [key, String(value)])
  );
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
