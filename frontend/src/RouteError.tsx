import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export default function RouteError() {
  const err = useRouteError();
  if (isRouteErrorResponse(err)) {
    return (
      <div style={{ padding: 24 }}>
        <h1>{err.status} {err.statusText}</h1>
        <pre>{JSON.stringify(err.data, null, 2)}</pre>
      </div>
    );
  }
  return (
    <div style={{ padding: 24 }}>
      <h1>Route Error</h1>
      <pre>{String((err as any)?.stack || err)}</pre>
    </div>
  );
}
