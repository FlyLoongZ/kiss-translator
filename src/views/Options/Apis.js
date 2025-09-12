import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import {
  OPT_TRANS_ALL,
  OPT_TRANS_MICROSOFT,
  OPT_TRANS_DEEPL,
  OPT_TRANS_DEEPLX,
  OPT_TRANS_DEEPLFREE,
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
  OPT_TRANS_NIUTRANS,
  URL_NIUTRANS_REG,
  DEFAULT_FETCH_LIMIT,
  DEFAULT_FETCH_INTERVAL,
  DEFAULT_HTTP_TIMEOUT,
} from "../../config";
import { useState, useEffect } from "react";
import { useI18n } from "../../hooks/I18n";
import { useSetting } from "../../hooks/Setting";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Alert from "@mui/material/Alert";
import { useAlert } from "../../hooks/Alert";
import { useApi } from "../../hooks/Api";
import { apiTranslate } from "../../apis";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { limitNumber, limitFloat } from "../../libs/utils";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

function TestButton({ translator, api }) {
  const i18n = useI18n();
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const handleApiTest = async () => {
    try {
      setLoading(true);
      const [text] = await apiTranslate({
        translator,
        text: "hello world",
        fromLang: "en",
        toLang: "zh-CN",
        apiSetting: api,
        useCache: false,
      });
      if (!text) {
        throw new Error("empty result");
      }
      alert.success(i18n("test_success"));
    } catch (err) {
      // alert.error(`${i18n("test_failed")}: ${err.message}`);
      let msg = err.message;
      try {
        msg = JSON.stringify(JSON.parse(err.message), null, 2);
      } catch (err) {
        // skip
      }
      alert.error(
        <>
          <div>{i18n("test_failed")}</div>
          {msg === err.message ? (
            <div
              style={{
                maxWidth: 400,
              }}
            >
              {msg}
            </div>
          ) : (
            <pre
              style={{
                maxWidth: 400,
                overflow: "auto",
              }}
            >
              {msg}
            </pre>
          )}
        </>
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      size="small"
      variant="contained"
      onClick={handleApiTest}
      loading={loading}
    >
      {i18n("click_test")}
    </LoadingButton>
  );
}

function ApiFields({ translator, api, updateApi, resetApi }) {
  const i18n = useI18n();
  const {
    url = "",
    key = "",
    model = "",
    systemPrompt = "",
    userPrompt = "",
    customHeader = "",
    customBody = "",
    think = false,
    thinkIgnore = "",
    fetchLimit = DEFAULT_FETCH_LIMIT,
    fetchInterval = DEFAULT_FETCH_INTERVAL,
    httpTimeout = DEFAULT_HTTP_TIMEOUT,
    dictNo = "",
    memoryNo = "",
    reqHook = "",
    resHook = "",
    temperature = 0,
    maxTokens = 256,
    apiName = "",
    isDisabled = false,
  } = api;

  const handleChange = (e) => {
    let { name, value } = e.target;
    switch (name) {
      case "fetchLimit":
        value = limitNumber(value, 1, 100);
        break;
      case "fetchInterval":
        value = limitNumber(value, 0, 5000);
        break;
      case "httpTimeout":
        value = limitNumber(value, 5000, 30000);
        break;
      case "temperature":
        value = limitFloat(value, 0, 2);
        break;
      case "maxTokens":
        value = limitNumber(value, 0, 2 ** 15);
        break;
      default:
    }
    updateApi({
      [name]: value,
    });
  };

  const builtinTranslators = [
    OPT_TRANS_MICROSOFT,
    OPT_TRANS_DEEPLFREE,
    OPT_TRANS_BAIDU,
    OPT_TRANS_TENCENT,
    OPT_TRANS_VOLCENGINE,
  ];

  const mulkeysTranslators = [
    OPT_TRANS_DEEPL,
    OPT_TRANS_OPENAI,
    OPT_TRANS_GEMINI,
    OPT_TRANS_CLAUDE,
    OPT_TRANS_CLOUDFLAREAI,
    OPT_TRANS_OLLAMA,
    OPT_TRANS_OPENROUTER,
    OPT_TRANS_NIUTRANS,
    OPT_TRANS_CUSTOMIZE,
  ];

  const keyHelper =
    translator === OPT_TRANS_NIUTRANS ? (
      <>
        {i18n("mulkeys_help")}
        <Link href={URL_NIUTRANS_REG} target="_blank">
          {i18n("reg_niutrans")}
        </Link>
      </>
    ) : mulkeysTranslators.includes(translator) ? (
      i18n("mulkeys_help")
    ) : (
      ""
    );

  return (
    <Stack spacing={3}>
      <TextField
        size="small"
        label={i18n("api_name")}
        name="apiName"
        value={apiName}
        onChange={handleChange}
      />

      {!builtinTranslators.includes(translator) && (
        <>
          <TextField
            size="small"
            label={"URL"}
            name="url"
            value={url}
            onChange={handleChange}
            multiline={translator === OPT_TRANS_DEEPLX}
            maxRows={10}
            helperText={
              translator === OPT_TRANS_DEEPLX ? i18n("mulkeys_help") : ""
            }
          />
          <TextField
            size="small"
            label={"KEY"}
            name="key"
            value={key}
            onChange={handleChange}
            multiline={mulkeysTranslators.includes(translator)}
            maxRows={10}
            helperText={keyHelper}
          />
        </>
      )}

      {(translator === OPT_TRANS_OPENAI ||
        translator === OPT_TRANS_OLLAMA ||
        translator === OPT_TRANS_CLAUDE ||
        translator === OPT_TRANS_OPENROUTER ||
        translator === OPT_TRANS_GEMINI) && (
        <>
          <TextField
            size="small"
            label={"MODEL"}
            name="model"
            value={model}
            onChange={handleChange}
          />
          <TextField
            size="small"
            label={"SYSTEM PROMPT"}
            name="systemPrompt"
            value={systemPrompt}
            onChange={handleChange}
            multiline
            maxRows={10}
          />
          <TextField
            size="small"
            label={"USER PROMPT"}
            name="userPrompt"
            value={userPrompt}
            onChange={handleChange}
            multiline
            maxRows={10}
          />
          <TextField
            size="small"
            label={i18n("custom_header")}
            name="customHeader"
            value={customHeader}
            onChange={handleChange}
            multiline
            maxRows={10}
            helperText={i18n("custom_header_help")}
          />
          <TextField
            size="small"
            label={i18n("custom_body")}
            name="customBody"
            value={customBody}
            onChange={handleChange}
            multiline
            maxRows={10}
            helperText={i18n("custom_body_help")}
          />
        </>
      )}

      {translator === OPT_TRANS_OLLAMA && (
        <>
          <TextField
            select
            size="small"
            name="think"
            value={think}
            label={i18n("if_think")}
            onChange={handleChange}
          >
            <MenuItem value={false}>{i18n("nothink")}</MenuItem>
            <MenuItem value={true}>{i18n("think")}</MenuItem>
          </TextField>
          <TextField
            size="small"
            label={i18n("think_ignore")}
            name="thinkIgnore"
            value={thinkIgnore}
            onChange={handleChange}
          />
        </>
      )}

      {(translator === OPT_TRANS_OPENAI ||
        translator === OPT_TRANS_CLAUDE ||
        translator === OPT_TRANS_OPENROUTER ||
        translator === OPT_TRANS_GEMINI) && (
        <>
          <TextField
            size="small"
            label={"Temperature"}
            type="number"
            name="temperature"
            value={temperature}
            onChange={handleChange}
          />
          <TextField
            size="small"
            label={"Max Tokens"}
            type="number"
            name="maxTokens"
            value={maxTokens}
            onChange={handleChange}
          />
        </>
      )}

      {translator === OPT_TRANS_NIUTRANS && (
        <>
          <TextField
            size="small"
            label={"DictNo"}
            name="dictNo"
            value={dictNo}
            onChange={handleChange}
          />
          <TextField
            size="small"
            label={"MemoryNo"}
            name="memoryNo"
            value={memoryNo}
            onChange={handleChange}
          />
        </>
      )}

      {translator === OPT_TRANS_CUSTOMIZE && (
        <>
          <TextField
            size="small"
            label={"Request Hook"}
            name="reqHook"
            value={reqHook}
            onChange={handleChange}
            multiline
            maxRows={10}
          />
          <TextField
            size="small"
            label={"Response Hook"}
            name="resHook"
            value={resHook}
            onChange={handleChange}
            multiline
            maxRows={10}
          />
        </>
      )}

      <TextField
        size="small"
        label={i18n("fetch_limit")}
        type="number"
        name="fetchLimit"
        value={fetchLimit}
        onChange={handleChange}
      />

      <TextField
        size="small"
        label={i18n("fetch_interval")}
        type="number"
        name="fetchInterval"
        value={fetchInterval}
        onChange={handleChange}
      />

      <TextField
        size="small"
        label={i18n("http_timeout")}
        type="number"
        name="httpTimeout"
        defaultValue={httpTimeout}
        onChange={handleChange}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            name="isDisabled"
            checked={isDisabled}
            onChange={() => {
              updateApi({ isDisabled: !isDisabled });
            }}
          />
        }
        label={i18n("is_disabled")}
      />

      <Stack direction="row" spacing={2}>
        <TestButton translator={translator} api={api} />
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            resetApi();
          }}
        >
          {i18n("restore_default")}
        </Button>
      </Stack>

      {translator === OPT_TRANS_CUSTOMIZE && (
        <pre>{i18n("custom_api_help")}</pre>
      )}
    </Stack>
  );
}

function ApiAccordion({ translator }) {
  const [expanded, setExpanded] = useState(false);
  const { api, updateApi, resetApi } = useApi(translator);

  const handleChange = (e) => {
    setExpanded((pre) => !pre);
  };

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>
          {api.apiName ? `${translator} (${api.apiName})` : translator}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {expanded && (
          <ApiFields
            translator={translator}
            api={api}
            updateApi={updateApi}
            resetApi={resetApi}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function ApiAccordionWithRemove({ translator, baseType, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const { api, updateApi, resetApi } = useApi(translator);

  const handleChange = (e) => {
    setExpanded((pre) => !pre);
  };

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <Typography>
            {api.apiName ? `${baseType} (${api.apiName})` : baseType}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(translator);
            }}
          >
            <RemoveIcon />
          </IconButton>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {expanded && (
          <ApiFields
            translator={baseType}
            api={api}
            updateApi={updateApi}
            resetApi={resetApi}
          />
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export default function Apis() {
  const i18n = useI18n();
  const { setting, updateSetting } = useSetting();
  const [selectedApi, setSelectedApi] = useState("");
  const [addedApis, setAddedApis] = useState([]);

  const builtinTranslators = [
    OPT_TRANS_MICROSOFT,
    OPT_TRANS_DEEPLFREE,
    OPT_TRANS_BAIDU,
    OPT_TRANS_TENCENT,
    OPT_TRANS_VOLCENGINE,
  ];

  const availableApis = OPT_TRANS_ALL.filter(
    (translator) => !builtinTranslators.includes(translator)
  );

  // 初始化已添加的API列表
  useEffect(() => {
    const transApis = setting?.transApis || {};
    // 只显示用户明确添加的API（带有时间戳的）
    const configuredApis = Object.keys(transApis).filter(
      (translator) =>
        !builtinTranslators.includes(translator) &&
        translator.includes("_") && // 只显示带有时间戳的API，即用户明确添加的
        (transApis[translator].url ||
          transApis[translator].key ||
          transApis[translator].apiName)
    );
    setAddedApis(configuredApis);
  }, [setting]);

  const handleAddApi = () => {
    if (selectedApi) {
      // 为新API生成唯一标识符
      const newApiId = `${selectedApi}_${Date.now()}`;
      setAddedApis([...addedApis, newApiId]);

      // 初始化新API的配置
      const defaultConfig = setting?.transApis?.[selectedApi] || {};
      // 计算相同类型API的数量，用于命名
      const sameTypeCount =
        addedApis.filter((api) => api.startsWith(selectedApi)).length + 1;
      updateSetting({
        transApis: {
          ...setting?.transApis,
          [newApiId]: {
            ...defaultConfig,
            apiName: `${selectedApi} ${sameTypeCount}`,
          },
        },
      });

      setSelectedApi("");
    }
  };

  const handleRemoveApi = (translator) => {
    setAddedApis(addedApis.filter((api) => api !== translator));

    // 从设置中移除API配置
    const newTransApis = { ...setting?.transApis };
    delete newTransApis[translator];
    updateSetting({ transApis: newTransApis });
  };

  // 获取API的基础类型（去除时间戳）
  const getApiBaseType = (apiId) => {
    return apiId.replace(/_\d+$/, "");
  };

  // 获取未添加的API列表
  const getUnaddedApis = () => {
    // 允许无限添加相同类型的API，所以返回所有可用的API
    return availableApis;
  };

  return (
    <Box>
      <Stack spacing={3}>
        <Alert severity="info">{i18n("about_api")}</Alert>

        {/* 内置翻译器 */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {i18n("builtin_translators")}
          </Typography>
          {builtinTranslators.map((translator) => (
            <ApiAccordion key={translator} translator={translator} />
          ))}
        </Box>

        {/* 添加其他API */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {i18n("add_other_apis")}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" fullWidth>
              <InputLabel>{i18n("select_api")}</InputLabel>
              <Select
                value={selectedApi}
                label={i18n("select_api")}
                onChange={(e) => setSelectedApi(e.target.value)}
              >
                <MenuItem value="">{i18n("add_translation_api")}</MenuItem>
                {getUnaddedApis().map((translator) => (
                  <MenuItem key={translator} value={translator}>
                    {translator}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              color="primary"
              onClick={handleAddApi}
              disabled={!selectedApi}
            >
              <AddIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* 已添加的API */}
        {addedApis.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {i18n("added_apis")}
            </Typography>
            <Stack spacing={1}>
              {addedApis.map((translator) => (
                <ApiAccordionWithRemove
                  key={translator}
                  translator={translator}
                  baseType={getApiBaseType(translator)}
                  onRemove={handleRemoveApi}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
