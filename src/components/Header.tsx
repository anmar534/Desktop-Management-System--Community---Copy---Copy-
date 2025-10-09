'use client'

import { Fragment, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
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
  Contrast
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './ui/breadcrumb'
import { useNavigation } from '@/application/context'
import type { AppSection } from '@/application/navigation/navigationSchema'
import { useTheme } from '@/application/providers/ThemeProvider'

export function Header() {
  const { breadcrumbs, navigate, quickActions, activeNode } = useNavigation()
  const { theme, toggleTheme, isDark, isHighContrast } = useTheme()

  const handleBreadcrumbNavigate = useCallback((section: AppSection, params?: Record<string, string>) => {
    navigate(section, params ? { params } : undefined)
  }, [navigate])

  const secondaryRowVisible = breadcrumbs.length > 0 || !!activeNode?.description || quickActions.length > 0

  const themeToggleLabel = theme === 'light'
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
        {/* الجانب الأيمن - الشعار ومعلومات الشركة */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">شركة المقاولات المتطورة</h1>
              <p className="text-xs text-muted-foreground">نظام الإدارة المتكامل</p>
            </div>
          </div>
        </div>

        {/* الوسط - البحث */}
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

        {/* الجانب الأيسر - الإجراءات والمستخدم */}
        <div className="flex items-center gap-3">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 h-10 px-3 hover:bg-muted/60 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">أحمد المدير</p>
                  <p className="text-xs text-muted-foreground">مدير النظام</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
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

      {secondaryRowVisible && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {breadcrumbs.length > 0 && (
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
                              onClick={() => handleBreadcrumbNavigate(breadcrumb.section!, breadcrumb.params)}
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
            )}
            {activeNode?.description && (
              <p className="text-xs text-muted-foreground max-w-2xl">{activeNode.description}</p>
            )}
          </div>

          {quickActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {quickActions.map(action => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => navigate(action.targetSection, action.params ? { params: action.params } : undefined)}
                  title={action.tooltip}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  )
}