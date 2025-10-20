import { Fragment, useCallback } from 'react'
import {
  Search,
  Bell,
  Settings,
  User,
  Sun,
  Moon,
  Building2,
  HelpCircle,
  LogOut,
  UserCircle,
  Activity,
  Contrast,
} from 'lucide-react'

import { Button } from '../button'
import { Input } from '../input'
import { Badge } from '../badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb'
import { useNavigation } from '@/application/context'
import type { AppSection } from '@/application/navigation/navigationSchema'
import { useTheme } from '@/application/providers/ThemeProvider'
import { useCompanySettings } from '@/application/providers/CompanySettingsProvider'
import { DateTimeDisplay } from './DateTimeDisplay'

export function Header() {
  const { breadcrumbs, navigate, activeNode } = useNavigation()
  const { theme, toggleTheme, isDark, isHighContrast } = useTheme()
  const { settings: companySettings } = useCompanySettings()

  const handleBreadcrumbNavigate = useCallback(
    (section: AppSection, params?: Record<string, string>) => {
      navigate(section, params ? { params } : undefined)
    },
    [navigate],
  )

  const secondaryRowVisible = breadcrumbs.length > 0

  const themeToggleLabel =
    theme === 'light'
      ? 'التبديل للوضع الليلي'
      : theme === 'dark'
        ? 'التبديل لوضع التباين العالي'
        : 'التبديل للوضع النهاري'

  const renderThemeIcon = () => {
    if (isHighContrast) {
      return <Contrast className="h-5 w-5 text-foreground" />
    }
    if (isDark) {
      return <Sun className="h-5 w-5 text-warning" />
    }
    return <Moon className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border/25 bg-card/50 px-5 py-4 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-16 right-20 h-40 w-40 rounded-full bg-primary/12 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-[-60px] left-24 h-44 w-44 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border/25 bg-card/40 px-4 py-3 shadow-sm backdrop-blur">
            <div className="relative h-11 w-11">
              <div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/45 via-primary/25 to-primary/10 opacity-80 blur-md"
                aria-hidden
              />
              <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-background/60 text-primary shadow-inner">
                {companySettings.companyLogo ? (
                  <img
                    src={companySettings.companyLogo}
                    alt={companySettings.companyName}
                    className="h-full w-full rounded-xl object-contain"
                  />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground lg:text-lg">
                {companySettings.companyName}
              </h1>
              <p className="text-xs text-muted-foreground">منصة التحكم المؤسسي</p>
            </div>
          </div>

          <DateTimeDisplay
            compact
            className="hidden md:flex border border-primary/15 bg-background/50"
          />

          <div className="order-3 w-full flex-1 md:order-none">
            <div className="relative rounded-full border border-border/20 bg-background/45 shadow-sm backdrop-blur">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث عن مشروع، منافسة أو إجراء..."
                className="h-11 w-full rounded-full border-0 bg-transparent pr-12 pl-4 text-sm focus-visible:ring-2 focus-visible:ring-primary/35"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative h-11 w-11 rounded-2xl border border-border/25 bg-background/50 shadow-sm hover:border-primary/40 hover:bg-primary/10"
              aria-label="عرض الإشعارات"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive/80 text-destructive-foreground shadow-md">
                3
              </Badge>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-11 w-11 rounded-2xl border border-border/25 bg-background/50 shadow-sm hover:border-primary/40 hover:bg-primary/10"
              title={themeToggleLabel}
              aria-label={themeToggleLabel}
            >
              {renderThemeIcon()}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 w-11 rounded-2xl border border-border/25 bg-background/50 p-0 shadow-sm hover:border-primary/40 hover:bg-primary/10"
                  aria-label="قائمة المستخدم"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    <User className="h-5 w-5" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  سجل النشاط
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  المساعدة والدعم
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
              <span>{activeNode?.label ?? 'لوحة التحكم'}</span>
            </div>

            {secondaryRowVisible ? (
              <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((breadcrumb, index) => (
                      <Fragment key={`${breadcrumb.label}-${index}`}>
                        <BreadcrumbItem>
                          {breadcrumb.section ? (
                            <BreadcrumbLink asChild>
                              <button
                                type="button"
                                className="rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                                onClick={() =>
                                  handleBreadcrumbNavigate(breadcrumb.section!, breadcrumb.params)
                                }
                              >
                                {breadcrumb.label}
                              </button>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage className="rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary">
                              {breadcrumb.label}
                            </BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                      </Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            ) : null}
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span>الوصول السريع</span>
            <span className="h-1 w-1 rounded-full bg-border/70" aria-hidden />
            <span>آخر تحديث تم منذ لحظات</span>
          </div>
        </div>
      </div>
    </header>
  )
}
