export interface SongDetail {
  /** 歌曲地址 */
  src: string;
  /** 歌曲封面 */
  cover: string;
  /** 标题 */
  title: string;
  /** 演唱者 */
  singer: string;
  /** 歌词 */
  lyric?: string;
}

/** 歌词 */
export interface Lyric {
  /** 歌词的开始时间 */
  time: number;
  /** 歌词的内容 */
  text: string;
}

export type PlayMode = "列表循环" | "单曲循环" | "顺序播放" | "随机播放";

export interface MusicState {
  /** 是否正在播放 */
  playing: boolean;
  /** 播放歌曲序号 */
  index: number;
}
