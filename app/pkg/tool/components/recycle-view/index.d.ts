type Component = any;
type Page = any;

interface SizeInfo {
  width: number;
  height: number;
}

type SizeGetter<T> = (item: T, index: number) => SizeInfo;

interface RecycleContextOptions<T> {
  id: string;
  dataKey: string;
  page: Component | Page;
  itemSize: SizeGetter<T> | SizeInfo;
  useInPage?: boolean;
  root?: Page;
  placeholderClass?: string;
}

interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface RecycleContext<T> {
  append(list: T[], callback?: () => void): RecycleContext<T>;
  appendList(list: T[], callback?: () => void): RecycleContext<T>;
  splice(
    begin: number,
    deleteCount: number,
    appendList: T[],
    callback?: () => void,
  ): RecycleContext<T>;
  updateList(
    beginIndex: number,
    list: T[],
    callback?: () => void,
  ): RecycleContext<T>;
  update(
    beginIndex: number,
    list: T[],
    callback?: () => void,
  ): RecycleContext<T>;
  destroy(): RecycleContext<T>;
  forceUpdate(callback: () => void, reInitSlot: boolean): RecycleContext<T>;
  getBoundingClientRect(index: number | undefined): Position | Position[];
  getScrollTop(): number;
  transformRpx(rpx: number, addPxSuffix?: string): number;
  getViewportItems(inViewportPx: number): T[];
  getList(): T[];
}

export function createRecycleContext<T>(
  Options: RecycleContextOptions<T>,
): RecycleContext<T>;
