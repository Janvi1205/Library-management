import React from 'react';

/**
 * Column definition for generic DataTable.
 * Allows type-safe access and custom rendering for any entity type T.
 */
export interface ColumnDef<T> {
  /** Unique identifier for the column */
  header: string;
  /** Optional custom rendering function for cell content */
  render?: (item: T, index: number) => React.ReactNode;
  /** Optional key accessor if not using custom render */
  accessor?: keyof T;
  /** Optional column width hint */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  /** Array of data items of type T (e.g., Book[], Member[], etc.) */
  data: T[];
  /** Array of column configurations specific to type T */
  columns: ColumnDef<T>[];
  /** Unique key extractor function for each row */
  keyExtractor: (item: T, index: number) => string;
  /** Message displayed when data array is empty */
  emptyMessage?: string;
  /** Optional row click handler */
  onRowClick?: (item: T) => void;
  /** Additional custom table class */
  className?: string;
}

/**
 * Generic Reusable DataTable Component <DataTable<T>>
 *
 * Designed to satisfy Question Q2(e). Demonstrates pure TypeScript generics.
 * Reusable across any data entity—explicitly used with <DataTable<Book>> and <DataTable<Member>>.
 *
 * @template T - The type of data displayed in the table rows
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  onRowClick,
  className = '',
}: DataTableProps<T>): React.JSX.Element {
  return (
    <div className={`table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={`th-${index}`}
                style={{
                  width: col.width,
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty-cell">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr
                key={keyExtractor(item, rowIndex)}
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? 'clickable-row' : ''}
              >
                {columns.map((col, colIndex) => {
                  let content: React.ReactNode = null;
                  if (col.render) {
                    content = col.render(item, rowIndex);
                  } else if (col.accessor) {
                    content = String(item[col.accessor] ?? '');
                  }

                  return (
                    <td
                      key={`cell-${rowIndex}-${colIndex}`}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
