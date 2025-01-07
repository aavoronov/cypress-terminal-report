import {
  PADDING,
  ICONS,
  clean,
  runTest,
  commandBase,
  logLastRun,
  runTestColoredConsole,
} from '../utils';
import chalk from 'chalk';

const {expect} = require('chai');

describe('Commands logging.', () => {
  afterEach(function () {
    if (this.currentTest?.state === 'failed') {
      logLastRun();
    }
  });

  it('Should run happy flow.', async () => {
    await runTest(commandBase([], ['happyFlow.spec.js']), (error, stdout, stderr) => {
      // cy.command logs.
      expect(stdout).to.contain(`cy:command ${ICONS.success}  visit\t/commands/network-requests\n`);
      expect(stdout).to.contain(`cy:command ${ICONS.success}  get\t.network-post\n`);
      expect(clean(stdout)).to.contain(
        `cy:xhr ${ICONS.warning}  (putComment) STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n${PADDING}Status: 404\n`
      );
      // cy.intercept logs.
      expect(stdout).to.contain(`cy:intercept ${ICONS.route}  Method: GET
                    Matcher: "comments/*"`);
      // console
      expect(stdout).to.contain(`cons:warn ${ICONS.warning}  This is a warning message\n`);
      expect(stdout).to.contain(`cons:error ${ICONS.error}  This is an error message\n`);
      expect(stdout).to.contain(
        `cons:error ${ICONS.error}  Error: This is an error message with stack.\n${PADDING}    at Context.eval (`
      );
      expect(stdout).to.contain(`cons:log ${ICONS.info}  This should console.log appear.`);
      expect(stdout).to.contain(
        `cons:log ${ICONS.info}  {\n${PADDING}  "this": "Is an object",\n${PADDING}  "with": {\n${PADDING}    "keys": 12512\n${PADDING}  }\n${PADDING}}\n`
      );
      expect(stdout).to.contain(
        `cons:log ${ICONS.info}  {\n${PADDING}  "a": "b"\n${PADDING}},\n${PADDING}{\n${PADDING}  "c": "d"\n${PADDING}},\n${PADDING}10,\n${PADDING}string\n`
      );
      expect(stdout).to.contain(
        `cons:error ${ICONS.error}  null,\n${PADDING}undefined,\n${PADDING},\n${PADDING}false,\n${PADDING}function () {}\n`
      );
      expect(stdout).to.contain(`cons:info ${ICONS.info}  This should console.info appear.`);
      expect(stdout).to.contain(`cons:debug ${ICONS.debug}  This should console.debug appear.`);
      // log failed command
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get\n`);
    });
  }).timeout(60000);

  it('Should log fetch api routes. [backward-compatibility-skip]', async () => {
    await runTest(commandBase([], ['apiRoutes.spec.js']), (error, stdout, stderr) => {
      // cy.route empty body.
      expect(stdout).to
        .contain(`cy:xhr ${ICONS.route}  (getComment) STUBBED GET https://jsonplaceholder.cypress.io/comments/1
                    Status: 200
      cy:command ${ICONS.success}  wait\t@getComment`);
      // cy.route text.
      expect(stdout).to
        .contain(`cy:xhr ${ICONS.warning}  (putComment) STUBBED PUT https://jsonplaceholder.cypress.io/comments/1
                    Status: 403
                    Response body: This is plain text data.`);
      // cy.route unknown.
      expect(stdout).to
        .contain(`cy:xhr ${ICONS.warning}  (putComment) STUBBED PUT https://jsonplaceholder.cypress.io/comments/1
                    Status: 401
                    Response body: <UNKNOWN>`);
      // cy.route logs.
      expect(stdout).to
        .contain(`cy:xhr ${ICONS.warning}  (putComment) STUBBED PUT https://example.cypress.io/comments/10
                    Status: 404
                    Response body: {
                      "error": "Test message."
                    }`);
      // log failed command
      expect(stdout).to.contain(`cy:command ${ICONS.error}  get\t.breaking-get\n`);
    });
  }).timeout(60000);

  it('Should log cypress intercept command.', async () => {
    await runTest(commandBase([], ['apiRoutesIntercept.spec.js']), (error, stdout, stderr) => {
      expect(stdout).to.contain(`cy:intercept ${ICONS.route}  Method: GET
                    Matcher: "/test"
                    Mocked Response: () => {
                          return 'test';
                        }`);
      expect(stdout).to
        .contain(`cy:intercept ${ICONS.route}  Matcher: {"method":"GET","url":"/comments\\\\/.*/"}
                    Mocked Response: {"statusCode":200,"body":""}`);
      expect(stdout).to
        .contain(`cy:intercept ${ICONS.route}  Matcher: {"method":"PUT","url":"/comments\\\\/.*/","headers":{"Accept":"*/*"}}
                    Mocked Response: {"statusCode":403,"body":"This is plain text data.","headers":{"Custom":"Header"}}`);
    });
  }).timeout(60000);

  it('Should log cypress requests', async () => {
    await runTest(
      commandBase([], [`requests.spec.js`, `requests2.spec.js`]),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(
          `cy:request ${ICONS.success}  https://jsonplaceholder.cypress.io/todos/1\n${PADDING}Status: 200\n${PADDING}Response body: {\n${PADDING}  "userId": 1,\n${PADDING}  "id": 1,\n${PADDING}  "title": "delectus aut autem",\n${PADDING}  "completed": false\n${PADDING}}`
        );
        expect(stdout).to.contain(
          `cy:request ${ICONS.success}  GET https://jsonplaceholder.cypress.io/todos/2\n${PADDING}Status: 200\n${PADDING}Response body: {\n${PADDING}  "userId": 1,\n${PADDING}  "id": 2,\n${PADDING}  "title": "quis ut nam facilis et officia qui",\n${PADDING}  "completed": false\n${PADDING}}`
        );
        expect(stdout).to.contain(
          `cy:request ${ICONS.success}  GET https://jsonplaceholder.cypress.io/todos/3\n${PADDING}Status: 200\n${PADDING}Response body: {\n${PADDING}  "userId": 1,\n${PADDING}  "id": 3,\n${PADDING}  "title": "fugiat veniam minus",\n${PADDING}  "completed": false\n${PADDING}}`
        );
        expect(stdout).to.contain(
          `cy:request ${ICONS.success}  POST https://jsonplaceholder.cypress.io/comments\n${PADDING}Status: 201\n${PADDING}Response body: {\n${PADDING}  "id": 501\n${PADDING}}\n`
        );
        // log failed command
        expect(stdout).to.contain(
          `cy:request ${ICONS.error}  PUT https://jsonplaceholder.cypress.io/comments\n${PADDING}Status: 404 - Not Found\n${PADDING}Response body: {}\n`
        );

        expect(stdout).to.contain(
          `cy:request ${ICONS.error}  GET http://localhost:3015/v3/4b2d23ec-4516-4a94-967e-995596d01a32\n${PADDING}Status: 500 - Internal Server Error\n${PADDING}Response body: Hey ya! Great to see you here. Btw, nothing is configured for this request path. Create a rule and start building a mock API.\n`
        );

        expect(stdout).to.contain(
          `cy:request ${ICONS.error}  POST http://localhost:3015/v3/57a00707-bccf-4653-ac50-ba1c00cad431\n${PADDING}Status: 400 - Bad Request\n${PADDING}Response body: {\n${PADDING}  "status": "Wrong!",\n${PADDING}  "data": {\n${PADDING}    "corpo": "corpo da resposta",\n${PADDING}    "titulo": "titulo da resposta"\n${PADDING}  }\n${PADDING}}\n`
        );
        expect(stdout).to.contain(
          `cy:request ${ICONS.error}  POST http://this.does.not.exist\n${PADDING}Network error: getaddrinfo ENOTFOUND this.does.not.exist\n`
        );
        expect(stdout).to.contain(
          `cy:request ${ICONS.error}  POST http://timeout
                    Timed out!`
        );
        // Expect no parsing errors
        expect(stdout).not.to.contain('Cannot parse cy.request error content!');
        expect(stdout).not.to.contain('Cannot parse cy.request network error message!');
        expect(stdout).not.to.contain('Cannot parse cy.request status code failure message!');
      }
    );
  }).timeout(60000);

  it('Should log request data and response headers. [backward-compatibility-skip]', async () => {
    await runTest(
      commandBase(['printHeaderData=1', 'printRequestData=1'], [`xhrTypes.spec.js`]),
      (error, stdout, stderr) => {
        expect(stdout).to.contain(
          `Status: 403\n${PADDING}Request headers: {\n${PADDING}  "sec-ch-ua": "\\"Not=A?Brand\\";v=\\"99\\"`
        );
        expect(stdout).to.contain(
          `\n${PADDING}  "Keep-Alive": "timeout=5"\n${PADDING}}\n${PADDING}Response body: {\n${PADDING}  "key": "data"\n${PADDING}}\n`
        );
        expect(stdout).to.contain(
          `POST http://localhost:3015/v3/57a00707-bccf-4653-ac50-ba1c00cad431\n${PADDING}Status: 400 - Bad Request\n${PADDING}Request headers: {\n${PADDING}  "token": "test"\n${PADDING}}\n${PADDING}Request body: {\n${PADDING}  "testitem": "ha"\n${PADDING}}\n${PADDING}Response headers: {\n${PADDING}  "x-powered-by": "Express",\n${PADDING}  "access-control-allow-origin": "*",\n`
        );
        expect(stdout).to.contain(
          `${PADDING}Response body: {\n${PADDING}  "status": "Wrong!",\n${PADDING}  "data": {\n${PADDING}    "corpo": "corpo da resposta",\n${PADDING}    "titulo": "titulo da resposta"\n${PADDING}  }\n${PADDING}}\n`
        );
      }
    );
  }).timeout(60000);

  it('Should not log response body when configured so.', async () => {
    await runTest(commandBase(['printBody=0'], [`xhrTypes.spec.js`]), (error, stdout, stderr) => {
      expect(stdout).to.not.contain(`${PADDING}Response body: {`);
    });
  }).timeout(60000);

  it('Should log fetch requests.', async () => {
    await runTest(commandBase([], [`fetchApi.spec.js`]), (error, stdout, stderr) => {
      const cleanStdout = clean(stdout, true);
      // cy.intercept stubbed aliased commands are logged
      expect(stdout).to.contain(
        `(putComment) STUBBED PUT https://example.cypress.io/comments/10\n`
      );
      expect(stdout).to.contain(`cy:fetch ${ICONS.warning}`);
      expect(stdout).to.contain(`Status: 404\n`);
      expect(stdout).to.contain(
        `Response body: {\n${PADDING}  "error": "Test message."\n${PADDING}}\n`
      );

      // timeouts / abort
      expect(cleanStdout).to.contain(
        `(putComment) STUBBED PUT https://example.cypress.io/comments/10 - forceNetworkError called`,
        'network failed request contains failure message'
      );

      // test real fetch requests
      expect(cleanStdout).to.contain(
        `cy:fetch ${ICONS.route}  GET https://jsonplaceholder.cypress.io/comments/1\n${PADDING}  Status: 200\n`,
        'non-intercepted success fetch contains url and status'
      );

      // @TODO: Response body not logged since cypress 13?
      // expect(cleanStdout).to.contain(
      //   `cy:fetch ${ICONS.warning}  GET http://localhost:3015/v3/57a00707-bccf-4653-ac50-ba1c00cad431\n${PADDING}  Status: 400\n${PADDING}  Response body: {\n${PADDING}    "status": "Wrong!",\n${PADDING}    "data": {\n${PADDING}      "corpo": "corpo da resposta",\n${PADDING}      "titulo": "titulo da resposta"\n${PADDING}    }\n${PADDING}  }\n`,
      //   'intercepted non-success fetch contains url, status and a response body'
      // );
    });
  }).timeout(60000);

  it('Should only log XHR response body for non-successful requests not handled by intercept.', async () => {
    await runTest(commandBase([], ['xhrTypes.spec.js']), (error, stdout, stderr) => {
      const cleanStdout = clean(stdout, true);
      expect(cleanStdout).to.contain(
        `cy:xhr ${ICONS.route}  GET https://jsonplaceholder.cypress.io/comments/1\n${PADDING}Status: 200\n      cy:command`,
        'success XHR log should not contain response body'
      );
      expect(cleanStdout).to.contain(
        // @TODO: Test broken. But cypress is not returning the response data here for some reason.
        // `cy:xhr ${ICONS.warning}  GET http://localhost:3015/v3/57a00707-bccf-4653-ac50-ba1c00cad431\n${PADDING}Status: 400 - Bad Request\n${PADDING}Response body: { "status": "Wrong!","data" : {"corpo" : "corpo da resposta","titulo" : "titulo da resposta"\n${PADDING}}\n${PADDING}}\n`,
        `cy:xhr ${ICONS.route}  GET http://localhost:3015/v3/57a00707-bccf-4653-ac50-ba1c00cad431`,
        'non-stubbed non-success XHR log should contain response body'
      );
      expect(cleanStdout).to.not.contain(
        `cy:xhr ${ICONS.warning}  STUBBED PUT https://jsonplaceholder.cypress.io/comments/1\n${PADDING}Status: 403\n                   Response body`,
        'stubbed XHR log should not contain response body'
      );
      // @TODO: Feature broken in cypress. Aborted requests logs are not updated anymore.
      // expect(stdout).to.contain(`cy:xhr ${ICONS.error}  GET https://example.cypress.io/comments/10 - ABORTED\n`);
    });
  }).timeout(60000);

  it('Should update existing logs message later correctly.', async () => {
    await runTest(commandBase([], ['commandLogUpdate.spec.js']), (error, stdout, stderr) => {
      const cleanStdout = clean(stdout, true);
      expect(cleanStdout).to.contain(
        `cy:command ${ICONS.success}  assert\texpected **<a>** to have text **something else**
                    Actual: \t"something else"
                    Expected: \t"something else"
      cy:command ${ICONS.error}  get\tbreaking`
      );
    });
  }).timeout(60000);

  it('Should log expected and actual for assert command.', async () => {
    await runTest(commandBase([], ['expects.spec.js']), (error, stdout, stderr) => {
      const cleanStdout = clean(stdout, true);
      expect(cleanStdout).to.contain(
        `cy:command ${ICONS.error}  assert\texpected **[ Array(12) ]** to equal **[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]**
                    Actual: \t[1,2,3,4,5,6,7,8,9,10,11,12]
                    Expected: \t[1,2,3,4,5,6,7,8,9,10]`
      );
      expect(cleanStdout).to.contain(
        `cy:command ${ICONS.error}  assert\texpected **{ data: [Circular] }** to equal **{}**
                    Actual: \t{"data":"[Circular]"}
                    Expected: \t{}`
      );
    });
  }).timeout(60000);

  it('Should apply chalk markdown to console', async () => {
    await runTestColoredConsole(
      commandBase(['printLogsToConsoleAlways=1'], ['logMarkdown.spec.js']),
      (stdout) => {
        const lines = clean(stdout).split('\n');
        [
          chalk.italic('This is an_italic* log.'),
          chalk.italic('This is an_italic* log.'),
          chalk.bold('This is a__bold* log.'),
          chalk.bold('This is a__bold* log.'),
          chalk.bold(chalk.italic('This is a_bold and italic* log.')),
          chalk.bold(chalk.italic('This is a_bold and italic* log.')),
          '_This is a normal log',
          'This is a normal log_',
          '__This is a normal log',
          'This is a normal log__',
          '*This is a normal log',
          'This is a normal log*',
          '**This is a normal log',
          'This is a normal log**',
        ].forEach((msg, index) => {
          expect(JSON.stringify(lines[index + 4])).to.equal(
            JSON.stringify(chalk.green(`          cy:log ${ICONS.info} `) + ' ' + msg)
          );
        });
      }
    );
  }).timeout(60000);
});
