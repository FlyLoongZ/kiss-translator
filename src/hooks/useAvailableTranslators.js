import { useMemo } from "react";
import { useSetting } from "./Setting";
import {
  OPT_TRANS_GOOGLE,
  OPT_TRANS_GOOGLE_2,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_DEEPLFREE,
  OPT_TRANS_BAIDU,
  OPT_TRANS_TENCENT,
  OPT_TRANS_VOLCENGINE,
} from "../config";

/**
 * 获取可用的翻译服务列表（内置API和已添加的API）
 * @returns {Array} 可用的翻译服务列表
 */
export function useAvailableTranslators() {
  const { setting } = useSetting();

  return useMemo(() => {
    // 内置翻译API
    const builtinTranslators = [
      OPT_TRANS_GOOGLE,
      OPT_TRANS_GOOGLE_2,
      OPT_TRANS_MICROSOFT,
      OPT_TRANS_DEEPLFREE,
      OPT_TRANS_BAIDU,
      OPT_TRANS_TENCENT,
      OPT_TRANS_VOLCENGINE,
    ];

    // 获取已添加的API
    const transApis = setting?.transApis || {};
    const addedApis = Object.keys(transApis).filter(
      (translator) =>
        !builtinTranslators.includes(translator) &&
        translator.includes("_") && // 只显示带有时间戳的API，即用户明确添加的
        (transApis[translator].url ||
          transApis[translator].key ||
          transApis[translator].apiName)
    );

    // 获取API的基础类型（去除时间戳）
    const getApiBaseType = (apiId) => {
      return apiId.replace(/_\d+$/, "");
    };

    // 获取API的显示名称
    const getApiDisplayName = (translator) => {
      const baseType = getApiBaseType(translator);
      const apiConfig = transApis[translator];

      // 如果是内置API或者没有自定义名称，直接返回翻译器名称
      if (builtinTranslators.includes(translator) || !apiConfig?.apiName) {
        return translator;
      }

      // 如果是已添加的API且有自定义名称，返回"基础类型 (自定义名称)"
      return `${baseType} (${apiConfig.apiName})`;
    };

    // 合并内置API和已添加的API
    const availableTranslators = [...builtinTranslators, ...addedApis];

    return {
      translators: availableTranslators,
      getDisplayName: getApiDisplayName,
      isBuiltin: (translator) => builtinTranslators.includes(translator),
    };
  }, [setting]);
}
