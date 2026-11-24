import { connect } from 'datocms-plugin-sdk';
import { render } from './utils/render';
import SidebarPanel from './entrypoints/SidebarPanel';
import ConfigScreen from './entrypoints/ConfigScreen';
import type { PluginParams } from './utils/deepl';

connect({
  itemFormSidebarPanels(itemType, ctx) {
    const locales = ctx.site.attributes.locales;
    if (locales.length <= 1) return [];

    const params = ctx.plugin.attributes.parameters as PluginParams;
    const label = params.label || 'Translate with DeepL';

    // Only show the panel on item types that have at least one localized field
    const hasLocalizedFields = itemType.relationships.fields.data.some(
      ({ id }) => ctx.fields[id]?.attributes.localized,
    );
    if (!hasLocalizedFields) return [];

    return [
      {
        id: 'deeplTranslate',
        label,
        startOpen: true,
      },
    ];
  },

  renderItemFormSidebarPanel(_sidebarPanelId, ctx) {
    render(<SidebarPanel ctx={ctx} />);
  },

  renderConfigScreen(ctx) {
    render(<ConfigScreen ctx={ctx} />);
  },

  async onBoot(ctx) {
    if (ctx.plugin.attributes.parameters.migratedFromLegacyPlugin) return;
    await ctx.updatePluginParameters({
      ...ctx.plugin.attributes.parameters,
      migratedFromLegacyPlugin: true,
    });
  },
});
