
"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
  spec: Record<string, unknown>;
};

function getCookie(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(name.length + 1));
}

export default function ReactSwagger({ spec }: Props) {
  return (
    <SwaggerUI
      spec={spec}
      requestInterceptor={(request) => {
        const csrfToken = getCookie("csrf-token");

        request.headers = request.headers ?? {};
        request.credentials = "include";

        if (csrfToken) {
          request.headers["x-csrf-token"] = csrfToken;
        }

        return request;
      }}
    />
  );
}

