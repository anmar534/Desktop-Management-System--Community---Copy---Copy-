// DiffService: compute differences between two priced versions.
import type { BoQPricedItem } from '../model';

type ComparableField = 'totalPrice' | 'unitPrice' | 'quantity';

export interface ItemDiffChange<Field extends ComparableField = ComparableField> {
  field: Field;
  old: BoQPricedItem[Field];
  new: BoQPricedItem[Field];
}

export interface ItemDiffRecord {
  itemId: string;
  changes: ItemDiffChange[];
}

export interface PricedDiffResult {
  added: string[];
  removed: string[];
  changed: ItemDiffRecord[];
}

export class DiffService {
  compute(oldItems: BoQPricedItem[], newItems: BoQPricedItem[]): PricedDiffResult {
    const oldMap = new Map(oldItems.map(i => [i.baseItemId, i]));
    const newMap = new Map(newItems.map(i => [i.baseItemId, i]));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: ItemDiffRecord[] = [];

    for (const [baseItemId, newItem] of newMap.entries()) {
      if (!oldMap.has(baseItemId)) {
        added.push(baseItemId);
        continue;
      }
      const oldItem = oldMap.get(baseItemId)!;
      const itemChanges: ItemDiffChange[] = [];
      // compare a subset of fields
      this.compareField('totalPrice', oldItem.totalPrice, newItem.totalPrice, itemChanges);
      this.compareField('unitPrice', oldItem.unitPrice, newItem.unitPrice, itemChanges);
      this.compareField('quantity', oldItem.quantity, newItem.quantity, itemChanges);
      if (itemChanges.length) {
        changed.push({ itemId: baseItemId, changes: itemChanges });
      }
    }

    for (const baseItemId of oldMap.keys()) {
      if (!newMap.has(baseItemId)) removed.push(baseItemId);
    }

    return { added, removed, changed };
  }

  private compareField<Field extends ComparableField>(
    field: Field,
    oldVal: BoQPricedItem[Field],
    newVal: BoQPricedItem[Field],
    acc: ItemDiffChange[]
  ) {
    if (oldVal !== newVal) acc.push({ field, old: oldVal, new: newVal });
  }
}
