"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  RefreshCcw,
  Settings,
  Calendar,
  CalendarDays,
  Clock,
} from "lucide-react";
import { DashboardKPICards } from "./DashboardKPICards";
import { TenderStatusCards } from "./TenderStatusCards";
import { RemindersCard } from "./RemindersCard";
import { FinancialSummaryCard } from "./FinancialSummaryCard";
import { MonthlyExpensesChart } from "./MonthlyExpensesChart";
import { AnnualKPICards } from "./AnnualKPICards";
import { useFinancialState } from "@/application/context";
import { useDashboardMetrics } from "@/application/hooks/useDashboardMetrics";
import { formatTime } from "@/utils/formatters";

interface DashboardProps {
  onSectionChange: (section: string) => void;
}

export function Dashboard({ onSectionChange }: DashboardProps) {
  const {
    currency,
    lastRefreshAt,
  } = useFinancialState();

  const {
    data: dashboardMetrics,
    isLoading: dashboardMetricsLoading,
    lastUpdated: dashboardLastUpdated,
    refresh: refreshDashboardMetrics,
  } = useDashboardMetrics();

  const [currentTime, setCurrentTime] = useState(new Date());

  const baseCurrency = currency?.baseCurrency ?? dashboardMetrics.currency.base ?? 'SAR';

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // تنسيق التاريخ الميلادي
  const getGregorianDate = (date: Date) => {
    const days = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return { dayName, day, month, year };
  };

  // تنسيق التاريخ الهجري (تقريبي)
  const getHijriDate = (date: Date) => {
    const hijriMonths = [
      "محرم",
      "صفر",
      "ربيع الأول",
      "ربيع الثاني",
      "جمادى الأولى",
      "جمادى الثانية",
      "رجب",
      "شعبان",
      "رمضان",
      "شوال",
      "ذو القعدة",
      "ذو الحجة",
    ];

    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();

    const hijriYear = Math.floor(((gregorianYear - 622) * 33) / 32) + 1;
    const approximateHijriMonth = (gregorianMonth + 8) % 12;
    const hijriDay = gregorianDay;

    return {
      day: hijriDay,
      month: hijriMonths[approximateHijriMonth],
      year: hijriYear,
    };
  };

  // تنسيق الوقت
  const getFormattedTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const gregorianDate = getGregorianDate(currentTime);
  const hijriDate = getHijriDate(currentTime);
  const formattedTime = getFormattedTime(currentTime);

  const handleRefreshDashboard = () => {
    void refreshDashboardMetrics();
  };

  const dataLastUpdatedLabel = formatTime(dashboardLastUpdated ?? lastRefreshAt, { locale: 'ar-EG' });
  const currencyLastUpdatedLabel = formatTime(
    dashboardMetrics.currency.lastUpdated ?? currency?.lastUpdated ?? null,
    { locale: 'ar-EG' }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title & Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                لوحة التحكم التنفيذية
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                نظرة شاملة على مؤشرات الأداء الرئيسية والعمليات التشغيلية
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  آخر تحديث: {dataLastUpdatedLabel}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  العملة: {baseCurrency}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  أسعار الصرف: {currencyLastUpdatedLabel}
                </Badge>
              </div>
            </div>

            {/* Date, Time & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Date & Time Display */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/20">
                {/* Gregorian Date */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>ميلادي</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {gregorianDate.dayName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {gregorianDate.day} {gregorianDate.month} {gregorianDate.year}
                  </div>
                </div>

                <div className="w-px h-12 bg-gray-300"></div>

                {/* Hijri Date */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>هجري</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {hijriDate.day} {hijriDate.month}
                  </div>
                  <div className="text-xs text-gray-600">{hijriDate.year} هـ</div>
                </div>

                <div className="w-px h-12 bg-gray-300"></div>

                {/* Time */}
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Clock className="h-3 w-3" />
                    <span>الوقت</span>
                  </div>
                  <div className="text-lg font-bold text-primary font-mono">
                    {formattedTime}
                  </div>
                  <div className="text-xs text-gray-600">الرياض</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshDashboard}
                  disabled={dashboardMetricsLoading}
                  className="hover:bg-primary/10"
                >
                  <RefreshCcw
                    className={`h-4 w-4 ml-2 ${
                      dashboardMetricsLoading ? "animate-spin" : ""
                    }`}
                  />
                  تحديث
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSectionChange("settings")}
                  className="hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4 ml-2" />
                  الإعدادات
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* الصف الأول: بطاقات مؤشرات الأداء الرئيسية (KPIs) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                مؤشرات الأداء الرئيسية
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                مقارنة الإنجازات الفعلية مع الأهداف المحددة
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSectionChange("development")}
              className="text-primary hover:text-primary/80"
            >
              إدارة الأهداف ←
            </Button>
          </div>
          <DashboardKPICards onSectionChange={onSectionChange} />
        </div>

        {/* الصف الثاني: مؤشرات الأداء السنوية */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                مؤشرات الأداء السنوية
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تفاصيل الأداء السنوي حسب الأقسام
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {new Date().getFullYear()}
            </Badge>
          </div>
          <AnnualKPICards onSectionChange={onSectionChange} />
        </div>

        {/* الصف الثالث: المنافسات والتذكيرات والمالية */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* المنافسات - عرض مزدوج */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                حالة المنافسات
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                تحليل شامل لحالة المنافسات الجارية
              </p>
            </div>
            <TenderStatusCards onSectionChange={onSectionChange} />
          </div>

          {/* التذكيرات والملخص المالي */}
          <div className="space-y-6">
            {/* التذكيرات */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  التذكيرات
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  المواعيد والمهام المهمة
                </p>
              </div>
              <RemindersCard onSectionChange={onSectionChange} />
            </div>

            {/* الملخص المالي */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  الملخص المالي
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  نظرة سريعة على الوضع المالي
                </p>
              </div>
              <FinancialSummaryCard onSectionChange={onSectionChange} />
            </div>
          </div>
        </div>

        {/* الصف الرابع: المصاريف الشهرية */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              المصاريف الشهرية
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              تحليل المصاريف الشهرية مقارنة بالموازنة
            </p>
          </div>
          <MonthlyExpensesChart onSectionChange={onSectionChange} />
        </div>
      </div>
    </div>
  );
}
