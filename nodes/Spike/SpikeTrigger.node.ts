import type {
  IDataObject,
  IHookFunctions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  IWebhookFunctions,
  IWebhookResponseData,
} from 'n8n-workflow';
import { spikeApiRequest } from './GenericFunctions';

export class SpikeTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Spike Trigger',
    name: 'spikeTrigger',
    icon: 'file:spike.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["formId"]}}',
    description: 'Triggers when a new submission is received in Spike',
    defaults: {
      name: 'Spike Trigger',
    },
    inputs: [],
    outputs: ['main' as const],
    usableAsTool: true,
    credentials: [
      {
        name: 'spikeApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'submission',
      },
    ],
    properties: [
      {
        displayName: 'Form Name or ID',
        name: 'formId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getForms' },
        default: '',
        required: true,
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
      },
    ],
  };

  methods = {
    loadOptions: {
      async getForms(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const response = (await spikeApiRequest.call(
          this,
          'GET',
          '/integrations/automations/forms',
        )) as { forms?: IDataObject[] };

        return (response.forms || [])
          .filter((form: IDataObject) => Boolean(form.is_active))
          .map((form: IDataObject) => ({
            name: `${String(form.name)} (${String(form.slug)})`,
            value: String(form.id),
          }));
      },
    },
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        return false;
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const targetUrl = this.getNodeWebhookUrl('default');
        if (!targetUrl) return false;

        await spikeApiRequest.call(this, 'POST', '/integrations/n8n/hooks', {
          form_id: this.getNodeParameter('formId') as string,
          target_url: targetUrl,
        });

        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const targetUrl = this.getNodeWebhookUrl('default');
        if (!targetUrl) return false;

        const formId = this.getNodeParameter('formId') as string;

        try {
          await spikeApiRequest.call(
            this,
            'DELETE',
            '/integrations/n8n/hooks',
            {
              form_id: formId,
              target_url: targetUrl,
            },
          );
        } catch (error) {
          this.logger.error('Failed to delete Spike webhook during trigger cleanup', {
            formId,
            targetUrl,
            error,
          });

          return false;
        }

        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const body = this.getBodyData() as IDataObject;

    return {
      workflowData: [[{ json: body }]],
    };
  }
}
