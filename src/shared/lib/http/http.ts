import { env } from '@/shared/lib/env';
import { getAuthTokenSync } from '@/shared/lib/auth/get-auth-token';

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined;
};

const ENTITY_ERROR_STATUS = 422;

type EntityErrorPayload = {
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

export class HttpError extends Error {
  status: number;
  payload: {
    message: string;
    [key: string]: any;
  };
  constructor({ status, payload }: { status: number; payload: any }) {
    super('Http Error');
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: 422;
  payload: EntityErrorPayload;
  constructor({ status, payload }: { status: 422; payload: EntityErrorPayload }) {
    super({ status, payload });
    this.status = status;
    this.payload = payload;
  }
}

export const isClient = () => typeof window !== 'undefined';
const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }
  const baseHeaders: {
    [key: string]: string;
  } =
    body instanceof FormData
      ? {}
      : {
          'Content-Type': 'application/json',
        };
  if (isClient()) {
    // Get token from NextAuth cache (synchronous, <1ms access)
    //
    // STALENESS RISK: This uses a synchronous in-memory cache that could become
    // stale if the session updates asynchronously (e.g., token refresh, session extension).
    // The cache is updated via AuthTokenProvider's useEffect when the session changes.
    //
    // In most cases, this is safe because:
    // - Session updates trigger useEffect, which updates the cache
    // - Token refresh is handled by NextAuth and triggers session updates
    //
    // If you encounter auth failures due to stale tokens, consider:
    // 1. Using async getAuthToken() as a fallback (slower but always fresh)
    // 2. Implementing a token refresh retry mechanism
    const token = getAuthTokenSync();
    if (token) {
      baseHeaders.Authorization = `Bearer ${token}`;
    }
  }
  // Nếu không truyền baseUrl (hoặc baseUrl = undefined) thì lấy từ envClientConfig.NEXT_PUBLIC_API_ENDPOINT
  // Nếu truyền baseUrl thì lấy giá trị truyền vào, truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Next.js Server

  const baseUrl = options?.baseUrl === undefined ? env.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl;

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      ...options?.headers,
    } as any,
    body,
    method,
  });

  let payload: any = {};
  const contentType = res.headers.get('content-type');
  if (res.status !== 204 && contentType && contentType.includes('application/json')) {
    payload = await res.json();
  }

  const data = {
    status: res.status,
    payload: payload as Response,
  };
  // Interceptor for error
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      throw new EntityError(
        data as {
          status: 422;
          payload: EntityErrorPayload;
        }
      );
    } else {
      throw new HttpError(data);
    }
  }
  // Make sure logic only run on client (handle path redirect, toast, etc)
  if (isClient()) {
  }
  return data;
};

const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('GET', url, options);
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('POST', url, { ...options, body });
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PUT', url, { ...options, body });
  },
  delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('DELETE', url, { ...options });
  },
  patch<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PATCH', url, { ...options, body });
  },
};

export default http;