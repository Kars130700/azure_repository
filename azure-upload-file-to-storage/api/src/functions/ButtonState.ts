import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext
} from '@azure/functions';
import * as http from 'http';

export async function ButtonState(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (request.method == 'POST') {
    const aggregatedCheckedValue =
      request.query.get('aggregatedChecked') || 'false';
    const postUrl =
      'https://thankful-sky-09024e01e.4.azurestaticapps.net/api/ButtonState';
    // Create the HTTP request options
    const options: http.RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Create a request object
    const httpRequest = http.request(postUrl, options, (response) => {
      // Handle the response from the server
      if (response.statusCode === 200) {
        // Respond with a success message
        context.log('Button state posted successfully');
      } else {
        // Respond with an error message
        context.error;
      }
    });

    // Write the data to the request body
    httpRequest.write(JSON.stringify({ aggregatedCheckedValue }));

    // End the request
    httpRequest.end();
    return { body: aggregatedCheckedValue };
  }
}

//configures the azure functions to handle HTTP request under route ButtonState
app.http('ButtonState', {
  methods: ['POST', 'GET'],
  authLevel: 'anonymous',
  handler: ButtonState
});
