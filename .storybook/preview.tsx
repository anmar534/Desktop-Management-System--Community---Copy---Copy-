import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/application/context/ThemeProvider';
import '../src/styles/globals.css';
import './storybook.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      element: '#storybook-root',
      disable: false,
      config: {},
      options: {
        checks: {
          'color-contrast': { options: { noScroll: true } },
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFFFFF' },
        { name: 'dark', value: '#030712' },
      ],
    },
    layout: 'padded',
  },
  
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div dir="rtl" className="storybook-wrapper">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'high-contrast', title: 'High Contrast', icon: 'contrast' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
