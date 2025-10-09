/** @type {import('tailwindcss').Config} */

/**
 * Tailwind CSS Configuration
 *
 * محدّث لاستخدام Design Tokens من tokens.config.ts
 * يدعم: Light، Dark، High Contrast themes
 *
 * @version 2.0.0
 * @date 2025-10-07
 */

module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Semantic colors - linked to CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // Additional semantic colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },

        // Construction Industry Colors (Procore-inspired)
        construction: {
          orange: {
            50: 'hsl(24, 100%, 97%)',
            100: 'hsl(24, 100%, 93%)',
            200: 'hsl(24, 95%, 85%)',
            300: 'hsl(24, 95%, 75%)',
            400: 'hsl(24, 95%, 60%)',
            500: 'hsl(24, 94%, 50%)',  // Primary Construction Orange
            600: 'hsl(24, 94%, 45%)',
            700: 'hsl(24, 94%, 35%)',
            800: 'hsl(24, 94%, 25%)',
            900: 'hsl(24, 94%, 20%)',
          },
          blue: {
            50: 'hsl(221, 83%, 97%)',
            100: 'hsl(221, 83%, 93%)',
            200: 'hsl(221, 83%, 85%)',
            300: 'hsl(221, 83%, 75%)',
            400: 'hsl(221, 83%, 60%)',
            500: 'hsl(221, 83%, 53%)',  // Construction Blue
            600: 'hsl(221, 83%, 45%)',
            700: 'hsl(221, 83%, 35%)',
            800: 'hsl(221, 83%, 25%)',
            900: 'hsl(221, 83%, 20%)',
          },
          black: {
            DEFAULT: 'hsl(0, 0%, 13%)',  // Procore Black
            50: 'hsl(0, 0%, 95%)',
            100: 'hsl(0, 0%, 90%)',
            200: 'hsl(0, 0%, 75%)',
            300: 'hsl(0, 0%, 60%)',
            400: 'hsl(0, 0%, 40%)',
            500: 'hsl(0, 0%, 25%)',
            600: 'hsl(0, 0%, 20%)',
            700: 'hsl(0, 0%, 15%)',
            800: 'hsl(0, 0%, 13%)',
            900: 'hsl(0, 0%, 10%)',
          },
        },

        // Project Status Colors (Procore-style)
        status: {
          overdue: 'hsl(0, 84%, 60%)',      // Red - متأخر
          dueSoon: 'hsl(45, 93%, 47%)',     // Yellow - يستحق قريباً (خلال 7 أيام)
          onTrack: 'hsl(142, 76%, 36%)',    // Green - على المسار (أكثر من 7 أيام)
          notStarted: 'hsl(210, 12%, 55%)', // Gray - لم يبدأ
          completed: 'hsl(142, 76%, 36%)',  // Green - مكتمل
        },

        // Budget & Financial Status Colors
        financial: {
          underBudget: 'hsl(142, 76%, 36%)', // Green - أقل من الميزانية
          onBudget: 'hsl(221, 83%, 53%)',    // Blue - ضمن الميزانية
          nearBudget: 'hsl(45, 93%, 47%)',   // Yellow - قرب الميزانية
          overBudget: 'hsl(0, 84%, 60%)',    // Red - تجاوز الميزانية
        },

        // Chart colors
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
          7: "hsl(var(--chart-7))",
          8: "hsl(var(--chart-8))",
        },
      },

      // Border Radius من tokens
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // Font Family من tokens
      fontFamily: {
        sans: ['"Segoe UI"', '"Cairo"', '"Tajawal"', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"Cascadia Code"', '"Fira Code"', '"Consolas"', '"Monaco"', 'monospace'],
        arabic: ['"Cairo"', '"Tajawal"', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },

      // Spacing - extended من tokens
      spacing: {
        '0.5': '0.125rem',
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '104': '26rem',
        '108': '27rem',
        '112': '28rem',
        '116': '29rem',
        '120': '30rem',
      },

      // Shadows من tokens
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'focus': '0 0 0 3px rgba(66, 153, 225, 0.5)',
        'error': '0 0 0 3px rgba(245, 101, 101, 0.5)',
        'success': '0 0 0 3px rgba(72, 187, 120, 0.5)',
        'glow-sm': '0 0 10px rgba(66, 153, 225, 0.5)',
        'glow': '0 0 20px rgba(66, 153, 225, 0.5)',
        'glow-lg': '0 0 30px rgba(66, 153, 225, 0.5)',
      },

      // Animations محسّنة
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-out-right": "slide-out-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "spin-slow": "spin-slow 3s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },

      // Transition durations من tokens
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      // Z-index من tokens
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'backdrop': '1040',
        'drawer': '1045',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'notification': '1080',
        'toast': '1090',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Plugin لإضافة utility classes للـ RTL
    function({ addUtilities }) {
      const newUtilities = {
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
        // RTL-aware margins and paddings (Logical Properties)
        '.ms-auto': {
          'margin-inline-start': 'auto',
        },
        '.me-auto': {
          'margin-inline-end': 'auto',
        },
        '.ps-4': {
          'padding-inline-start': '1rem',
        },
        '.pe-4': {
          'padding-inline-end': '1rem',
        },
      };
      addUtilities(newUtilities);
    },
    // Plugin لإضافة Card Grid layouts
    function({ addComponents }) {
      const components = {
        '.card-grid': {
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        },
        '.card-grid-sm': {
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        },
        '.card-grid-lg': {
          display: 'grid',
          gap: '2rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        },
        // Responsive card grids
        '.dashboard-grid': {
          display: 'grid',
          gap: '1.5rem',
          '@media (min-width: 640px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          '@media (min-width: 1024px)': {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
          '@media (min-width: 1280px)': {
            gridTemplateColumns: 'repeat(4, 1fr)',
          },
        },
        '.financial-grid': {
          display: 'grid',
          gap: '1.5rem',
          '@media (min-width: 768px)': {
            gridTemplateColumns: 'repeat(2, 1fr)',
          },
          '@media (min-width: 1280px)': {
            gridTemplateColumns: 'repeat(3, 1fr)',
          },
        },
        // Card elevation styles (Procore-inspired)
        '.card-elevated': {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)',
          },
        },
      };
      addComponents(components);
    },
  ],
}
