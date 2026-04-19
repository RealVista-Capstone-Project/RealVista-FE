import { env } from '@/shared/lib/env';
import { getAuthToken, getAuthTokenSync, updateAuthTokenCache } from '@/shared/lib/auth/get-auth-token';

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
    error_code?: string;   // snake_case — Jackson SNAKE_CASE naming strategy is active globally
    status?: number;
    path?: string;
    timestamp?: string;
    errors?: { field: string; message: string }[];
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
  // Read the next-intl locale cookie to forward Accept-Language to the backend
  function getAcceptLanguage(): string {
    if (typeof window === 'undefined') return 'vi'; // SSR fallback
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
    return match ? match[1] : 'vi';
  }

  const baseHeaders: {
    [key: string]: string;
  } =
    body instanceof FormData
      ? { 'Accept-Language': getAcceptLanguage() }
      : {
          'Content-Type': 'application/json',
          'Accept-Language': getAcceptLanguage(),
        };
  if (isClient()) {
    // Fast path: synchronous cache read (<1ms)
    // Cold path: cache empty on first render before AuthTokenProvider's useEffect runs —
    // fall back to async getSession() to avoid a 401 on initial page load.
    let token = getAuthTokenSync();
    console.debug(`[http] ${method} ${url} | sync token:`, token ? 'present' : 'null');
    if (!token) {
      console.debug(`[http] ${method} ${url} | falling back to async getSession()...`);
      token = await getAuthToken();
      console.debug(`[http] ${method} ${url} | async token:`, token ? 'present' : 'null');
      if (token) updateAuthTokenCache(token); // warm the cache for subsequent calls
    }
    if (token) {
      baseHeaders.Authorization = `Bearer ${token}`;
    }
  }
  // Nếu không truyền baseUrl (hoặc baseUrl = undefined) thì lấy từ envClientConfig.NEXT_PUBLIC_API_ENDPOINT
  // Nếu truyền baseUrl thì lấy giá trị truyền vào, truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Next.js Server

  const baseUrl = options?.baseUrl === undefined ? env.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl;

  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  console.debug(`[http] ${method} fullUrl:`, fullUrl);

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