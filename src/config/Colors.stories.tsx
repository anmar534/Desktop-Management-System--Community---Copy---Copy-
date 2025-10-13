import type { Meta, StoryObj } from '@storybook/react';
import { tokens } from './tokens.config';

/**
 * نظام الألوان (Design Tokens)
 * 
 * عرض شامل لجميع ألوان النظام البصري
 */
const ColorPalette = () => {
  return (
    <div className="space-y-12">
      {/* Primitive Colors */}
      <section>
        <h2 className="text-2xl font-bold mb-6">الألوان الأساسية (Primitive Colors)</h2>
        
        {Object.entries(tokens.colors.primitive).map(([colorName, colorScale]) => {
          if (colorName === 'white' || colorName === 'black') {
            return (
              <div key={colorName} className="mb-4">
                <h3 className="text-lg font-semibold mb-2 capitalize">{colorName}</h3>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-32 h-16 rounded-lg border border-border shadow-sm"
                    style={{ backgroundColor: colorScale as string }}
                  />
                  <span className="font-mono text-sm">{String(colorScale)}</span>
                </div>
              </div>
            );
          }
          
          return (
            <div key={colorName} className="mb-8">
              <h3 className="text-lg font-semibold mb-3 capitalize">{colorName}</h3>
              <div className="grid grid-cols-11 gap-2">
                {Object.entries(colorScale as Record<string, string>).map(([shade, value]) => (
                  <div key={shade} className="flex flex-col items-center">
                    <div 
                      className="w-full h-20 rounded-lg shadow-sm"
                      style={{ backgroundColor: value }}
                      title={value}
                    />
                    <span className="text-xs mt-1 font-medium">{shade}</span>
                    <span className="text-xs text-muted-foreground font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Semantic Colors */}
      <section>
        <h2 className="text-2xl font-bold mb-6">الألوان الدلالية (Semantic Colors)</h2>
        
        {Object.entries(tokens.colors.semantic).map(([category, colors]) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(colors as Record<string, string>).map(([name, value]) => (
                <div key={name} className="flex flex-col">
                  <div 
                    className="w-full h-16 rounded-lg border border-border shadow-sm"
                    style={{ backgroundColor: value }}
                    title={value}
                  />
                  <span className="text-sm mt-2 font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Colors',
  component: ColorPalette,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'نظام الألوان الكامل يتضمن 77 لون primitive و 40+ لون semantic',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * لوحة الألوان الكاملة
 */
export const AllColors: Story = {};
