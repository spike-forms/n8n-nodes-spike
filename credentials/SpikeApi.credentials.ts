import type {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SpikeApi implements ICredentialType {
  name = 'spikeApi';

  displayName = 'Spike API';

  icon: Icon = 'file:../nodes/Spike/spike.svg';

  documentationUrl = 'https://github.com/spike-forms/n8n-nodes-spike';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Spike API key starting with sk_',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.spike.ac',
      description:
        'Spike API base URL. Change this for self-hosted or staging environments.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/integrations/automations/orgs',
      method: 'GET',
    },
  };
}
