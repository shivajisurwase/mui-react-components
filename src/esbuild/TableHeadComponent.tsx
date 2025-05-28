import React from 'react';
import { TableCell, TableHead, TableRow, TableSortLabel, Checkbox, FormControlLabel } from '@mui/material';

import { TableHeadProps } from './modal';

// === TableHeadComponent ===
export const TableHeadComponent: React.FC<TableHeadProps> = ({
  columns,
  childrens,
  order,
  orderBy,
  onRequestSort,
  onSelectedAll,
  rowCount,
  numSelected,
  options,
  visibleColumns,
}) => {
  const { headerBackgroundColor, enableStrikyHeader, enableSerialNumber, color, fontSize, rowActions, toolbarOptions } =
    options || {};
  const { enableDeleteAll } = toolbarOptions || {};
  const createSortHandler = (property: string) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };
  // hide show column logic @shivaji
  const filteredColumns = visibleColumns ? columns.filter((column) => visibleColumns[column.field] !== false) : columns;

  return (
    <TableHead
      sx={{
        position: enableStrikyHeader ? 'sticky' : 'static',
        top: enableStrikyHeader ? 0 : 'auto',
        zIndex: enableStrikyHeader ? 1 : 'auto',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#303041' : headerBackgroundColor ? headerBackgroundColor : '#fff',
      }}
    >
      <TableRow>
        {enableSerialNumber && (
          <TableCell>
            <span style={{ fontSize: fontSize || '14px' }}>Sr. No</span>
          </TableCell>
        )}
        {childrens && <TableCell />}
        {enableDeleteAll && (
          <TableCell>
            <FormControlLabel
              control={
                <Checkbox
                  color={color || 'primary'}
                  size="small"
                  indeterminate={numSelected > 0 && numSelected < rowCount}
                  checked={rowCount > 0 && numSelected === rowCount}
                  onChange={onSelectedAll}
                />
              }
              label={''}
            />
          </TableCell>
        )}
        {filteredColumns.map((column) => (
          <TableCell
            key={column.field}
            align={column.numeric ? 'right' : 'left'}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.field ? order : false}
          >
            <TableSortLabel
              active={orderBy === column.field}
              direction={orderBy === column.field ? order : 'asc'}
              onClick={createSortHandler(column.field)}
            >
              <span style={{ fontSize: fontSize || '14px' }}>{column.headerName}</span>
            </TableSortLabel>
          </TableCell>
        ))}
        {rowActions && (
          <TableCell align="center">
            <span style={{ fontSize: fontSize || '14px' }}>Actions</span>
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
};
