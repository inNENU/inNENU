export type PlayMode = "列表循环" | "单曲循环" | "顺序播放" | "随机播放";

export interface MusicState {
  /** 是否正在播放 */
  playing: boolean;
  /** 播放歌曲序号 */
  index: number;
}
