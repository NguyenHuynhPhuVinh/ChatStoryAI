"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses: any;
}

interface ApiSpec {
  openapi: string;
  info: any;
  servers: any[];
  paths: Record<string, Record<string, ApiEndpoint>>;
  components: any;
}

export default function DocsPage() {
  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch("/api/docs");
        if (!response.ok) {
          throw new Error("Không thể tải API specification");
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Lỗi</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!spec) return null;

  // Lấy tất cả endpoints
  const endpoints: (ApiEndpoint & { path: string; method: string })[] = [];
  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, endpoint]) => {
      endpoints.push({ ...endpoint, path, method: method.toUpperCase() });
    });
  });

  // Lấy tất cả tags
  const allTags = Array.from(new Set(endpoints.flatMap((e) => e.tags || [])));

  // Filter endpoints theo tag
  const filteredEndpoints =
    selectedTag === "all"
      ? endpoints
      : endpoints.filter((e) => e.tags?.includes(selectedTag));

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500 text-white";
      case "POST":
        return "bg-blue-500 text-white";
      case "PUT":
        return "bg-yellow-500 text-white";
      case "DELETE":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {spec.info.title}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                {spec.info.description}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                Version: {spec.info.version} | OpenAPI: {spec.openapi}
              </div>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => window.open("/", "_self")}
              >
                ← Về trang chủ
              </Button>
              <Button onClick={() => window.open("/api/docs", "_blank")}>
                Tải JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tags */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Lọc theo nhóm API</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === "all" ? "default" : "outline"}
              onClick={() => setSelectedTag("all")}
              size="sm"
            >
              Tất cả ({endpoints.length})
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                onClick={() => setSelectedTag(tag)}
                size="sm"
              >
                {tag} ({endpoints.filter((e) => e.tags?.includes(tag)).length})
              </Button>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-6">
          {filteredEndpoints.map((endpoint, index) => (
            <div
              key={`${endpoint.path}-${endpoint.method}-${index}`}
              className="bg-white rounded-lg shadow-sm border"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span
                    className={`px-3 py-1 rounded-md text-sm font-medium ${getMethodColor(
                      endpoint.method
                    )}`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                    {endpoint.path}
                  </code>
                  {endpoint.tags && (
                    <div className="flex gap-2">
                      {endpoint.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2">
                  {endpoint.summary}
                </h3>
                <p className="text-gray-600 mb-4">{endpoint.description}</p>

                {/* Parameters */}
                {endpoint.parameters && endpoint.parameters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Parameters:</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Type</th>
                            <th className="px-4 py-2 text-left">Required</th>
                            <th className="px-4 py-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.parameters.map((param: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="px-4 py-2 font-mono">
                                {param.name}
                              </td>
                              <td className="px-4 py-2">
                                {param.schema?.type || param.type}
                              </td>
                              <td className="px-4 py-2">
                                {param.required ? "Yes" : "No"}
                              </td>
                              <td className="px-4 py-2">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {endpoint.requestBody && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Request Body:</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(endpoint.requestBody, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Responses */}
                <div>
                  <h4 className="font-semibold mb-2">Responses:</h4>
                  <div className="space-y-2">
                    {Object.entries(endpoint.responses).map(
                      ([status, response]: [string, any]) => (
                        <div key={status} className="border rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-sm font-medium ${
                                status.startsWith("2")
                                  ? "bg-green-100 text-green-800"
                                  : status.startsWith("4")
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {status}
                            </span>
                            <span className="text-gray-600">
                              {response.description}
                            </span>
                          </div>
                          {response.content && (
                            <div className="text-sm text-gray-500">
                              Content-Type:{" "}
                              {Object.keys(response.content).join(", ")}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEndpoints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              Không có API endpoints nào cho nhóm này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
