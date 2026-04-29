import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
} from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.spike.ac';

function cleanBaseUrl(baseUrl?: string): string {
  return (baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
}

export async function spikeApiRequest(
  this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: object = {},
) {
  const credentials = await this.getCredentials('spikeApi');
  const baseUrl = cleanBaseUrl(credentials.baseUrl as string | undefined);

  const options: IHttpRequestOptions = {
    method,
    url: `${baseUrl}${endpoint}`,
    json: true,
  };

  if (method !== 'GET' && Object.keys(body).length > 0) {
    options.body = body;
  }

  return this.helpers.httpRequestWithAuthentication.call(
    this,
    'spikeApi',
    options,
  );
}
