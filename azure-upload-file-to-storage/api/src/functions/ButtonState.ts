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
  context.log(`Http function processed request for url "${request.url}"`);

  // Get the aggregatedChecked parameter from the query string
  const aggregatedChecked = request.query.get('aggregatedChecked');
  const yearlyChecked = request.query.get('yearlyChecked');
  const monthlyChecked = request.query.get('monthlyChecked');
  const dailyChecked = request.query.get('dailyChecked');
  const PDFChecked = request.query.get('PDFChecked');
  const ExcelChecked = request.query.get('ExcelChecked');

  const checkboxNames = [
    aggregatedChecked,
    yearlyChecked,
    monthlyChecked,
    dailyChecked,
    PDFChecked,
    ExcelChecked
  ];

  // Use Array.map to convert each checkbox value to '1' if true, '0' if false
  const resultBinaryString = checkboxNames
    .map((checkboxName) =>
      request.query.get(checkboxName) === 'true' ? '1' : '0'
    )
    .join('');

  return { body: `${resultBinaryString} en ${aggregatedChecked}` };
}

app.http('ButtonState', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: ButtonState
});
