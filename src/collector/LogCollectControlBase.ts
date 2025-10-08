import CtrError from '../CtrError';
import type {ExtendedSupportOptions} from '../installLogsCollector.types';
import LogCollectorState, {StackLogArray} from './LogCollectorState';
import type {MessageData, SetOptional, State, TestData} from '../types';

export default abstract class LogCollectControlBase {
  protected abstract collectorState: LogCollectorState;
  protected abstract config: ExtendedSupportOptions;

  sendLogsToPrinter(
    logStackIndex: number,
    mochaRunnable: Mocha.Runnable,
    options: {
      state?: State;
      title?: string;
      noQueue?: boolean;
      consoleTitle?: string;
      isHook?: boolean;
      wait?: number;
      continuous?: boolean;
    } = {}
  ) {
    let testState = options.state || mochaRunnable.state;
    let testTitle = options.title || mochaRunnable.title;
    let testLevel = 0;

    let spec = this.getSpecFilePath(mochaRunnable);
    if (!spec) return;

    let wait = typeof options.wait === 'number' ? options.wait : 5;

    {
      let parent = mochaRunnable.parent;
      while (parent?.title) {
        testTitle = `${parent.title} -> ${testTitle}`;
        parent = parent.parent;
        ++testLevel;
      }
    }

    if (testState === 'failed' && mochaRunnable && mochaRunnable['_retries'] > 0) {
      testTitle += ` (Attempt ${mochaRunnable && mochaRunnable['_currentRetry'] + 1})`;
    }

    const prepareLogs = () =>
      this.prepareLogs(logStackIndex, {mochaRunnable, testState, testTitle, testLevel});

    const buildDataMessage = () => {
      const {fileMessages, terminalMessages} = prepareLogs();
      return {
        spec: spec,
        test: testTitle,
        fileMessages,
        terminalMessages,
        state: testState,
        level: testLevel,
        consoleTitle: options.consoleTitle,
        isHook: options.isHook,
        continuous: options.continuous,
      };
    };

    this.triggerSendTask(buildDataMessage, options.noQueue || false, wait);
  }

  protected abstract triggerSendTask(
    buildDataMessage: (continuous?: boolean) => SetOptional<MessageData, 'state'>,
    noQueue: boolean,
    wait: number
  ): void;

  prepareLogs(logStackIndex: number, testData: TestData) {
    let logsCopy = this.collectorState.consumeLogStacks(logStackIndex);

    if (logsCopy === null) {
      throw new CtrError(`Domain exception: log stack null.`);
    }

    let fileLogs: StackLogArray = [...logsCopy];

    if (this.config.filterLog) {
      logsCopy = logsCopy.filter(this.config.filterLog);
      // potential for separate filtering too
      fileLogs = fileLogs.filter(this.config.filterLog);
    }

    if (this.config.processLog) {
      logsCopy = logsCopy.map(this.config.processLog);
    }

    if (this.config.processFileLog) {
      fileLogs = fileLogs.map(this.config.processFileLog);
    }

    if (this.config.collectTestLogs) {
      this.config.collectTestLogs(testData, logsCopy);
    }

    return {fileMessages: fileLogs, terminalMessages: logsCopy};
  }

  getSpecFilePath(mochaRunnable: Mocha.Runnable) {
    if (!mochaRunnable.invocationDetails && !mochaRunnable.parent?.invocationDetails) {
      return mochaRunnable.parent?.file ?? null;
    }

    let invocationDetails = mochaRunnable.invocationDetails;
    let parent = mochaRunnable.parent;
    // always get top-most spec to determine the called .spec file
    while (parent?.invocationDetails) {
      invocationDetails = parent.invocationDetails;
      parent = parent.parent;
    }

    return (
      parent?.file || // Support for cypress-grep.
      invocationDetails.relativeFile ||
      invocationDetails.fileUrl?.replace(/^[^?]+\?p=/, '')
    );
  }
}
