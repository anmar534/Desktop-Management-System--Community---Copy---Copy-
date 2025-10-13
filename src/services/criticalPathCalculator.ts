/**
 * Critical Path Calculator
 * محرك حساب المسار الحرج (Critical Path Method)
 */

import type {
  GanttTask,
  CriticalPathAnalysis,
  CriticalPathTask,
  ProjectSchedule
} from '../types/scheduling'

export interface CPMNode {
  id: string
  name: string
  duration: number
  dependencies: string[]
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  totalSlack: number
  freeSlack: number
  isCritical: boolean
}

export interface CPMNetwork {
  nodes: Map<string, CPMNode>
  startNodes: string[]
  endNodes: string[]
  criticalPath: string[]
  projectDuration: number
}

class CriticalPathCalculatorImpl {
  /**
   * حساب المسار الحرج للمشروع
   */
  calculateCriticalPath(schedule: ProjectSchedule): CriticalPathAnalysis {
    try {
      // التعامل مع قائمة المهام الفارغة
      if (!schedule.tasks || schedule.tasks.length === 0) {
        return {
          path: [],
          duration: 0,
          slack: 0,
          tasks: [],
          bottlenecks: []
        }
      }

      // بناء شبكة CPM
      const network = this.buildCPMNetwork(schedule.tasks)

      // حساب التوقيتات المبكرة (Forward Pass)
      this.forwardPass(network)

      // حساب التوقيتات المتأخرة (Backward Pass)
      this.backwardPass(network)

      // حساب الفجوات الزمنية
      this.calculateSlack(network)

      // تحديد المسار الحرج
      const criticalPath = this.identifyCriticalPath(network)

      // تحويل النتائج
      const tasks = this.convertToTasks(network, schedule.tasks)
      const bottlenecks = this.identifyBottlenecks(network)

      return {
        path: criticalPath,
        duration: network.projectDuration,
        slack: this.calculateProjectSlack(network),
        tasks,
        bottlenecks
      }
    } catch (error) {
      console.error('Error calculating critical path:', error)
      throw new Error('فشل في حساب المسار الحرج')
    }
  }

  /**
   * بناء شبكة CPM من المهام
   */
  private buildCPMNetwork(tasks: GanttTask[]): CPMNetwork {
    const nodes = new Map<string, CPMNode>()
    
    // إنشاء العقد
    for (const task of tasks) {
      const duration = this.calculateDuration(task.start, task.end)
      
      nodes.set(task.id, {
        id: task.id,
        name: task.name,
        duration,
        dependencies: task.dependencies || [],
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        totalSlack: 0,
        freeSlack: 0,
        isCritical: false
      })
    }
    
    // تحديد نقاط البداية والنهاية
    const startNodes = this.findStartNodes(nodes)
    const endNodes = this.findEndNodes(nodes)
    
    return {
      nodes,
      startNodes,
      endNodes,
      criticalPath: [],
      projectDuration: 0
    }
  }

  /**
   * المرور الأمامي لحساب التوقيتات المبكرة
   */
  private forwardPass(network: CPMNetwork): void {
    const visited = new Set<string>()
    const queue = [...network.startNodes]
    
    // تعيين نقاط البداية
    for (const nodeId of network.startNodes) {
      const node = network.nodes.get(nodeId)!
      node.earlyStart = 0
      node.earlyFinish = node.duration
    }
    
    while (queue.length > 0) {
      const currentId = queue.shift()!
      
      if (visited.has(currentId)) continue
      visited.add(currentId)
      
      const currentNode = network.nodes.get(currentId)!
      
      // البحث عن المهام التابعة
      for (const [nodeId, node] of network.nodes) {
        if (node.dependencies.includes(currentId)) {
          // حساب أقرب وقت بداية ممكن
          const predecessorFinish = currentNode.earlyFinish
          node.earlyStart = Math.max(node.earlyStart, predecessorFinish)
          node.earlyFinish = node.earlyStart + node.duration
          
          // إضافة للطابور إذا كانت جميع التبعيات محسوبة
          if (this.allDependenciesCalculated(node, network.nodes, visited)) {
            queue.push(nodeId)
          }
        }
      }
    }
    
    // حساب مدة المشروع
    network.projectDuration = Math.max(
      ...Array.from(network.nodes.values()).map(node => node.earlyFinish)
    )
  }

  /**
   * المرور الخلفي لحساب التوقيتات المتأخرة
   */
  private backwardPass(network: CPMNetwork): void {
    const visited = new Set<string>()
    const queue = [...network.endNodes]
    
    // تعيين نقاط النهاية
    for (const nodeId of network.endNodes) {
      const node = network.nodes.get(nodeId)!
      node.lateFinish = network.projectDuration
      node.lateStart = node.lateFinish - node.duration
    }
    
    while (queue.length > 0) {
      const currentId = queue.shift()!
      
      if (visited.has(currentId)) continue
      visited.add(currentId)
      
      const currentNode = network.nodes.get(currentId)!
      
      // البحث عن المهام السابقة
      for (const dependencyId of currentNode.dependencies) {
        const dependencyNode = network.nodes.get(dependencyId)
        if (!dependencyNode) continue
        
        // حساب أحدث وقت انتهاء ممكن
        const successorStart = currentNode.lateStart
        dependencyNode.lateFinish = Math.min(
          dependencyNode.lateFinish || successorStart,
          successorStart
        )
        dependencyNode.lateStart = dependencyNode.lateFinish - dependencyNode.duration
        
        if (!visited.has(dependencyId)) {
          queue.push(dependencyId)
        }
      }
    }
  }

  /**
   * حساب الفجوات الزمنية
   */
  private calculateSlack(network: CPMNetwork): void {
    for (const node of network.nodes.values()) {
      node.totalSlack = node.lateStart - node.earlyStart
      node.isCritical = node.totalSlack === 0
      
      // حساب الفجوة الحرة
      node.freeSlack = this.calculateFreeSlack(node, network)
    }
  }

  /**
   * تحديد المسار الحرج
   */
  private identifyCriticalPath(network: CPMNetwork): string[] {
    const criticalNodes = Array.from(network.nodes.values())
      .filter(node => node.isCritical)
      .map(node => node.id)
    
    // ترتيب المسار الحرج
    const path = this.orderCriticalPath(criticalNodes, network)
    network.criticalPath = path
    
    return path
  }

  /**
   * ترتيب المسار الحرج حسب التبعيات
   */
  private orderCriticalPath(criticalNodes: string[], network: CPMNetwork): string[] {
    const ordered: string[] = []
    const remaining = new Set(criticalNodes)
    
    while (remaining.size > 0) {
      for (const nodeId of remaining) {
        const node = network.nodes.get(nodeId)!
        
        // فحص إذا كانت جميع التبعيات الحرجة مضافة
        const criticalDeps = node.dependencies.filter(dep => 
          criticalNodes.includes(dep)
        )
        
        if (criticalDeps.every(dep => ordered.includes(dep))) {
          ordered.push(nodeId)
          remaining.delete(nodeId)
          break
        }
      }
    }
    
    return ordered
  }

  /**
   * تحديد نقاط الاختناق
   */
  private identifyBottlenecks(network: CPMNetwork): string[] {
    const bottlenecks: string[] = []
    
    for (const node of network.nodes.values()) {
      // المهام الحرجة مع تبعيات متعددة
      if (node.isCritical && node.dependencies.length > 1) {
        bottlenecks.push(node.id)
      }
      
      // المهام التي تؤثر على مهام متعددة
      const dependentCount = Array.from(network.nodes.values())
        .filter(n => n.dependencies.includes(node.id)).length
      
      if (node.isCritical && dependentCount > 2) {
        bottlenecks.push(node.id)
      }
    }
    
    return [...new Set(bottlenecks)]
  }

  /**
   * تحويل النتائج إلى مهام المسار الحرج
   */
  private convertToTasks(network: CPMNetwork, originalTasks: GanttTask[]): CriticalPathTask[] {
    return Array.from(network.nodes.values()).map(node => {
      const originalTask = originalTasks.find(t => t.id === node.id)
      
      return {
        id: node.id,
        name: node.name,
        duration: node.duration,
        earlyStart: this.addDaysToDate(originalTask?.start || new Date(), node.earlyStart),
        earlyFinish: this.addDaysToDate(originalTask?.start || new Date(), node.earlyFinish),
        lateStart: this.addDaysToDate(originalTask?.start || new Date(), node.lateStart),
        lateFinish: this.addDaysToDate(originalTask?.start || new Date(), node.lateFinish),
        totalSlack: node.totalSlack,
        freeSlack: node.freeSlack,
        isCritical: node.isCritical
      }
    })
  }

  // Helper methods
  private calculateDuration(start: Date, end: Date): number {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private findStartNodes(nodes: Map<string, CPMNode>): string[] {
    return Array.from(nodes.values())
      .filter(node => node.dependencies.length === 0)
      .map(node => node.id)
  }

  private findEndNodes(nodes: Map<string, CPMNode>): string[] {
    const allDependencies = new Set(
      Array.from(nodes.values()).flatMap(node => node.dependencies)
    )
    
    return Array.from(nodes.keys())
      .filter(nodeId => !allDependencies.has(nodeId))
  }

  private allDependenciesCalculated(
    node: CPMNode, 
    nodes: Map<string, CPMNode>, 
    visited: Set<string>
  ): boolean {
    return node.dependencies.every(depId => visited.has(depId))
  }

  private calculateFreeSlack(node: CPMNode, network: CPMNetwork): number {
    // البحث عن أقرب مهمة تابعة
    let minSuccessorStart = Infinity
    
    for (const [nodeId, otherNode] of network.nodes) {
      if (otherNode.dependencies.includes(node.id)) {
        minSuccessorStart = Math.min(minSuccessorStart, otherNode.earlyStart)
      }
    }
    
    if (minSuccessorStart === Infinity) {
      return node.totalSlack
    }
    
    return minSuccessorStart - node.earlyFinish
  }

  private calculateProjectSlack(network: CPMNetwork): number {
    const nonCriticalNodes = Array.from(network.nodes.values())
      .filter(node => !node.isCritical)
    
    if (nonCriticalNodes.length === 0) return 0
    
    return Math.min(...nonCriticalNodes.map(node => node.totalSlack))
  }

  private addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
}

export const criticalPathCalculator = new CriticalPathCalculatorImpl()
