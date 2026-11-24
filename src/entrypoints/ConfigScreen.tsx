import { useState } from 'react';
import {
  Button,
  Canvas,
  Form,
  TextField,
  SwitchField,
  FieldGroup,
} from 'datocms-react-ui';
import type { RenderConfigScreenCtx } from 'datocms-plugin-sdk';
import type { PluginParams } from '../utils/deepl';

type Props = {
  ctx: RenderConfigScreenCtx;
};

export default function ConfigScreen({ ctx }: Props) {
  const saved = ctx.plugin.attributes.parameters as Partial<PluginParams>;

  const [params, setParams] = useState<PluginParams>({
    deepLAuthenticationKey: saved.deepLAuthenticationKey ?? '',
    useFreeDeeplApi: saved.useFreeDeeplApi ?? false,
    postRequestUrl: saved.postRequestUrl ?? '',
    label: saved.label ?? 'Translate with DeepL',
    developmentMode: saved.developmentMode ?? false,
  });

  const handleSave = async () => {
    await ctx.updatePluginParameters(params);
    ctx.notice('Settings saved!');
  };

  return (
    <Canvas ctx={ctx}>
      <Form onSubmit={handleSave}>
        <FieldGroup>
          <TextField
            name="deepLAuthenticationKey"
            id="deepLAuthenticationKey"
            label="DeepL Authentication Key"
            hint="Your DeepL API key (see https://www.deepl.com/docs-api/accessing-the-api/authentication)"
            required
            value={params.deepLAuthenticationKey ?? ''}
            onChange={(val) => setParams((p) => ({ ...p, deepLAuthenticationKey: val }))}
          />
          <SwitchField
            name="useFreeDeeplApi"
            id="useFreeDeeplApi"
            label="Use free DeepL API?"
            hint="Leave this off to use the paid DeepL Pro API (api.deepl.com) with the key above. Turn it on only for a DeepL Free key."
            value={params.useFreeDeeplApi ?? false}
            onChange={(val) => setParams((p) => ({ ...p, useFreeDeeplApi: val }))}
          />
          <TextField
            name="postRequestUrl"
            id="postRequestUrl"
            label="POST request URL"
            hint="Optional: URL for a custom proxy POST request"
            value={params.postRequestUrl ?? ''}
            onChange={(val) => setParams((p) => ({ ...p, postRequestUrl: val }))}
          />
          <TextField
            name="label"
            id="label"
            label="Button label"
            hint="Label of the translate button shown in the sidebar"
            value={params.label ?? ''}
            onChange={(val) => setParams((p) => ({ ...p, label: val }))}
          />
          <SwitchField
            name="developmentMode"
            id="developmentMode"
            label="Development mode"
            hint="Shows debug messages in the browser console"
            value={params.developmentMode ?? false}
            onChange={(val) => setParams((p) => ({ ...p, developmentMode: val }))}
          />
        </FieldGroup>
        <Button type="submit" buttonType="primary">
          Save settings
        </Button>
      </Form>
    </Canvas>
  );
}
