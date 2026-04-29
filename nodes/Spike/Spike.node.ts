import type {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { spikeApiRequest } from './GenericFunctions';

export class Spike implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Spike',
    name: 'spike',
    icon: 'file:spike.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["resource"]}}',
    description: 'Create Spike forms or submit data to a Spike form',
    defaults: {
      name: 'Spike',
    },
    inputs: ['main' as const],
    outputs: ['main' as const],
    usableAsTool: true,
    credentials: [
      {
        name: 'spikeApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        default: 'form',
        options: [
          { name: 'Create Form', value: 'form' },
          { name: 'Submit Form', value: 'submission' },
        ],
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        displayOptions: { show: { resource: ['form'] } },
        default: '',
        required: true,
        description: 'Name of the form to create',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        displayOptions: { show: { resource: ['form'] } },
        default: '',
        description: 'Optional description for the form',
      },
      {
        displayName: 'Organization Name or ID',
        name: 'orgId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getOrganizations' },
        displayOptions: { show: { resource: ['form'] } },
        default: '',
        required: true,
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
      },
      {
        displayName: 'Form Name or ID',
        name: 'submitTarget',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getSubmissionForms' },
        displayOptions: { show: { resource: ['submission'] } },
        default: '',
        required: true,
        description:
          'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
      },
      {
        displayName: 'Fields JSON',
        name: 'fieldsJson',
        type: 'json',
        displayOptions: { show: { resource: ['submission'] } },
        default: '{"email":"jane@example.com"}',
        required: true,
        description: 'Field payload to send to the public Spike form endpoint',
      },
    ],
  };

  methods = {
    loadOptions: {
      async getOrganizations(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const response = (await spikeApiRequest.call(
          this,
          'GET',
          '/integrations/automations/orgs',
        )) as { orgs?: IDataObject[] };

        return (response.orgs || []).map((org: IDataObject) => ({
          name: `${String(org.name)} (${String(org.short_code)})`,
          value: String(org.id),
        }));
      },

      async getSubmissionForms(
        this: ILoadOptionsFunctions,
      ): Promise<INodePropertyOptions[]> {
        const response = (await spikeApiRequest.call(
          this,
          'GET',
          '/integrations/automations/forms',
        )) as { forms?: IDataObject[] };

        return (response.forms || [])
          .filter(
            (form: IDataObject) =>
              Boolean(form.submit_path) && Boolean(form.is_active),
          )
          .map((form: IDataObject) => ({
            name: `${String(form.name)} (${String(form.submit_path)})`,
            value: `${String(form.org_short_code)}::${String(form.slug)}`,
          }));
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Lazy import to avoid top-level require('n8n-workflow') which breaks
    // vm.Script class loading in some n8n Docker environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NodeOperationError } = require('n8n-workflow') as typeof import('n8n-workflow');

    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const resource = this.getNodeParameter('resource', itemIndex) as string;
      let responseData: IDataObject;

      if (resource === 'form') {
        responseData = (await spikeApiRequest.call(this, 'POST', '/forms', {
          name: this.getNodeParameter('name', itemIndex) as string,
          description:
            (this.getNodeParameter('description', itemIndex, '') as string) ||
            undefined,
          org_id: this.getNodeParameter('orgId', itemIndex) as string,
        })) as IDataObject;
      } else if (resource === 'submission') {
        const fieldsJson = this.getNodeParameter(
          'fieldsJson',
          itemIndex,
        ) as string | IDataObject;

        let fields: IDataObject;
        if (typeof fieldsJson === 'string') {
          try {
            fields = JSON.parse(fieldsJson) as IDataObject;
          } catch {
            throw new NodeOperationError(
              this.getNode(),
              'Fields JSON must be valid JSON.',
              { itemIndex },
            );
          }
        } else {
          fields = fieldsJson;
        }

        const submitTarget = this.getNodeParameter(
          'submitTarget',
          itemIndex,
        ) as string;
        const [orgCode, formSlug] = submitTarget.split('::');
        if (!orgCode || !formSlug) {
          throw new NodeOperationError(
            this.getNode(),
            'Selected form target is invalid.',
            { itemIndex },
          );
        }

        responseData = (await spikeApiRequest.call(
          this,
          'POST',
          `/f/${orgCode}/${formSlug}`,
          fields,
        )) as IDataObject;
      } else {
        throw new NodeOperationError(
          this.getNode(),
          `Unsupported resource: ${resource}`,
          { itemIndex },
        );
      }

      returnData.push({ json: responseData });
    }

    return [returnData];
  }
}
