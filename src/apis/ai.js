import {
  INPUT_PLACE_FROM,
  INPUT_PLACE_TO,
  INPUT_PLACE_TEXT,
  INPUT_PLACE_MODEL,
  INPUT_PLACE_KEY,
} from "../config";
import { parseJsonObj } from "../libs/utils";

/**
 * 统一的AI模型API生成器
 * 支持OpenAI、Gemini、Claude、OpenRouter、Ollama等模型
 */
export const genAIModel = ({
  text,
  from,
  to,
  url,
  key,
  systemPrompt,
  userPrompt,
  model,
  temperature,
  maxTokens,
  customHeader,
  customBody,
  think = false,
  provider = "openai", // openai, gemini, claude, openrouter, ollama
}) => {
  // 处理URL占位符
  url = url
    .replaceAll(INPUT_PLACE_MODEL, model)
    .replaceAll(INPUT_PLACE_KEY, key);

  // 处理prompt占位符
  systemPrompt = systemPrompt
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_TEXT, text);
  userPrompt = userPrompt
    .replaceAll(INPUT_PLACE_FROM, from)
    .replaceAll(INPUT_PLACE_TO, to)
    .replaceAll(INPUT_PLACE_TEXT, text);

  // 解析自定义header和body
  customHeader = parseJsonObj(customHeader);
  customBody = parseJsonObj(customBody);

  let data = {};
  let headers = {
    "Content-type": "application/json",
    ...customHeader,
  };

  // 根据不同provider设置特定的请求格式
  switch (provider) {
    case "gemini":
      data = {
        system_instruction: {
          parts: {
            text: systemPrompt,
          },
        },
        contents: {
          role: "user",
          parts: {
            text: userPrompt,
          },
        },
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature,
        },
        ...customBody,
      };
      break;

    case "claude":
      data = {
        model,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        ...customBody,
      };
      headers = {
        ...headers,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
        "x-api-key": key,
      };
      break;

    case "ollama":
      data = {
        model,
        system: systemPrompt,
        prompt: userPrompt,
        think,
        stream: false,
        ...customBody,
      };
      if (key) {
        headers.Authorization = `Bearer ${key}`;
      }
      break;

    case "openrouter":
      data = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        ...customBody,
      };
      headers.Authorization = `Bearer ${key}`;
      break;

    case "openai":
    default:
      data = {
        model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature,
        max_completion_tokens: maxTokens,
        ...customBody,
      };
      headers.Authorization = `Bearer ${key}`;
      // Azure OpenAI使用api-key
      if (url.includes("azure.com") || url.includes("openai.azure.com")) {
        delete headers.Authorization;
        headers["api-key"] = key;
      }
      break;
  }

  const init = {
    headers,
    method: "POST",
    body: JSON.stringify(data),
  };

  return [url, init];
};

/**
 * 解析AI模型API响应
 */
export const parseAIModelResponse = (res, provider = "openai") => {
  let trText = "";
  let isSame = false;

  switch (provider) {
    case "gemini":
      trText = res?.candidates
        ?.map((item) => item.content?.parts.map((item) => item.text).join(" "))
        .join(" ");
      break;

    case "claude":
      trText = res?.content?.map((item) => item.text).join(" ");
      break;

    case "ollama":
      trText = res?.response;
      break;

    case "openrouter":
    case "openai":
    default:
      trText = res?.choices?.map((item) => item.message.content).join(" ");
      break;
  }

  // 默认认为译文与原文不同
  isSame = false;

  return [trText, isSame];
};
