import { $Page } from "@mptool/all";

import type { DifyMessage } from "./dify.js";
import { sendMessageToDify } from "./dify.js";
import { info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";

interface AIPageData {
  theme: string;
  color?: ReturnType<typeof getPageColor>;
  messages: DifyMessage[];
  inputMessage: string;
  loading: boolean;
  conversationId?: string;
}

interface AIPageMethods {
  addMessage: (message: DifyMessage) => void;
  scrollToBottom: () => void;
  onInputChange: (event: WechatMiniprogram.Input) => void;
  sendMessage: () => Promise<void>;
  clearMessages: () => void;
}

$Page<AIPageData, AIPageMethods>("ai", {
  data: {
    theme: info.theme,
    messages: [],
    inputMessage: "",
    loading: false,
  },

  onLoad() {
    this.setData({
      color: getPageColor(true),
      theme: info.theme,
    });

    showNotice("ai");

    // 添加欢迎消息
    this.addMessage({
      id: "welcome",
      text: "您好！我是东师智能助手，有什么可以帮助您的吗？",
      type: "assistant",
      timestamp: Date.now(),
    });
  },

  /** 添加消息到聊天列表 */
  addMessage(message: DifyMessage) {
    const { messages } = this.data;

    this.setData({
      messages: [...messages, message],
    });

    // 滚动到底部
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  },

  /** 滚动到聊天底部 */
  scrollToBottom() {
    const query = this.createSelectorQuery();

    query
      .select(".chat-list")
      .boundingClientRect((rect) => {
        if (rect) {
          wx.pageScrollTo({
            scrollTop: rect.height,
            duration: 300,
          });
        }
      })
      .exec();
  },

  /** 输入框内容变化 */
  onInputChange(event: WechatMiniprogram.Input) {
    this.setData({
      inputMessage: event.detail.value,
    });
  },

  /** 发送消息 */
  async sendMessage() {
    const { inputMessage, loading, conversationId } = this.data;

    if (!inputMessage.trim() || loading) return;

    // 添加用户消息
    const userMessage: DifyMessage = {
      id: `user_${Date.now()}`,
      text: inputMessage.trim(),
      type: "user",
      timestamp: Date.now(),
    };

    this.addMessage(userMessage);

    // 清空输入框并显示加载状态
    this.setData({
      inputMessage: "",
      loading: true,
    });

    try {
      // 调用 Dify API
      const response = await sendMessageToDify(
        userMessage.text,
        conversationId,
      );

      if (response.success) {
        // 添加AI回复
        const assistantMessage: DifyMessage = {
          id: response.messageId,
          text: response.answer,
          type: "assistant",
          timestamp: response.createdAt * 1000, // 转换为毫秒
        };

        this.addMessage(assistantMessage);

        // 保存会话ID
        this.setData({
          conversationId: response.conversationId,
        });
      } else {
        // 显示错误消息
        const errorMessage: DifyMessage = {
          id: `error_${Date.now()}`,
          text: `抱歉，发生了错误：${response.error}`,
          type: "assistant",
          timestamp: Date.now(),
        };

        this.addMessage(errorMessage);
      }
    } catch (error) {
      console.error("发送消息失败:", error);

      const errorMessage: DifyMessage = {
        id: `error_${Date.now()}`,
        text: "抱歉，网络连接失败，请稍后重试。",
        type: "assistant",
        timestamp: Date.now(),
      };

      this.addMessage(errorMessage);
    } finally {
      this.setData({
        loading: false,
      });
    }
  },

  /** 清空聊天记录 */
  clearMessages() {
    wx.showModal({
      title: "确认清空",
      content: "确定要清空所有聊天记录吗？",
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [],
            conversationId: undefined,
          });

          // 重新添加欢迎消息
          this.addMessage({
            id: "welcome",
            text: "您好！我是东师智能助手，有什么可以帮助您的吗？",
            type: "assistant",
            timestamp: Date.now(),
          });
        }
      },
    });
  },
});
