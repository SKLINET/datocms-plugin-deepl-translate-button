export type PluginParams = {
  deepLAuthenticationKey?: string;
  useFreeDeeplApi?: boolean;
  postRequestUrl?: string;
  label?: string;
  developmentMode?: boolean;
};

type TranslationResponse = {
  translations: Array<{ text: string }>;
};

/**
 * Slate.js text node — has a `text` property but no `type`.
 * Marks (bold, italic, highlight, …) are stored as boolean keys.
 */
type SlateTextNode = {
  text: string;
  [mark: string]: unknown;
};

/**
 * Slate.js non-text node — has a `type` and a `children` array.
 */
type SlateNonTextNode = {
  type: string;
  children: SlateNode[];
  [key: string]: unknown;
};

type SlateNode = SlateTextNode | SlateNonTextNode;

function isSlateTextNode(node: unknown): node is SlateTextNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'text' in node &&
    typeof (node as Record<string, unknown>).text === 'string' &&
    !('type' in node)
  );
}

function buildRequest(
  text: string,
  currentLocale: string,
  targetLocale: string,
  params: PluginParams,
): { url: string; config: RequestInit } {
  const { deepLAuthenticationKey: authKey, postRequestUrl, useFreeDeeplApi } = params;

  const baseParams: Record<string, string> = {
    source_lang: currentLocale.substring(0, 2).toUpperCase(),
    target_lang: targetLocale.substring(0, 2).toUpperCase(),
    tag_handling: 'html',
    text,
    ignore_tags: 'img,iframe',
    auth_key: authKey ?? '',
  };

  if (postRequestUrl) {
    const apiUrl = useFreeDeeplApi
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';
    const config: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...baseParams, url: apiUrl }),
    };
    return { url: postRequestUrl, config };
  }

  const qs = new URLSearchParams(baseParams).toString();
  const apiUrl = useFreeDeeplApi
    ? `https://api-free.deepl.com/v2/translate?${qs}`
    : `https://api.deepl.com/v2/translate?${qs}`;
  return { url: apiUrl, config: {} };
}

export async function fetchTranslation(
  text: string,
  currentLocale: string,
  targetLocale: string,
  params: PluginParams,
): Promise<string> {
  if (!text || !text.trim()) return text;
  const { url, config } = buildRequest(text, currentLocale, targetLocale, params);
  const res = await fetch(url, config);
  const data: TranslationResponse = await res.json();
  return data.translations.map((t) => t.text).join(' ');
}

/**
 * Recursively translates a Slate.js node tree.
 *
 * ctx.formValues stores structured_text fields in Slate format, NOT DAST:
 *   - Text nodes: { text: "Hello", bold: true }   (no `type`)
 *   - Non-text nodes: { type: "paragraph", children: [...] }
 */
async function translateSlateNode(
  node: SlateNode,
  currentLocale: string,
  targetLocale: string,
  params: PluginParams,
): Promise<SlateNode> {
  if (isSlateTextNode(node)) {
    if (!node.text.trim()) return { ...node };
    const translated = await fetchTranslation(node.text, currentLocale, targetLocale, params);
    return { ...node, text: translated };
  }

  const nonText = node as SlateNonTextNode;
  if (Array.isArray(nonText.children) && nonText.children.length > 0) {
    const translatedChildren = await Promise.all(
      nonText.children.map((child) =>
        translateSlateNode(child, currentLocale, targetLocale, params),
      ),
    );
    return { ...nonText, children: translatedChildren };
  }

  return { ...node };
}

export type SetFieldValue = (path: string, value: unknown) => Promise<void>;

/**
 * Translates a structured_text field.
 *
 * Reads from ctx.formValues which stores the value in Slate.js format
 * (an array of root-level Slate nodes, without a wrapping root/schema node).
 */
export async function translateStructuredText(
  slateValue: unknown,
  fieldApiKey: string,
  currentLocale: string,
  targetLocales: string[],
  params: PluginParams,
  setFieldValue: SetFieldValue,
): Promise<void> {
  if (!Array.isArray(slateValue) || slateValue.length === 0) return;

  await Promise.all(
    targetLocales.map(async (locale) => {
      if (params.developmentMode) {
        console.log(
          `[DeepL] Fetching '${locale}' structured_text translation for field '${fieldApiKey}'`,
        );
      }
      const translatedSlate = await Promise.all(
        (slateValue as SlateNode[]).map((node) =>
          translateSlateNode(node, currentLocale, locale, params),
        ),
      );
      await setFieldValue(`${fieldApiKey}.${locale}`, translatedSlate);
    }),
  );
}

export async function translateStringField(
  text: string,
  fieldApiKey: string,
  currentLocale: string,
  targetLocales: string[],
  params: PluginParams,
  setFieldValue: SetFieldValue,
): Promise<void> {
  await Promise.all(
    targetLocales.map(async (locale) => {
      if (!text) {
        await setFieldValue(`${fieldApiKey}.${locale}`, '');
        return;
      }
      if (params.developmentMode) {
        console.log(
          `[DeepL] Fetching '${locale}' translation for '${text}' and write to field '${fieldApiKey}'`,
        );
      }
      const translated = await fetchTranslation(text, currentLocale, locale, params);
      await setFieldValue(`${fieldApiKey}.${locale}`, translated);
    }),
  );
}

type ArrayItem = Record<string, unknown> & { itemId?: unknown };

export async function translateArrayField(
  sourceArray: ArrayItem[],
  fieldApiKey: string,
  currentLocale: string,
  targetLocales: string[],
  params: PluginParams,
  setFieldValue: SetFieldValue,
): Promise<void> {
  // Strip itemId from each array item (same as original logic)
  const cleanedValues = sourceArray.map(({ itemId: _itemId, ...rest }) => rest);

  await Promise.all(
    targetLocales.map(async (locale) => {
      const translatedArray = await Promise.all(
        cleanedValues.map(async (item, i) => {
          const translatedItem: Record<string, unknown> = {};
          await Promise.all(
            Object.keys(item).map(async (prop) => {
              const val = item[prop];
              if (typeof val === 'string' && val.match(/^[0-9]+$/) === null) {
                if (params.developmentMode) {
                  console.log(
                    `[DeepL] Fetching '${locale}' translation for array item ${i}.${prop} in '${fieldApiKey}'`,
                  );
                }
                translatedItem[prop] = await fetchTranslation(val, currentLocale, locale, params);
              } else {
                translatedItem[prop] = val;
              }
            }),
          );
          return translatedItem;
        }),
      );
      await setFieldValue(`${fieldApiKey}.${locale}`, translatedArray);
    }),
  );
}
