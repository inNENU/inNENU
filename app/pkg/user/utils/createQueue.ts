export interface PromiseQueue<T = void> {
  /**
   * @returns `true` if all the promises are resolved, `false` if the queue is stopped.
   */
  run: () => Promise<{ interrupted: false } | { interrupted: true; msg: T }>;
  stop: (msg: T) => void;
}

/**
 * 一个队列，支持可控并发和中断
 */
export const createQueue = <T>(
  promiseList: (() => Promise<void>)[],
  capacity = 1,
): PromiseQueue<T> => {
  let shouldCancel = false;
  let stopMsg: T | void = void 0;

  return {
    run: (): Promise<{ interrupted: false } | { interrupted: true; msg: T }> =>
      new Promise((resolve) => {
        /** 回调队列 */
        const queue: (() => Promise<void>)[] = promiseList;

        let running = 0;

        /** 执行下一个函数 */
        const next = (): void => {
          if (shouldCancel)
            return resolve({ interrupted: true, msg: stopMsg as T });

          /** 即将执行的任务 */
          const task = queue.shift();

          if (task) {
            running += 1;
            task().then(() => {
              running -= 1;
              next();
            });
          } else if (running === 0) resolve({ interrupted: false });
        };

        let counter = 0;

        while (counter < capacity) {
          counter += 1;
          next();
        }
      }),
    stop: (msg: T): void => {
      shouldCancel = true;
      stopMsg = msg;
    },
  };
};
