import fetch from 'node-fetch';

export const baseUrl = process.env.BASE_URL || 'http://www.rodong.rep.kp';

export async function fetchText(path) {
  const response = await fetch(`${baseUrl}/${path}`);
  if (response.ok) {
    const bodyText = await response.text();
    return {
      text: bodyText,
      'content-type': response.headers.get('content-type'),
    };
  }
  throw new Error(`Unable to fetch ${response.status}`);
}
