export interface IColumn {
    field: string;
    headerName: string;
    dataType?: 'number' | 'date' | 'Date' | 'string' | 'boolean' | 'progress' | 'currency' | 'feedback';
    width?: number;
    align?: 'right' | 'left' | 'center';
    disablePadding?: boolean;
    numeric?: boolean;
    dateFormat?: string;
}

export interface IRow {
    id: string | number;
    [key: string]: any;
}

export interface TableHeadProps {
    columns: IColumn[];
    childrens?: IColumn[];
    order: 'asc' | 'desc';
    orderBy: any;
    onRequestSort: (event: React.MouseEvent<unknown>, property: string) => void;
    onSelectedAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
    rowCount: number;
    numSelected: number;
    options: any;
    visibleColumns: any;
}

export interface TableToolbarProps {
    numSelected: number;
    searchValue: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCheckAll: any;
    options: any;
    onColumnVisibility: any;
    fileteredColumn: any;
}

export interface DataGridRowProps {
    row: any;
    index: number;
    columns: any;
    childrens?: any;
    isSelected: boolean;
    isExpanded: boolean;
    onRowClick: (event: React.MouseEvent<unknown>, index: number) => void;
    onExpandToggle: (index: number) => void;
    onCellClick?: (row: any, field: string) => void;
    options?: any;
    visibleColumns: any;
}

export interface MuiAdvancedDataGridProps {
    data: IRow[];
    columns: IColumn[];
    childrens?: IColumn[];
    onSelectAll?: (ele: any) => void;
    onCellClick?: (obj: any, field: string) => void;
    options: any;
    isLoading: boolean;
}

export interface VisibleColumns {
    [key: string]: boolean;
}

export interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}