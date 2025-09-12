import queryString from "query-string";
import {
  OPT_TRANS_GOOGLE,
  OPT_TRANS_GOOGLE_2,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_DEEPL,
  OPT_TRANS_DEEPLFREE,
  OPT_TRANS_DEEPLX,
  OPT_TRANS_NIUTRANS,
  OPT_TRANS_BAIDU,
  OPT_TRANS_TENCENT,
  OPT_TRANS_VOLCENGINE,
  OPT_TRANS_OPENAI,
  OPT_TRANS_GEMINI,
  OPT_TRANS_CLAUDE,
  OPT_TRANS_CLOUDFLAREAI,
  OPT_TRANS_OLLAMA,
  OPT_TRANS_OPENROUTER,
  OPT_TRANS_CUSTOMIZE,
  URL_MICROSOFT_TRAN,
  URL_TENCENT_TRANSMART,
  URL_VOLCENGINE_TRAN,
  INPUT_PLACE_URL,
  INPUT_PLACE_FROM,
  INPUT_PLACE_TO,
  INPUT_PLACE_TEXT,
  INPUT_PLACE_KEY,
  INPUT_PLACE_MODEL,
} from "../config";
import { msAuth } from "../libs/auth";
import { genDeeplFree } from "./deepl";
import { genBaidu } from "./baidu";
import { genAIModel, parseAIModelResponse } from "./ai";
import interpreter from "../libs/interpreter";
import { parseJsonObj } from "../libs/utils";

const keyMap = new Map();
const urlMap = new Map();

// 轮询key/url
const keyPick = (translator, key = "", cacheMap) => {
  const keys = key
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    return "";
  }

  const preIndex = cacheMap.get(translator) ?? -1;
  const curIndex = (preIndex + 1) % keys.length;
  cacheMap.set(translator, curIndex);

  return keys[curIndex];
};

const genGoogle = ({ text, from, to, url, key }) => {
  const params = {
    client: "gtx",
    dt: "t",
    dj: 1,
    ie: "UTF-8",
    sl: from,
    tl: to,
    q: text,
  };
  const input = `${url}?${queryString.stringify(params)}`;
  const init = {
    headers: {
      "Content-type": "application/json",
    },
  };
  if (key) {
    init.headers.Authorization = `Bearer ${key}`;
  }

  return [input, init];
};

const genGoogle2 = ({ text, from, to, url, key }) => {
  const body = JSON.stringify([[[text], from, to], "wt_lib"]);
  const init = {
    method: "POST",
    headers: {
      "Content-Type": "application/json+protobuf",
      "X-Goog-API-Key": key,
    },
    body,
  };

  return [url, init];
};

const genMicrosoft = async ({ text, from, to }) => {
  const [token] = await msAuth();
  const params = {
    from,
    to,
    "api-version": "3.0",
  };
  const input = `${URL_MICROSOFT_TRAN}?${queryString.stringify(params)}`;
  const init = {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    method: "POST",
    body: JSON.stringify([{ Text: text }]),
  };

  return [input, init];
};

const genDeepl = ({ text, from, to, url, key }) => {
  const data = {
    text: [text],
    target_lang: to,
    source_lang: from,
    // split_sentences: "0",
  };
  const init = {
    headers: {
      "Content-type": "application/json",
      Authorization: `DeepL-Auth-Key ${key}`,
    },
    method: "POST",
    body: JSON.stringify(data),
  };

  return [url, init];
};

const genDeeplX = ({ text, from, to, url, key }) => {
  const data = {
    text,
    target_lang: to,
    source_lang: from,
  };

  const init = {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  };
  if (key) {
    init.headers.Authorization = `Bearer ${key}`;
  }

  return [url, init];
};

const genNiuTrans = ({ text, from, to, url, key, dictNo, memoryNo }) => {
  const data = {
    from,
    to,
    apikey: key,
    src_text: text,
    dictNo,
    memoryNo,
  };

  const init = {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  };

  return [url, init];
};

const genTencent = ({ text, from, to }) => {
  const data = {
    header: {
      fn: "auto_translation",
      client_key:
        "browser-chrome-110.0.0-Mac OS-df4bd4c5-a65d-44b2-a40f-42f34f3535f2-1677486696487",
    },
    type: "plain",
    model_category: "normal",
    source: {
      text_list: [text],
      lang: from,
    },
    target: {
      lang: to,
    },
  };

  const init = {
    headers: {
      "Content-Type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      referer: "https://transmart.qq.com/zh-CN/index",
    },
    method: "POST",
    body: JSON.stringify(data),
  };

  return [URL_TENCENT_TRANSMART, init];
};

const genVolcengine = ({ text, from, to }) => {
  const data = {
    source_language: from,
    target_language: to,
    text: text,
  };

  const init = {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  };

  return [URL_VOLCENGINE_TRAN, init];
};

const genCloudflareAI = ({ text, from, to, url, key }) => {
  const data = {
    text,
    source_lang: from,
    target_lang: to,
  };

  const init = {
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    method: "POST",
    body: JSON.stringify(data),
  };

  return [url, init];
};

const genCustom = ({ text, from, to, url, key, reqHook }) => {
  url = url
    .replaceAll(INPUT_PLACE_URL, url)
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_TEXT, text)
    .replaceAll(INPUT_PLACE_KEY, key);
  let init = {};

  if (reqHook?.trim()) {
    interpreter.run(`exports.reqHook = ${reqHook}`);
    [url, init] = interpreter.exports.reqHook(text, from, to, url, key);
    return [url, init];
  }

  const data = {
    text,
    from,
    to,
  };
  init = {
    headers: {
      "Content-type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  };
  if (key) {
    init.headers.Authorization = `Bearer ${key}`;
  }

  return [url, init];
};

/**
 * 构造翻译接口请求参数
 * @param {*}
 * @returns
 */
export const genTransReq = (translator, args) => {
  switch (translator) {
    case OPT_TRANS_DEEPL:
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_GEMINI:
    case OPT_TRANS_CLAUDE:
    case OPT_TRANS_CLOUDFLAREAI:
    case OPT_TRANS_OLLAMA:
    case OPT_TRANS_OPENROUTER:
    case OPT_TRANS_NIUTRANS:
    case OPT_TRANS_CUSTOMIZE:
      args.key = keyPick(translator, args.key, keyMap);
      break;
    case OPT_TRANS_DEEPLX:
      args.url = keyPick(translator, args.url, urlMap);
      break;
    default:
  }

  switch (translator) {
    case OPT_TRANS_GOOGLE:
      return genGoogle(args);
    case OPT_TRANS_GOOGLE_2:
      return genGoogle2(args);
    case OPT_TRANS_MICROSOFT:
      return genMicrosoft(args);
    case OPT_TRANS_DEEPL:
      return genDeepl(args);
    case OPT_TRANS_DEEPLFREE:
      return genDeeplFree(args);
    case OPT_TRANS_DEEPLX:
      return genDeeplX(args);
    case OPT_TRANS_NIUTRANS:
      return genNiuTrans(args);
    case OPT_TRANS_BAIDU:
      return genBaidu(args);
    case OPT_TRANS_TENCENT:
      return genTencent(args);
    case OPT_TRANS_VOLCENGINE:
      return genVolcengine(args);
    case OPT_TRANS_OPENAI:
      return genAIModel({ ...args, provider: "openai" });
    case OPT_TRANS_GEMINI:
      return genAIModel({ ...args, provider: "gemini" });
    case OPT_TRANS_CLAUDE:
      return genAIModel({ ...args, provider: "claude" });
    case OPT_TRANS_CLOUDFLAREAI:
      return genCloudflareAI(args);
    case OPT_TRANS_OLLAMA:
      return genAIModel({ ...args, provider: "ollama" });
    case OPT_TRANS_OPENROUTER:
      return genAIModel({ ...args, provider: "openrouter" });
    case OPT_TRANS_CUSTOMIZE:
      return genCustom(args);
    default:
      throw new Error(`[trans] translator: ${translator} not support`);
  }
};

/**
 * 解析翻译接口返回数据
 * @param {*} translator
 * @param {*} res
 * @param {*} apiSetting
 * @param {*} param3
 * @returns
 */
export const parseTransRes = (
  translator,
  res,
  apiSetting,
  { text, from, to }
) => {
  let trText = ""; // 返回的译文
  let isSame = false; // 译文与原文语言是否相同

  switch (translator) {
    case OPT_TRANS_GOOGLE:
      trText = res.sentences.map((item) => item.trans).join(" ");
      isSame = to === res.src;
      break;
    case OPT_TRANS_GOOGLE_2:
      trText = res?.[0]?.[0] || "";
      isSame = to === res.src;
      break;
    case OPT_TRANS_MICROSOFT:
      trText = res
        .map((item) => item.translations.map((item) => item.text).join(" "))
        .join(" ");
      isSame = text === trText;
      break;
    case OPT_TRANS_DEEPL:
      trText = res.translations.map((item) => item.text).join(" ");
      isSame = to === res.translations[0].detected_source_language;
      break;
    case OPT_TRANS_DEEPLFREE:
      trText = res.result?.texts.map((item) => item.text).join(" ");
      isSame = to === res.result?.lang;
      break;
    case OPT_TRANS_DEEPLX:
      trText = res.data;
      isSame = to === res.source_lang;
      break;
    case OPT_TRANS_NIUTRANS:
      const json = JSON.parse(res);
      if (json.error_msg) {
        throw new Error(json.error_msg);
      }
      trText = json.tgt_text;
      isSame = to === json.from;
      break;
    case OPT_TRANS_BAIDU:
      // trText = res.trans_result?.data.map((item) => item.dst).join(" ");
      // isSame = res.trans_result?.to === res.trans_result?.from;
      if (res.type === 1) {
        trText = Object.keys(JSON.parse(res.result).content[0].mean[0].cont)[0];
        isSame = to === res.from;
      } else if (res.type === 2) {
        trText = res.data.map((item) => item.dst).join(" ");
        isSame = to === res.from;
      }
      break;
    case OPT_TRANS_TENCENT:
      trText = res?.auto_translation?.[0];
      isSame = text === trText;
      break;
    case OPT_TRANS_VOLCENGINE:
      trText = res?.translation || "";
      isSame = to === res?.detected_language;
      break;
    case OPT_TRANS_OPENAI:
    case OPT_TRANS_OPENROUTER:
      [trText, isSame] = parseAIModelResponse(res, "openai");
      break;
    case OPT_TRANS_GEMINI:
      [trText, isSame] = parseAIModelResponse(res, "gemini");
      break;
    case OPT_TRANS_CLAUDE:
      [trText, isSame] = parseAIModelResponse(res, "claude");
      break;
    case OPT_TRANS_CLOUDFLAREAI:
      trText = res?.result?.translated_text;
      isSame = text === trText;
      break;
    case OPT_TRANS_OLLAMA:
      const { thinkIgnore = "" } = apiSetting;
      const deepModels = thinkIgnore.split(",").filter((model) => model.trim());
      if (deepModels.some((model) => res?.model?.startsWith(model))) {
        trText = res?.response.replace(/<think>[\s\S]*<\/think>/i, "");
      } else {
        trText = res?.response;
      }
      isSame = text === trText;
      break;
    case OPT_TRANS_CUSTOMIZE:
      const { resHook } = apiSetting;
      if (resHook?.trim()) {
        interpreter.run(`exports.resHook = ${resHook}`);
        [trText, isSame] = interpreter.exports.resHook(res, text, from, to);
      } else {
        trText = res.text;
        isSame = to === res.from;
      }
      break;
    default:
  }

  return [trText, isSame];
};
