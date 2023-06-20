export interface PromiseQueue {
  /**
   * @returns `true` if all the promises are resolved, `false` if the queue is stopped.
   */
  run: () => Promise<boolean>;
  stop: () => void;
}

/**
 * 一个队列，在上一个函数执行完毕后执行 `next()`  才会开始执行下一个函数。
 */
export const promiseQueue = (
  promiseList: (() => Promise<void>)[],
  capacity = 1
): PromiseQueue => {
  let shouldCancel = false;

  return {
    run: (): Promise<boolean> =>
      new Promise((resolve) => {
        /** 回调队列 */
        const queue: (() => Promise<void>)[] = promiseList;

        let running = 0;

        /** 执行下一个函数 */
        const next = (): void => {
          if (shouldCancel) return resolve(true);

          /** 即将执行的任务 */
          const task = queue.shift();

          if (task) {
            running += 1;
            task().then(() => {
              running -= 1;
              next();
            });
          } else if (running === 0) resolve(true);
        };

        let counter = 0;

        while (counter < capacity) {
          counter += 1;
          next();
        }
      }),
    stop: (): void => {
      shouldCancel = true;
    },
  };
};
