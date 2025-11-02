/**
 * صفحة تصحيح أخطاء لعرض الأهداف المخزنة
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { useDevelopment } from '@/application/hooks/useDevelopment'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'

export function DebugGoals() {
  const { goals } = useDevelopment()
  const [rawStorage, setRawStorage] = useState<any>(null)

  const loadRawStorage = () => {
    const raw = safeLocalStorage.getItem(STORAGE_KEYS.DEVELOPMENT_GOALS, [])
    setRawStorage(raw)
    console.log('📦 Raw storage data:', raw)
  }

  useEffect(() => {
    loadRawStorage()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🎯 Debug: Development Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">من Hook (useDevelopment):</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(goals, null, 2)}
            </pre>
            <p className="mt-2 text-sm text-muted-foreground">عدد الأهداف: {goals.length}</p>
          </div>

          <div>
            <h3 className="font-bold mb-2">من LocalStorage مباشرة:</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(rawStorage, null, 2)}
            </pre>
            <p className="mt-2 text-sm text-muted-foreground">
              Storage Key: {STORAGE_KEYS.DEVELOPMENT_GOALS}
            </p>
          </div>

          <Button onClick={loadRawStorage}>🔄 إعادة تحميل</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل كل هدف</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <p className="text-muted-foreground">لا توجد أهداف محفوظة</p>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <p>
                    <strong>ID:</strong> {goal.id}
                  </p>
                  <p>
                    <strong>Title:</strong> {goal.title}
                  </p>
                  <p>
                    <strong>Category:</strong> {goal.category}
                  </p>
                  <p>
                    <strong>Type:</strong> {goal.type}
                  </p>
                  <p>
                    <strong>Unit:</strong> {goal.unit}
                  </p>
                  <p>
                    <strong>Current:</strong> {goal.currentValue}
                  </p>
                  <p>
                    <strong>Target 2025:</strong> {goal.targetValue2025}
                  </p>
                  <p>
                    <strong>Target 2026:</strong> {goal.targetValue2026}
                  </p>
                  <p>
                    <strong>Target 2027:</strong> {goal.targetValue2027}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
