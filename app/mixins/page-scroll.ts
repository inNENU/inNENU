import { getCurrentPage } from "@mptool/all";

type Scroller = (event: WechatMiniprogram.Page.IPageScrollOption) => void;

const onPageScroll = (
  event: WechatMiniprogram.Page.IPageScrollOption,
): void => {
  const { $scrollHandler = [] } =
    getCurrentPage<{
      $scrollHandler?: Scroller[];
    }>() || {};

  $scrollHandler.forEach((scroller) => {
    if (typeof scroller === "function") scroller(event);
  });
};

export function defaultScroller(
  this: {
    data: {
      titleDisplay: boolean;
      borderDisplay: boolean;
      shadow: boolean;
    };
    setData(
      data: Partial<{
        titleDisplay: boolean;
        borderDisplay: boolean;
        shadow: boolean;
      }>,
    ): void;
  },
  option: WechatMiniprogram.Page.IPageScrollOption,
): void {
  // 判断情况并赋值
  const nav = {
    borderDisplay: option.scrollTop >= 53,
    titleDisplay: option.scrollTop > 42,
    shadow: option.scrollTop > 1,
  };

  // 判断结果并更新界面数据
  if (
    this.data.titleDisplay !== nav.titleDisplay ||
    this.data.borderDisplay !== nav.borderDisplay ||
    this.data.shadow !== nav.shadow
  )
    this.setData(nav);
}

export const pageScrollMixin = (scroller: Scroller): string =>
  Behavior<
    { disableScroll?: boolean },
    Record<string, never>,
    Record<string, never>,
    WechatMiniprogram.Behavior.BehaviorIdentifier[]
  >({
    attached() {
      if (this.data.disableScroll) {
        this.setData({
          titleDisplay: true,
          borderDisplay: true,
          shadow: true,
        });

        return;
      }

      const page = getCurrentPage();

      if (page) {
        if (Array.isArray(page.$scrollHandler))
          page.$scrollHandler.push(scroller.bind(this));
        else
          page.$scrollHandler =
            typeof page.onPageScroll === "function"
              ? [page.onPageScroll.bind(page), scroller.bind(this)]
              : [scroller.bind(this)];

        page.onPageScroll = onPageScroll as (
          arg?: WechatMiniprogram.Page.IPageScrollOption,
        ) => void;

        page.onScrollViewScroll = function (
          event: WechatMiniprogram.ScrollViewScroll,
        ): void {
          this.onPageScroll(event.detail);
        };
      }
    },

    detached() {
      if (this.data.disableScroll) return;

      const page = getCurrentPage<{
        $scrollHandler?: Scroller[];
      }>();

      if (page)
        page.$scrollHandler = (page.$scrollHandler || []).filter(
          (item) => item !== scroller,
        );
    },
  });
