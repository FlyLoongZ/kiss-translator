import { useCallback } from "react";
import { DEFAULT_TRANS_APIS } from "../config";
import { useSetting } from "./Setting";

export function useApi(translator) {
  const { setting, updateSetting } = useSetting();
  const transApis = setting?.transApis || DEFAULT_TRANS_APIS;

  // 获取API的基础类型（去除时间戳）
  const getApiBaseType = (apiId) => {
    return apiId.replace(/_\d+$/, "");
  };

  const baseType = getApiBaseType(translator);

  const updateApi = useCallback(
    async (obj) => {
      const api = {
        ...DEFAULT_TRANS_APIS[baseType],
        ...(transApis[translator] || {}),
      };
      Object.assign(transApis, { [translator]: { ...api, ...obj } });
      await updateSetting({ transApis });
    },
    [translator, transApis, updateSetting, baseType]
  );

  const resetApi = useCallback(async () => {
    Object.assign(transApis, { [translator]: DEFAULT_TRANS_APIS[baseType] });
    await updateSetting({ transApis });
  }, [translator, transApis, updateSetting, baseType]);

  return {
    api: {
      ...DEFAULT_TRANS_APIS[baseType],
      ...(transApis[translator] || {}),
    },
    updateApi,
    resetApi,
  };
}
