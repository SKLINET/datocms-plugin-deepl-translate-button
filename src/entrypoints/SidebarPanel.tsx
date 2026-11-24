import { useState } from 'react';
import { Button, Canvas } from 'datocms-react-ui';
import type { RenderItemFormSidebarPanelCtx } from 'datocms-plugin-sdk';
import type { PluginParams } from '../utils/deepl';
import {
  translateStructuredText,
  translateStringField,
  translateArrayField,
} from '../utils/deepl';

type Props = {
  ctx: RenderItemFormSidebarPanelCtx;
};

type ArrayItem = Record<string, unknown> & { itemId?: unknown };

export default function SidebarPanel({ ctx }: Props) {
  const [isTranslating, setIsTranslating] = useState(false);

  const params = ctx.plugin.attributes.parameters as PluginParams;
  const allLocales = ctx.site.attributes.locales;
  const currentLocale = ctx.locale;
  const targetLocales = allLocales.filter((l) => l !== currentLocale);

  const localizedFields = ctx.itemType.relationships.fields.data
    .map(({ id }) => ctx.fields[id])
    .filter((f): f is NonNullable<typeof f> => f !== undefined && f !== null && f.attributes.localized);

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      for (const field of localizedFields) {
        const fieldApiKey = field.attributes.api_key;
        const fieldType = field.attributes.field_type;
        const formValue = ctx.formValues[fieldApiKey] as Record<string, unknown> | null;
        const sourceValue = formValue?.[currentLocale];

        if (fieldType === 'structured_text') {
          // formValues stores structured_text in Slate.js format (array of nodes),
          // not in DAST format — sourceValue is already the Slate array
          await translateStructuredText(
            sourceValue,
            fieldApiKey,
            currentLocale,
            targetLocales,
            params,
            ctx.setFieldValue.bind(ctx),
          );
          continue;
        }

        if (typeof sourceValue === 'string') {
          await translateStringField(
            sourceValue,
            fieldApiKey,
            currentLocale,
            targetLocales,
            params,
            ctx.setFieldValue.bind(ctx),
          );
          continue;
        }

        if (Array.isArray(sourceValue)) {
          await translateArrayField(
            sourceValue as ArrayItem[],
            fieldApiKey,
            currentLocale,
            targetLocales,
            params,
            ctx.setFieldValue.bind(ctx),
          );
        }
      }
    } catch (e) {
      console.error('[DeepL] Translation error:', e);
      ctx.alert('Translation failed. Please check your DeepL API key and try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const buttonLabel = params.label || 'Translate with DeepL';
  const isDisabled = isTranslating || targetLocales.length === 0 || localizedFields.length === 0;

  return (
    <Canvas ctx={ctx}>
      <Button
        onClick={handleTranslate}
        disabled={isDisabled}
        buttonType="primary"
        buttonSize="s"
        fullWidth
      >
        {isTranslating ? 'Translating…' : buttonLabel}
      </Button>
    </Canvas>
  );
}
