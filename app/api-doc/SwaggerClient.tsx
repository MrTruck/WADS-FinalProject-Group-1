"use client";

import dynamic from "next/dynamic";
import React from "react";

const ReactSwagger = dynamic(() => import("./react-swagger"), {
  ssr: false,
  loading: () => <p>Loading API documentation...</p>,
});

export default function SwaggerClient({ spec }: { spec: Record<string, unknown> }) {
  return <ReactSwagger spec={spec} />;
}