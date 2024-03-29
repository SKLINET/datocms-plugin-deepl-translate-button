import './style.css';
import toQueryString from 'to-querystring';

window.DatoCmsPlugin.init((plugin) => {
  plugin.startAutoResizer();
  const localesToTranslate = plugin.site.attributes.locales;
  const currentLocale = plugin.locale || 'cs';
  const index = localesToTranslate.indexOf(currentLocale);
  if (index > -1) {
    localesToTranslate.splice(index, 1);
  }
  const localizedFields = [];
  plugin.itemType.relationships.fields.data.forEach((link) => {
    if (plugin.fields[link.id].attributes.localized) {
      localizedFields.push(plugin.fields[link.id]);
    }
  });

  const translate = (
    text,
    field,
    composedField = null,
    composedIndex = null,
    composedValue = null,
  ) => Promise.all(
    localesToTranslate.map((locale) => {
      if (!text) {
        plugin.setFieldValue(field, locale, '');
        return Promise.resolve();
      }

      const authKey = plugin.parameters.global.deepLAuthenticationKey;
      const { postRequestUrl } = plugin.parameters.global;
      const parameters = {
        source_lang: currentLocale.substring(0, 2).toUpperCase(),
        target_lang: locale.substring(0, 2).toUpperCase(),
        tag_handling: 'html',
        text,
        ignore_tags: 'img,iframe',
        auth_key: authKey,
      };

      if (plugin.parameters.global.developmentMode) {
        console.log(`Fetching '${locale}' translation for '${text}' and write to field '${field}'`);
      }

      let apiUrl = '';
      if (postRequestUrl) {
        apiUrl = plugin.parameters.global.useFreeDeeplApi ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate';
        parameters.url = apiUrl;
      } else {
        const qs = toQueryString(parameters);
        apiUrl = plugin.parameters.global.useFreeDeeplApi ? `https://api-free.deepl.com/v2/translate?${qs}` : `https://api.deepl.com/v2/translate?${qs}`;
      }

      const config = postRequestUrl ? {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      } : {};

      return fetch(postRequestUrl || apiUrl, config)
        .then((res) => res.json())
        .then((response) => {
          const trans = response.translations
            .map((translation) => translation.text)
            .join(' ');
          if (composedField && composedValue) {
            const newVal = composedValue;
            newVal[composedIndex][composedField] = trans;
            plugin.setFieldValue(field, locale, newVal);
          } else {
            plugin.setFieldValue(field, locale, trans);
          }
        });
    }),
  );

  const container = document.createElement('div');
  container.classList.add('container');

  const { label } = plugin.parameters.global;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'DatoCMS-button DatoCMS-button--primary';
  button.onclick = (e) => {
    localizedFields?.map((f) => {
      const field = f?.attributes?.api_key;
      let sourceValue = plugin.getFieldValue(field, currentLocale);
      if (typeof sourceValue !== 'string') {
        if (Array.isArray(sourceValue)) {
          const vals = [];
          sourceValue.map((ss) => {
            const { itemId, ...rest } = ss;
            vals.push(rest);
            return ss;
          });
          sourceValue = vals;
          return sourceValue.map((sv, i) => Object.keys(sv)?.map((p) => {
            if (typeof sv[p] === 'string' && sv[p].match(/^[0-9]+$/) === null) {
              return translate(sv[p], field, p, i, sourceValue);
            }
            return p;
          }));
        }
        return f;
      }
      return translate(sourceValue, field);
    });
    e.preventDefault();
    return false;
  };
  button.textContent = label || 'Přeložit';
  container.appendChild(button);

  document.body.appendChild(container);
});
