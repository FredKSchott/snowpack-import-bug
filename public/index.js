import { CancelError } from "@esfx/cancelable"; // this gets ignored by Snowpack
import { CancelToken } from "@esfx/async-canceltoken";

// from https://github.com/esfx/esfx/tree/master/packages/async-canceltoken#readme

// consume a cancel token
async function doWork(token = CancelToken.none) {
  // do some work
  await doSomeOtherWork(token);

  // throw an error if cancellation has been signaled since awaiting.
  token.throwIfSignaled();
}

function doSomeOtherWork(token = CancelToken.none) {
  return new Promise((resolve, reject) => {
    token.throwIfSignaled(); // throw if cancellation has already been signaled.

    // setup some external async operation...
    const worker = {
      id: undefined,
      start: r => worker.id = setTimeout(r, 5000),
      abort: () => clearTimeout(worker.id)
    };

    // listen for cancellation and abort the worker.
    const subscription = token.subscribe(() => {
      worker.abort();
      reject(new CancelError());
    });
    
    // start working, resolve when done
    worker.start(resolve);
  });
}

// call an async function that supports cancellation
const source = CancelToken.source();

doWork(source.token).then(() => {
  // operation completed...
  console.log('completed');
  source.close();
}, err => {
  if (err instanceof CancelError) {
    console.log('cancelled');
  }
});

// cancel operation after 3 seconds
setTimeout(() => source.cancel(), 3000);
