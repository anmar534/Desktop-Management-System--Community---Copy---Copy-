import type { Meta, StoryObj } from '@storybook/react'
import { tokens } from './tokens.config'

/**
 * نظام Spacing
 *
 * عرض شامل لجميع قيم المسافات (Spacing Scale)
 */
const SpacingShowcase = () => {
  return (
    <div className="space-y-12">
      {/* Spacing Scale */}
      <section>
        <h2 className="text-2xl font-bold mb-6">مقياس المسافات (Spacing Scale)</h2>
        <p className="text-muted-foreground mb-6">
          نظام المسافات مبني على وحدة أساسية 4px (0.25rem)
        </p>

        <div className="space-y-3">
          {Object.entries(tokens.spacing).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="font-mono text-sm text-muted-foreground w-16">{key}</span>
              <span className="font-mono text-xs text-muted-foreground w-24">{value}</span>
              <div className="bg-primary h-8" style={{ width: value }} title={value} />
              <span className="text-sm text-muted-foreground">
                {value === '0' ? '0px' : value === '1px' ? '1px' : `${parseFloat(value) * 16}px`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Spacing Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">أمثلة تطبيقية (Practical Examples)</h2>

        <div className="space-y-8">
          {/* Padding Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Padding (الحشوة الداخلية)</h3>
            <div className="grid grid-cols-4 gap-4">
              {['2', '4', '6', '8'].map((size) => (
                <div key={size} className="border border-border rounded">
                  <div
                    className="bg-primary/10 border border-primary rounded"
                    style={{ padding: tokens.spacing[size as keyof typeof tokens.spacing] }}
                  >
                    <div className="bg-card border border-primary text-center text-sm">
                      p-{size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Margin Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Margin (الهامش الخارجي)</h3>
            <div className="grid grid-cols-4 gap-4">
              {['2', '4', '6', '8'].map((size) => (
                <div key={size} className="border border-border rounded p-4">
                  <div className="bg-primary/10 border border-primary">
                    <div
                      className="bg-card border border-primary text-center text-sm"
                      style={{ margin: tokens.spacing[size as keyof typeof tokens.spacing] }}
                    >
                      m-{size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gap Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gap (المسافة بين العناصر)</h3>
            <div className="grid grid-cols-2 gap-4">
              {['2', '4', '6', '8'].map((size) => (
                <div key={size} className="border border-border rounded p-4">
                  <div
                    className="flex"
                    style={{ gap: tokens.spacing[size as keyof typeof tokens.spacing] }}
                  >
                    <div className="bg-primary w-12 h-12 rounded" />
                    <div className="bg-primary w-12 h-12 rounded" />
                    <div className="bg-primary w-12 h-12 rounded" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center">gap-{size}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Spacing */}
      <section>
        <h2 className="text-2xl font-bold mb-6">المسافات الشائعة (Common Spacings)</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-2">Tight Spacing</h4>
            <p className="text-sm text-muted-foreground mb-4">للعناصر المتقاربة</p>
            <div className="space-y-1">
              <div className="bg-muted h-8 rounded" />
              <div className="bg-muted h-8 rounded" />
              <div className="bg-muted h-8 rounded" />
            </div>
            <code className="text-xs text-muted-foreground mt-2 block">
              gap: {tokens.spacing[1]}
            </code>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-2">Normal Spacing</h4>
            <p className="text-sm text-muted-foreground mb-4">للاستخدام العام</p>
            <div className="space-y-4">
              <div className="bg-muted h-8 rounded" />
              <div className="bg-muted h-8 rounded" />
              <div className="bg-muted h-8 rounded" />
            </div>
            <code className="text-xs text-muted-foreground mt-2 block">
              gap: {tokens.spacing[4]}
            </code>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-2">Loose Spacing</h4>
            <p className="text-sm text-muted-foreground mb-4">للأقسام المنفصلة</p>
            <div className="space-y-8">
              <div className="bg-muted h-8 rounded" />
              <div className="bg-muted h-8 rounded" />
              <div className="bg-muted h-8 rounded" />
            </div>
            <code className="text-xs text-muted-foreground mt-2 block">
              gap: {tokens.spacing[8]}
            </code>
          </div>
        </div>
      </section>
    </div>
  )
}

const meta = {
  title: 'Design System/Spacing',
  component: SpacingShowcase,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'نظام Spacing الكامل مبني على وحدة 4px ويتضمن 50 قيمة مختلفة',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SpacingShowcase>

export default meta
type Story = StoryObj<typeof meta>

/**
 * عرض Spacing الكامل
 */
export const AllSpacing: Story = {}
