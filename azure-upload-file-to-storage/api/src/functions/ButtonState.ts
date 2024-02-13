import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext
} from '@azure/functions';

export async function ButtonState(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  console.log('Hello!');
  context.log(`Http function processed request for url "${request.url}"`);

  const aggregatedCheckedValue =
    request.query.get('aggregatedChecked') || 'false';

  context.log(`Aggregated Checked Value: ${aggregatedCheckedValue}`);
  // Log the value to the console
  console.log(`Aggregated Checked Value: ${aggregatedCheckedValue}`);

  // Return the value in the HTTP response
  return { body: aggregatedCheckedValue };
}

//configures the azure functions to handle HTTP request under route ButtonState
app.http('ButtonState', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: ButtonState
});
