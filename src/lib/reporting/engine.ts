export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface ReportConfig {
  columns?: string[];
  filters?: FilterCondition[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  groupBy?: string;
}

export class ReportEngine {
  /**
   * Processes a raw array of data according to the report configuration.
   * Runs in this order: Filter -> Sort -> Select Columns -> Group
   */
  static process<T extends Record<string, any>>(data: T[], config: ReportConfig): any[] {
    let result = [...data];

    // 1. Filter
    if (config.filters && config.filters.length > 0) {
      result = result.filter(item => {
        return config.filters!.every(f => {
          const itemVal = item[f.field];
          switch (f.operator) {
            case 'equals': return itemVal === f.value;
            case 'contains': return String(itemVal).toLowerCase().includes(String(f.value).toLowerCase());
            case 'gt': return itemVal > f.value;
            case 'lt': return itemVal < f.value;
            case 'gte': return itemVal >= f.value;
            case 'lte': return itemVal <= f.value;
            case 'in': return Array.isArray(f.value) && f.value.includes(itemVal);
            default: return true;
          }
        });
      });
    }

    // 2. Sort
    if (config.sortBy) {
      const field = config.sortBy;
      const dir = config.sortDir === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        if (a[field] < b[field]) return -1 * dir;
        if (a[field] > b[field]) return 1 * dir;
        return 0;
      });
    }

    // 3. Select Columns
    if (config.columns && config.columns.length > 0) {
      result = result.map(item => {
        const selected: any = {};
        config.columns!.forEach(col => {
          if (col in item) {
            selected[col] = item[col];
          }
        });
        return selected;
      });
    }

    // 4. Group (returns a nested array or object flattened back to array for simple rendering)
    if (config.groupBy) {
      const field = config.groupBy;
      const grouped = result.reduce((acc: any, item) => {
        const key = item[field] || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      // For a flat table structure, grouping usually means sorting by group or returning a tree.
      // We will flatten it but add a "_groupLabel" for the UI to render headers.
      const flattenedGrouped: any[] = [];
      for (const [key, items] of Object.entries(grouped)) {
        flattenedGrouped.push({ _isGroupHeader: true, _groupKey: key, _groupCount: (items as any[]).length });
        flattenedGrouped.push(...(items as any[]));
      }
      return flattenedGrouped;
    }

    return result;
  }
}
