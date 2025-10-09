import { describe, it, expect } from 'vitest'
import { getStatusColor, getPriorityColor, getHealthColor, getProgressColor, __debugSemanticMaps } from '../../src/utils/statusColors'

// ملاحظة: الهدف من هذه الاختبارات هو حماية واجهة الألوان الموحدة من الانحراف أو الحذف غير المقصود.
// أي تغيير في القيم قد يكون مسموحاً تصميمياً، لكن يتطلب تحديث متعمد للاختبارات.

describe('statusColors unified API', () => {
  it('يعيد لوناً معروفاً لكل حالة أساسية', () => {
    const coreStatuses = ['new','preparing','under_action','active','ready_to_submit','under_review','pricing_in_progress','pricing_completed','submitted','won','lost','expired','cancelled']
    coreStatuses.forEach(st => {
      const c = getStatusColor(st)
      expect(c, `لون مفقود للحالة ${st}`).toBeTypeOf('string')
      expect(c.length).toBeGreaterThan(0)
    })
  })

  it('يسقط للحالة الافتراضية لحالة غير معروفة', () => {
    const unknown = getStatusColor('___UNDEFINED___')
    expect(unknown).toBeTypeOf('string')
  })

  it('يغطي أولويات أساسية', () => {
    ;['critical','high','medium','low'].forEach(p => {
      expect(getPriorityColor(p)).toBeTypeOf('string')
    })
  })

  it('يغطي صحت المشروع (green/yellow/red/good/warning/critical)', () => {
    ;['green','yellow','red','good','warning','critical'].forEach(h => {
      expect(getHealthColor(h)).toBeTypeOf('string')
    })
  })

  it('يستخدم fallback للصحة غير المعروفة', () => {
    const c = getHealthColor('___X___')
    expect(c).toBeTypeOf('string')
  })

  it('يعيد ألوان تقدم وفق الحدود الافتراضية', () => {
    const samples = [0,10,25,55,85,100]
    samples.forEach(p => {
      expect(getProgressColor(p)).toBeTypeOf('string')
    })
  })

  it('يحافظ على الخرائط الداخلية غير الفارغة', () => {
    const maps = __debugSemanticMaps()
    expect(Object.keys(maps.status).length).toBeGreaterThan(5)
    expect(Object.keys(maps.priority).length).toBeGreaterThan(2)
    expect(Object.keys(maps.health).length).toBeGreaterThan(2)
  })
})
