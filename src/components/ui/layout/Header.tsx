'use client'

import { Fragment, useCallback } from 'react'
import {
  Search,
  Bell,
  Settings,
  User,
  Sun,
  Moon,
  Building2,
  ChevronDown,
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
import { cn } from '../utils'

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

  // Only show secondary row if there are breadcrumbs
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
    <header className="bg-card border-b border-border px-6 py-4 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between gap-6">
        {/* Company Branding - Left Side */}
        <div className="flex items-center gap-3">
          {/* Company Logo */}
          {companySettings.companyLogo ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent/50 flex items-center justify-center shadow-md">
              <img
                src={companySettings.companyLogo}
                alt={companySettings.companyName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-accent text-accent-foreground shadow-md">
              <Building2 className="h-6 w-6" />
            </div>
          )}

          {/* Company Name */}
          <div>
            <h1 className="text-lg font-bold text-foreground">{companySettings.companyName}</h1>
            <p className="text-xs text-muted-foreground">نظام الإدارة المتكامل</p>
          </div>
        </div>

        {/* Date/Time Display - Center */}
        <div className="hidden lg:flex">
          <DateTimeDisplay compact />
        </div>

        {/* Search Bar - Center/Right */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="البحث في النظام..."
              className="w-full pr-10 pl-4 h-10 bg-muted border-border focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Actions - Right Side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative h-10 w-10 rounded-full hover:bg-muted/60"
            aria-label="عرض الإشعارات"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-destructive text-destructive-foreground">
              3
            </Badge>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-full hover:bg-muted/60"
            title={themeToggleLabel}
            aria-label={themeToggleLabel}
          >
            {renderThemeIcon()}
          </Button>

          {/* User Profile - Icon Only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full hover:bg-muted/60 p-0"
                aria-label="قائمة المستخدم"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
                  <User className="h-4 w-4" />
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

      {/* Breadcrumbs - Secondary Row */}
      {secondaryRowVisible && (
        <div className="flex items-center">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <Fragment key={`${breadcrumb.label}-${index}`}>
                  <BreadcrumbItem>
                    {breadcrumb.section ? (
                      <BreadcrumbLink asChild>
                        <button
                          type="button"
                          className="text-right"
                          onClick={() =>
                            handleBreadcrumbNavigate(breadcrumb.section!, breadcrumb.params)
                          }
                        >
                          {breadcrumb.label}
                        </button>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
    </header>
  )
}
