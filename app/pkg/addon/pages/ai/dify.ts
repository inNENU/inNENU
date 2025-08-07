import { request } from "../../../../api/index.js";
import { DIFY_API_BASE_URL, DIFY_API_KEY } from "../../../../config/index.js";
import { user } from "../../../../state/index.js";

export interface DifyMessage {
  id: string;
  text: string;
  type: "user" | "assistant";
  timestamp: number;
}

export interface DifyChatRequest {
  query: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  conversation_id?: string;
  user: string;
  inputs?: Record<string, unknown>;
}

export interface DifyChatResponse {
  success: true;
  answer: string;
  conversationId: string;
  messageId: string;
  createdAt: number;
}

export interface DifyErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type DifyResponse = DifyChatResponse | DifyErrorResponse;

/**
 * 发送消息到 Dify API
 */
export const sendMessageToDify = async (
  message: string,
  conversationId?: string,
): Promise<DifyResponse> => {
  try {
    // 获取用户标识符，优先使用 openid，否则使用默认值
    const userId = user.openid || "anonymous_user";

    const requestData: DifyChatRequest = {
      query: message,
      user: userId,
      inputs: {},
    };

    if (conversationId) {
      requestData.conversation_id = conversationId;
    }

    const response = await request<{
      answer: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      conversation_id: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      message_id: string;
      // eslint-disable-next-line @typescript-eslint/naming-convention
      created_at: number;
    }>(`${DIFY_API_BASE_URL}/v1/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    return {
      success: true,
      answer: response.data.answer,
      conversationId: response.data.conversation_id,
      messageId: response.data.message_id,
      createdAt: response.data.created_at,
    };
  } catch (error) {
    console.error("Dify API 请求失败:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "网络请求失败",
      code: error instanceof Error ? "NETWORK_ERROR" : undefined,
    };
  }
};
