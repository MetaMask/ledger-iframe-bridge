# Metamask Ledger App

Dedicated to host metamask ledger app that gets deployed on github pages.

## Getting Started

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Internationalization (i18n)

This project supports multiple languages through [react-i18next](https://react.i18next.com/) and uses [Crowdin](https://crowdin.com/) for translation management.

### Supported Languages

- English (en) - Default/source language
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)

### Translation Workflow

1. **Development**: Use the `t()` function from `react-i18next` for text that needs translation:
   ```jsx
   import { useTranslation } from 'react-i18next';

   function MyComponent() {
     const { t } = useTranslation();
     return <div>{t('my.translation.key')}</div>;
   }
   ```

2. **Extract Messages**: Update translation source files:
   ```bash
   yarn i18n:extract
   ```

3. **Upload to Crowdin**: Push source strings to Crowdin for translation:
   ```bash
   yarn i18n:upload
   ```

4. **Download Translations**: After translations are completed in Crowdin:
   ```bash
   yarn i18n:download
   ```

### Adding a New Language

1. Add the language code to the supported languages list in `src/i18n.js`
2. Create the corresponding folder in `src/locales/`
3. Update the Crowdin configuration in `crowdin.yml` if needed

### Language Switching

The application includes a language switcher component that allows users to change their preferred language. The selected language is stored in localStorage.
