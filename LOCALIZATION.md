# Localization Guide

This project uses [next-intl](https://next-intl-docs.vercel.app/) for internationalization (i18n) support.

## Supported Languages

- **English (en)** - Default
- **Hindi (hi)** - हिंदी

## Usage

### In Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  
  return <h1>{t('appName')}</h1>;
}
```

### In Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('nav');
  
  return <button>{t('dashboard')}</button>;
}
```

### Language Switcher

The `LanguageSwitcher` component is available in the dashboard navigation. Users can switch between English and Hindi, and their preference is saved in a cookie.

## Adding New Translations

1. Add the key-value pair to both `messages/en.json` and `messages/hi.json`
2. Use the translation key in your component using `useTranslations`

Example:

**messages/en.json:**
```json
{
  "mySection": {
    "myKey": "My English Text"
  }
}
```

**messages/hi.json:**
```json
{
  "mySection": {
    "myKey": "मेरा हिंदी टेक्स्ट"
  }
}
```

**Component:**
```tsx
const t = useTranslations('mySection');
return <p>{t('myKey')}</p>;
```

## File Structure

```
web/
├── messages/
│   ├── en.json      # English translations
│   └── hi.json      # Hindi translations
├── src/
│   ├── i18n/
│   │   ├── config.ts    # Locale configuration
│   │   └── request.ts   # Request configuration
│   └── components/
│       └── language-switcher.tsx  # Language switcher UI
```

## Future Enhancements

- Full locale-based routing (`/en/...`, `/hi/...`)
- Browser language detection
- More languages (Bengali, Tamil, Telugu, etc.)
- RTL support for languages that require it

