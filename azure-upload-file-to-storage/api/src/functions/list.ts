import {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
  app
} from '@azure/functions';
import { listFilesInContainer } from '../lib/azure-storage.js';
import { exec } from 'child_process';

export async function getFilesInContainer(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const pythonScriptPath = '/src/TestScript.py';
  const command = `python ${pythonScriptPath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing Python script: ${error.message}`);
      return;
    }

    console.log('Python script output:', stdout);
  });
  try {
    if (
      !process.env?.Azure_Storage_AccountName ||
      !process.env?.Azure_Storage_AccountKey
    ) {
      return {
        status: 405,
        jsonBody: 'Missing required app configuration'
      };
    }

    const containerName = request.query.get('container');
    context.log(`containerName: ${containerName}`);

    if (!containerName) {
      return {
        status: 405,
        jsonBody: 'Missing required container name'
      };
    }

    const { error, errorMessage, data } = await listFilesInContainer(
      process.env?.Azure_Storage_AccountName as string,
      process.env?.Azure_Storage_AccountKey as string,
      containerName
    );
    context.log(errorMessage);
    context.log(JSON.stringify(data));
    if (!error) {
      return {
        jsonBody: { list: data }
      };
    } else {
      return {
        status: 500,
        jsonBody: errorMessage
      };
    }
  } catch (error) {
    return {
      status: 500,
      jsonBody: error
    };
  }
}

app.http('list', {
  methods: ['POST', 'GET'],
  authLevel: 'anonymous',
  handler: getFilesInContainer
});
