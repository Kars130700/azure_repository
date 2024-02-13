import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext
} from '@azure/functions';

let aggregatedChecked = false;

export async function ButtonState(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  // Get the name parameter from the query string
  const name = request.query.get('name') || 'world';

  // Get the aggregatedChecked parameter from the query string
  const aggregatedCheckedParam = request.query.get('aggregatedChecked');
  if (aggregatedCheckedParam) {
    aggregatedChecked = aggregatedCheckedParam.toLowerCase() === 'true';
  }

  return { body: `Hello, ${name}! AggregatedChecked: ${aggregatedChecked}` };
}

app.http('ButtonState', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: ButtonState
});
