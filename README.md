# n8n-nodes-spike

Official Spike community node for n8n.

`n8n-nodes-spike` lets you create Spike forms, submit data to public Spike forms, and trigger n8n workflows whenever a new submission is received.

## Features

- Trigger: `New Submission`
- Action: `Create Form`
- Action: `Submit Form`
- Live dropdowns for organizations and forms
- API key authentication

## Installation

In n8n:

1. Open `Settings`
2. Open `Community Nodes`
3. Click `Install`
4. Enter `n8n-nodes-spike`
5. Restart n8n if your deployment requires it

You can also install manually:

```bash
npm install n8n-nodes-spike
```

## Credentials

Create `Spike API` credentials in n8n with:

- `API Key`: your Spike API key
- `Base URL`: usually `https://api.spike.ac`

## Nodes

### Spike Trigger

Starts a workflow when Spike receives a new submission for a selected form.

How it works:

- n8n registers a webhook subscription with Spike
- Spike stores the subscription in `automation_webhooks`
- Each new submission is delivered to your n8n webhook URL

### Spike

Available operations:

- `Create Form`
- `Submit Form`

`Create Form` uses your authenticated Spike API account.

`Submit Form` sends raw JSON to a public Spike form endpoint using:

- organization slug
- form slug

## Requirements

- A Spike account
- A Spike API key
- A reachable Spike API deployment for webhook subscriptions if you use `Spike Trigger`

## Webhook Trigger Requirements

For `Spike Trigger` to work, your Spike backend must expose:

- `POST /integrations/n8n/hooks`
- `DELETE /integrations/n8n/hooks`

and must dispatch submission events from Spike to stored automation webhooks.

## Package

- npm: `https://www.npmjs.com/package/n8n-nodes-spike`

## Development

```bash
pnpm install
pnpm --filter n8n-nodes-spike build
pnpm --filter n8n-nodes-spike typecheck
```
