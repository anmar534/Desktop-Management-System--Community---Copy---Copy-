import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from './tokens.config';

/**
 * نظام Typography
 * 
 * عرض شامل لجميع أحجام الخطوط، الأوزان، وارتفاعات الأسطر
 */
const TypographyShowcase = () => {
  return (
    <div className="space-y-12">
      {/* Font Sizes */}
      <section>
        <h2 className="text-2xl font-bold mb-6">أحجام الخطوط (Font Sizes)</h2>
        <div className="space-y-4">
          {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
            <div key={key} className="flex items-baseline gap-4 border-b border-gray-200 pb-2">
              <span className="font-mono text-sm text-gray-500 w-16">{key}</span>
              <span className="font-mono text-xs text-gray-400 w-20">{value}</span>
              <span style={{ fontSize: value }}>النص التجريبي - Sample Text</span>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section>
        <h2 className="text-2xl font-bold mb-6">أوزان الخطوط (Font Weights)</h2>
        <div className="space-y-4">
          {Object.entries(tokens.typography.fontWeight).map(([key, value]) => (
            <div key={key} className="flex items-baseline gap-4 border-b border-gray-200 pb-2">
              <span className="font-mono text-sm text-gray-500 w-24">{key}</span>
              <span className="font-mono text-xs text-gray-400 w-16">{value}</span>
              <span style={{ fontWeight: value }} className="text-lg">
                النص التجريبي - Sample Text
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Line Heights */}
      <section>
        <h2 className="text-2xl font-bold mb-6">ارتفاعات الأسطر (Line Heights)</h2>
        <div className="space-y-6">
          {Object.entries(tokens.typography.lineHeight).map(([key, value]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="font-mono text-sm text-gray-500">{key}</span>
                <span className="font-mono text-xs text-gray-400">{value}</span>
              </div>
              <p style={{ lineHeight: value }}>
                هذا نص تجريبي طويل يستخدم لعرض ارتفاع السطر. 
                يمكنك رؤية المسافة بين الأسطر بوضوح في هذا المثال.
                This is a sample text to demonstrate line height.
                You can clearly see the spacing between lines in this example.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Font Families */}
      <section>
        <h2 className="text-2xl font-bold mb-6">عائلات الخطوط (Font Families)</h2>
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Sans (Default)</h3>
            <p style={{ fontFamily: tokens.typography.fontFamily.sans }} className="text-lg">
              النص العربي - Arabic Text | English Text | 123456789
            </p>
            <code className="text-xs text-gray-500 mt-2 block">
              {tokens.typography.fontFamily.sans}
            </code>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Mono (Code)</h3>
            <p style={{ fontFamily: tokens.typography.fontFamily.mono }} className="text-lg">
              const message = "Hello World"; // Code Example
            </p>
            <code className="text-xs text-gray-500 mt-2 block">
              {tokens.typography.fontFamily.mono}
            </code>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Arabic (Specialized)</h3>
            <p style={{ fontFamily: tokens.typography.fontFamily.arabic }} className="text-lg">
              النص العربي بخط متخصص للغة العربية
            </p>
            <code className="text-xs text-gray-500 mt-2 block">
              {tokens.typography.fontFamily.arabic}
            </code>
          </div>
        </div>
      </section>

      {/* Typography Scale Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">أمثلة تطبيقية (Typography Scale)</h2>
        <div className="space-y-4">
          <h1 className="text-6xl font-bold">عنوان رئيسي - Heading 1</h1>
          <h2 className="text-5xl font-bold">عنوان ثانوي - Heading 2</h2>
          <h3 className="text-4xl font-semibold">عنوان ثالث - Heading 3</h3>
          <h4 className="text-3xl font-semibold">عنوان رابع - Heading 4</h4>
          <h5 className="text-2xl font-medium">عنوان خامس - Heading 5</h5>
          <h6 className="text-xl font-medium">عنوان سادس - Heading 6</h6>
          <p className="text-lg">نص كبير - Large Text</p>
          <p className="text-base">نص عادي - Regular Text</p>
          <p className="text-sm">نص صغير - Small Text</p>
          <p className="text-xs">نص صغير جداً - Extra Small Text</p>
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Typography',
  component: TypographyShowcase,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'نظام Typography الكامل يتضمن 12 حجم خط، 9 أوزان، و6 ارتفاعات أسطر',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TypographyShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * عرض Typography الكامل
 */
export const AllTypography: Story = {};
