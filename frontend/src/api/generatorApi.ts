import type { GeneratePasswordPayload, GeneratePasswordResponse } from '../types/generator';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const GENERATOR_PATH = import.meta.env.VITE_PASSWORD_GENERATOR_ENDPOINT ?? '/api/generate';

function buildRequestBody(payload: GeneratePasswordPayload) {
  return {
    length: payload.length,
    use_lower: payload.includeLowercase,
    use_upper: payload.includeUppercase,
    use_digits: payload.includeNumbers,
    use_symbols: payload.includeSymbols,
    use_similar_symbols: !payload.excludeSimilar,
  };
}

async function parseFastApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    const { detail } = data;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: string }).msg);
          }
          return String(item);
        })
        .join(', ');
    }
  } catch {
    // ignore
  }
  return res.statusText || `Ошибка ${res.status}`;
}

export async function generatePasswordRequest(
  payload: GeneratePasswordPayload,
): Promise<GeneratePasswordResponse> {
  const url = `${API_URL}${GENERATOR_PATH}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildRequestBody(payload)),
  });

  if (!res.ok) {
    const message = await parseFastApiError(res);
    throw new Error(message);
  }

  return res.json() as Promise<GeneratePasswordResponse>;
}
