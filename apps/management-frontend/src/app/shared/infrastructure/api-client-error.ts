import { HttpErrorResponse } from "@angular/common/http";

export interface ApiClientError {
  status: number;
  message: string;
  validationMessages: string[];
}

interface ErrorBody {
  message?: unknown;
  errors?: unknown;
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof HttpErrorResponse) {
    const body = isErrorBody(error.error) ? error.error : {};
    const message = readMessage(body.message) ?? error.message;

    return {
      status: error.status,
      message,
      validationMessages: readValidationMessages(body.errors)
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message,
      validationMessages: []
    };
  }

  return {
    status: 0,
    message: "Request failed.",
    validationMessages: []
  };
}

function isErrorBody(value: unknown): value is ErrorBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMessage(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.join(" ");
  }

  return null;
}

function readValidationMessages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isErrorBody(item)) {
        return null;
      }

      return typeof item.message === "string" ? item.message : null;
    })
    .filter((message): message is string => message !== null);
}
