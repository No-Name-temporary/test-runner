const TestConfiguration = require('./entities/TestConfiguration');
const TestRunner = require('./entities/TestRunner');
const sendMsgToSQS = require('./entities/SQSClient');
const getTimestamp = require('./entities/timestamp');

exports.handler = async (event) => {
  const body = JSON.parse(event.Records[0].body);
  const currRegion = event.Records[0].awsRegion;
  const { test } = JSON.parse(body.Message);
  console.log(`...starting test runner in ${currRegion}...`);
  console.log('SHAPE OF EVENT --> ', event);
  console.log('SHAPE OF TEST ---> ', test);

  const testConfiguration = new TestConfiguration(test);
  const testRunner = new TestRunner(testConfiguration);

  const {
    status, data, headers, results,
  } = await testRunner.run();

  console.log('SHAPE OF RESULTS ------>', results);

  const response = {
    title: test.title,
    testId: test.id,
    sender: currRegion,
    timestamp: getTimestamp(),
    responseStatus: status,
    responseBody: data,
    responseHeaders: headers,
    results,
  };

  sendMsgToSQS(response);
};
