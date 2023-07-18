import { encodeBase64 } from "@mptool/all";

import type {
  ActivateBindPhoneOptions,
  ActivateBindPhoneResponse,
  ActivateFailedResponse,
  ActivateImageResponse,
  ActivateInfoOptions,
  ActivateInfoResponse,
  ActivateOptions,
  ActivatePasswordOptions,
  ActivatePasswordResponse,
  ActivatePhoneSmsOptions,
  ActivateReplacePhoneOptions,
  ActivateReplacePhoneResponse,
  ActivateSuccessResponse,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";

export const ACTIVATE_SERVER = "https://activate.nenu.edu.cn";

const license = `
<h2 class="h2">一、简介</h2><p>欢迎您使用东北师范大学统一身份认证系统及服务！</p><p>东北师范大学统一身份认证系统是建立统一的用户管理、身份配给和身份认证体系，东北师范大学统一身份认证账号是您在校期间访问校内各信息系统的网上服务账号，您可使用该账号登录学校数字校园各项业务系统，如融合门户、上网认证、教务系统、选课系统、研究生系统、财务系统、VPN服务等，您可以充分享用校园网络信息服务。我们制定本《东北师范大学统一身份认证系统隐私政策》,以便您充分了解在您使用东北师范大学统一身份认证系统的过程中，我们会如何收集、使用、共享、储存以及保护您的个人信息，以及您对您的个人信息享有的权利。</p><p>在您开始使用我们的服务前，请您务必先仔细阅读和理解本政策，特别应重点阅读我们以<strong>粗体/粗体下划线</strong>标识的条款，<strong>确保您充分理解和同意后再开始使用。</strong>如对本政策内容有任何疑问、意见或建议，您可以通过东北师范大学提供的联系方式与我们取得联系。</p><p>本协议仅适用于东北师范大学的师生及其他人员，包括全日制学生、在编教职工、离退休教职工等人员。</p><h2 class="h2">二、个人信息收集</h2><p>2.1东北师范大学统一身份认证系统依据法律法规以及遵循合法、正当、必要的原则而收集和使用您主动提供或因为使用服务产生的个人信息。<strong>如果我们欲将您的个人信息用于本隐私政策未载明的其它用途，或基于特定目的将收集而来的信息用于其他目的，我们会及时以合理的方式向您告知，并在使用前再次征得您的同意。</strong></p><p>2.2为激活<strong>东北师范大学统一身份认证账号</strong>，我们会需收集您的<strong>姓名、学工号、密码、手机号码、证件类型、证件号码</strong>，收集此类信息是注册东北师范大学统一身份认证账号所必需，如您不提供此类信息，我们将无法继续为您提供服务。</p><p>2.3此外，根据相关法律法规及国家标准，<strong>请您注意，在以下情形，我们无需取得您的授权同意即可收集和使用您的个人信息：</strong></p><p>（1）与国家安全、国防安全有关的；</p><p>（2）与公共安全、公共卫生、重大公共利益有关的；</p><p>（3）与犯罪侦查、起诉、审判和判决执行等直接相关的；</p><p>（4）出于维护您或其他个人的生命、财产、声誉等重大合法权益但又很难得到您本人同意的；</p><p>（5）所收集的个人信息是您自行向社会公众公开的；</p><p>（6）或者是从合法公开的渠道（如合法的新闻报道、政府信息公开等渠道）中收集到的；</p><p>（7）根据与您签订和履行相关协议或者其他书面文件所必需的；</p><p>（8）基于科研目的收集的个人信息；</p><p>（9）用于维护系统安全稳定运行所必需的，例如发现、处置故障；</p><p>（10）有权机关的要求、法律法规等规定的其他情形。</p><h2 class="h2">三、个人信息存储</h2><h3 class="h3">3.1存储地域</h3><p>我们在中华人民共和国境内收集和产生的个人信息，将存储在中国<strong>境内</strong>。我们不会将您的个人信息在跨境业务中使用、储存、共享和披露，或将您的个人信息传输至境外。</p><h3 class="h3">3.2存储期限</h3><p>除非法律有强制的留存要求，我们只会在达成本政策所述<strong>目的所必需的期限内</strong>保留您的个人信息。在您<strong>终止使用</strong>东北师范大学统一身份认证系统后，我们会<strong>停止</strong>对您的信息的收集和使用，法律或监管部门另有规定的除外。</p><h3 class="h3">3.3产品或服务停止运营时的通知</h3><p>当我们的产品或服务发生停止运营的情况时，我们将在合理期限内删除您的个人信息或进行匿名化处理，法律法规另有规定的除外。</p><h2 class="h2">四、个人信息使用</h2><p>我们严格遵守法律法规的规定以及与用户的约定，按照本隐私政策所述使用收集的信息，以向您提供更为优质的服务。</p><h3 class="h3">4.1信息使用规则</h3><p>我们会按照如下规则使用收集的信息：</p><p>（1）我们会根据我们收集的信息向您提供学校各应用系统各项功能与服务；</p><p>（2）我们会根据您使用本服务时的故障信息、性能信息等分析产品运行情况，以确保服务的安全性并提高我们的服务质量。</p><h2 class="h2">五、个人信息共享</h2><h3 class="h3">除非获得您的明确同意，我们不会将您的个人信息转让或者公开披露给任何其他机构、组织和个人，也不会将您的个人信息传输给第三方。</h3><h3 class="h3">（1）第三方服务</h3><p>本统一身份认证系统服务由系统开发公司作为第三方提供服务，我们会与开发统一身份认证系统的公司以及具体工作人员签订保密协议，我们将督促相关第三方在按照本指引或另行与您达成的约定收集和使用您的个人信息，并采取适当的安全技术和管理措施保障您的个人信息安全。</p><h3 class="h3">（2）但以下情况中，我们共享、转让、公开您的个人信息无需事先征得您的授权同意：</h3><p>a.与国家安全、国防安全直接相关的；</p><p>b.与公共安全、公共卫生、重大公共利益直接相关的；</p><p>c.与犯罪侦查、起诉、审判和判决执行等直接相关的；</p><p>d.出于维护个人信息主体或其他个人的生命、财产等重大合法权益但又很难得到本人同意的；</p><p>e.所收集的个人信息是个人信息主体自行向社会公众公开的；</p><p>f.从合法公开披露的信息中收集个人信息的，如合法的新闻报道、政府信息公开等渠道；</p><p>g.法律法规规定的其他情形。</p><h2 class="h2">六、个人信息安全保护</h2><h3 class="h3">6.1“最小化”原则</h3><p>“最小化”原则是指处理个人信息应当限于实现处理目的的最小范围，不得过度收集个人信息。我们会以“最小化”原则收集、使用、储存和传输师生个人信息，并通过服务协议和隐私政策告知您相关信息的使用目的和范围。</p><h3 class="h3">6.2对个人信息实行分类管理及制定数据安全制度规范</h3><p>我们非常重视您的个人信息的安全，对您的个人信息建立<strong>数据安全制度规范</strong>并实施<strong>安全技术措施</strong>，防止您的个人信息遭到未经授权的访问、修改，避免数据的损坏或丢失。我们将采用严格的数据处理权限控制，避免数据被违规使用。</p><h2 class="h2">七、用户权利</h2><p>您可根据网页下方保留的联系方式或与学校相关部门联系更改相应信息。</p><h3 class="h3">7.1信息删除</h3><p>您有权在使用本服务过程中根据您的需要及我们提供的具体产品与功能，在相应功能界面删除您的个人信息。如果我们违反法律法规或与您的约定收集、使用、与他人共享或者转让您的个人信息，您有权要求我们及第三方删除。</p><h3 class="h3">7.2改变或撤回授权同意</h3><p>您可以联系我们，以<strong>改变同意范围或撤回您的授权</strong>。特定的功能和服务将需要您的信息才能得以完成，当您撤回同意或授权后，我们无法继续为您提供撤回同意或授权所对应的功能和服务，也不再处理您相应的个人信息。但您撤回同意或授权的决定，不会影响我们此前基于您的授权而开展的个人信息处理。</p><p>我们将尽一切可能采取适当的技术手段，保证您可以访问、更新、更正和删除前述信息时，我们可能会要求您进行身份验证，以保障账户安全。</p><p>7.3在以下情形中，按照法律法规要求，<strong>我们将无法响应您的更正、删除、注销信息的请求：</strong></p><p>（1）与国家安全、国防安全直接相关的；</p><p>（2）与公共安全、公共卫生、重大公共利益直接相关的；</p><p>（3）与犯罪侦查、起诉、审判和执行判决等直接相关的；</p><p>（4）我们有充分证据表明您存在主观恶意或滥用权利的（如您的请求将危害公共安全和其他人合法权益，或您的请求超出了一般技术手段和商业成本可覆盖的范围）；</p><p>（5）响应个人信息主体的请求将导致您或其他个人、组织的合法权益受到严重损害的；</p><p>（6）涉及商业秘密的。</p><h2 class="h2">八、联系我们</h2><p>如您对本政策有任何疑问、意见或建议，或者您在管理您的个人信息时遇到任何问题，您可通过我们提供的多种反馈渠道与我们联系：</p><p>8.1您的个人信息相关咨询、投诉问题，可通过在线客服与我们取得联系。</p><p>8.2如您对本政策内容有任何疑问、意见或建议，可与我们的个人信息保护负责人联系：</p><p>联系人：东北师范大学信息化管理与规划办公室</p><p>联系方式：0431-85099900</p><h2 class="h2">九、隐私政策更新</h2><p>我们可能不时修订本隐私政策，并将在此更新修订版本以及“最后更新”日期，并在变更生效前通过弹窗或其他能触达您的形式通知您。请您注意，只有在您点击弹窗中的同意按钮后，我们才会按照更新后的指引收集、使用、存储您的个人信息。</p><h2 class="h2">十、其他</h2><p>为了更好地服务全校师生，东北师范大学统一身份认证系统会尽可能保持良好运行的状态，然而，因技术升级换代、技术手段受限等因素影响，不担保服务一定能满足您的要求，也不担保服务不会在任何时间中断，对服务的及时性、安全性、出错发生都不作担保。当发生停止运营的情形时，我们将以推送通知、公告等形式通知您，并在合理的期限内删除您的个人信息。</p><p>受限于现有技术，东北师范大学统一身份认证系统不能随时预见和防范法律、技术以及其他风险，对此类风险在法律允许的范围内免责，包括但不限于不可抗力、病毒、木马、黑客攻击、统一身份认证系统不稳定、第三方服务瑕疵、政府行为等原因可能导致的服务中断、数据丢失以及其他的损失和风险。</p><p>如果东北师范大学统一身份认证系统由于您违反法律规定或者本协议的约定而采取了法律法规规定或者本协议约定的必要措施，从而导致相关数据损毁、缺失、无法恢复的，东北师范大学不承担任何责任。</p><p class="author">东北师范大学</p>`;

export const idTypes = [
  "身份证",
  "护照",
  "港澳居民来往内地通行证",
  "台湾居民来往大陆通行证",
  "外国人永久居留身份证",
  "港澳台居民居住证",
] as const;

export const getImage = async (): Promise<ActivateImageResponse> => {
  const imageUrl = `${ACTIVATE_SERVER}/api/staff/activate/imageCode`;
  const imageResponse = await request<ArrayBuffer>(imageUrl, {
    responseType: "arraybuffer",
  });

  const base64Image = `data:image/jpeg;base64,${encodeBase64(imageResponse)}`;

  return {
    success: true,
    license,
    image: base64Image,
  };
};

interface ActivateRawSuccessResponse {
  code: 0;
  msg: "成功";
  data: {
    activationId: string;
  };
}

interface RawErrorResponse {
  code: 20002;
  msg: string;
  data: Record<never, never>;
}

export interface ActivateInfoSuccessResponse {
  success: true;
  activationId: string;
}

export const checkAccount = async ({
  schoolID,
  name,
  id,
  idType,
  captcha,
}: ActivateInfoOptions): Promise<
  ActivateInfoSuccessResponse | ActivateFailedResponse
> => {
  const activateResult = await request<
    ActivateRawSuccessResponse | RawErrorResponse
  >(`${ACTIVATE_SERVER}/api/staff/activate/id`, {
    method: "POST",
    header: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    data: {
      staffNo: schoolID,
      name,
      idNo: id,
      idType,
      imageCode: captcha,
    },
  });

  if (activateResult.code !== 0)
    return {
      success: false,
      msg: activateResult.msg,
    };

  const { activationId } = activateResult.data;

  return {
    success: true,
    activationId,
  };
};

interface CodeRawSuccessResponse {
  code: 0;
  msg: "成功";
  data: Record<never, never>;
}

// TODO: Check this

interface CodeRawFailedResponse {
  code: number;
  msg: string;
  data: Record<never, never>;
}

export type ActivatePhoneSmsResponse =
  | ActivateSuccessResponse
  | ActivateFailedResponse;

export const sendSms = async ({
  activationId,
  phone,
}: ActivatePhoneSmsOptions): Promise<ActivatePhoneSmsResponse> => {
  const sendCodeResult = await request<
    CodeRawSuccessResponse | CodeRawFailedResponse
  >(`${ACTIVATE_SERVER}/api/staff/activate/checkCode`, {
    method: "POST",
    header: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    data: {
      activationId,
      phone,
    },
  });

  if (sendCodeResult.code !== 0)
    return {
      success: false,
      msg: sendCodeResult.msg,
    };

  return { success: true };
};

interface PhoneRawSuccessResponse {
  code: 0;
  msg: "成功";
  data:
    | {
        boundStaffNo: string;
      }
    | Record<string, string>;
}

export const bindPhone = async ({
  activationId,
  code,
  phone,
}: ActivateBindPhoneOptions): Promise<ActivateBindPhoneResponse> => {
  const content = await request<PhoneRawSuccessResponse | RawErrorResponse>(
    `${ACTIVATE_SERVER}/api/staff/activate/mobile`,
    {
      method: "POST",
      header: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      data: { activationId, phone, checkCode: code },
    },
  );

  if (content.code !== 0)
    return {
      success: false,
      type: "wrong",
      msg: content.msg,
    };

  if (content.data.boundStaffNo)
    return {
      success: false,
      type: "conflict",
      msg: `该手机号已绑定 ${content.data.boundStaffNo} 学号。`,
    };

  return {
    success: true,
  };
};

export const replacePhone = async ({
  activationId,
  code,
  phone,
}: ActivateReplacePhoneOptions): Promise<ActivateReplacePhoneResponse> => {
  const content = await request<PhoneRawSuccessResponse | RawErrorResponse>(
    `${ACTIVATE_SERVER}/api/staff/activate/mobile/unbind`,
    {
      method: "POST",
      header: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      data: JSON.stringify({ activationId, phone, checkCode: code }),
    },
  );

  if (content.code !== 0)
    return {
      success: false,
      msg: content.msg,
    };

  return {
    success: true,
  };
};

export const setPassword = async ({
  activationId,
  password,
}: ActivatePasswordOptions): Promise<ActivatePasswordResponse> => {
  const content = await request<ActivateRawSuccessResponse | RawErrorResponse>(
    `${ACTIVATE_SERVER}/api/staff/activate/mobile`,
    {
      method: "POST",
      header: {
        "Content-Type": "application/json;charset=UTF-8",
      },
      data: { activationId, password },
    },
  );

  if (content.code !== 0)
    return {
      success: false,
      msg: content.msg,
    };

  return {
    success: true,
  };
};

export const activateAccountOnline = async (
  options: ActivateOptions | "GET",
): Promise<
  | ActivateImageResponse
  | ActivateInfoResponse
  | ActivatePhoneSmsResponse
  | ActivateBindPhoneOptions
  | ActivateReplacePhoneResponse
  | ActivatePasswordResponse
> =>
  request(`${service}/auth/activate`, {
    method: options === "GET" ? "GET" : "POST",
    ...(options === "GET" ? {} : { data: options }),
    scope: `${ACTIVATE_SERVER}/api/`,
  });
