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
  const lifetimeChecked = request.query.get('lifetimeChecked');
  const yearlyChecked = request.query.get('yearlyChecked');
  const monthlyChecked = request.query.get('monthlyChecked');
  const dailyChecked = request.query.get('dailyChecked');
  const PDFChecked = request.query.get('PDFChecked');
  const ExcelChecked = request.query.get('ExcelChecked');

  const aggregatedCheckedValue = aggregatedChecked === 'true' ? '1' : '0';
  const lifetimeCheckedValue = lifetimeChecked === 'true' ? '1' : '0';
  const yearlyCheckedValue = yearlyChecked === 'true' ? '1' : '0';
  const monthlyCheckedValue = monthlyChecked === 'true' ? '1' : '0';
  const dailyCheckedValue = dailyChecked === 'true' ? '1' : '0';
  const PDFCheckedValue = PDFChecked === 'true' ? '1' : '0';
  const ExcelCheckedValue = ExcelChecked === 'true' ? '1' : '0';

  // Concatenate the values to form the final string
  const resultBinaryString = `${aggregatedCheckedValue}${lifetimeCheckedValue}${yearlyCheckedValue}${monthlyCheckedValue}${dailyCheckedValue}${PDFCheckedValue}${ExcelCheckedValue}`;

  return { body: `${resultBinaryString}` };
}

app.http('ButtonState', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: ButtonState
});
