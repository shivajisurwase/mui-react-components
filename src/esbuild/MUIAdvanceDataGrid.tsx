import React, { useState, useMemo, useCallback, useRef, useEffect, memo, useReducer } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Pagination,
  Typography,
  Checkbox,
  Grid,
  Select,
  MenuItem,
  Menu,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import { debounce } from './utility';
import { MuiAdvancedDataGridProps, VisibleColumns } from './modal';
import { TableHeadComponent } from './TableHeadComponent';
import { DataGridRow } from './DataGridRow';
import { TableToolbar } from './TableToolbar';
import { TableSkeleton } from './Skeleton';

// === ReusableTable ===
const MuiAdvancedDataGrid: React.FC<MuiAdvancedDataGridProps> = ({
  data,
  childrens,
  columns,
  isLoading,
  onSelectAll,
  onCellClick,
  options,
}) => {
  const { footerBackgroundColor, height, enableStrikyHeader, toolbarOptions, fontSize, color, paginationOptions } =
    options || {};
  const {
    rowPerPage = [10, 30, 50],
    isFirstLastPageButton,
    onPageClick,
    pageNumber = 1,
    pageSize = 0,
    totalPages = 0,
    totalCount = 0,
  } = paginationOptions || {};
  const {} = toolbarOptions || {};
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(rowPerPage?.[0] || 10);
  const [searchValue, setSearchValue] = useState<string>('');
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());
  const [filterData, setFilterData] = useState<any>([]);

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(
    columns.reduce((acc, column) => ({ ...acc, [column.field]: true }), {})
  );
  const [anchorColVisibilityEl, setAnchorColVisibilityEl] = useState<null | HTMLElement>(null);
  const isColVisiblityMenuOpen = Boolean(anchorColVisibilityEl);

  useEffect(() => {
    setFilterData(data);
    setPage(pageNumber);
  }, [data, pageNumber]);

  const onColumnVisibility = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorColVisibilityEl(event.currentTarget);
  };

  const handleColumnVisibility = () => {
    setAnchorColVisibilityEl(null);
  };

  const handleColumnToggle = (field: string) => {
    if (field === columns[0].field) {
      return;
    }
    setVisibleColumns((prevState) => ({
      ...prevState,
      [field]: !prevState[field],
    }));
  };

  const handleRequestSort = React.useCallback(
    (event: React.MouseEvent<unknown>, property: string) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
    },
    [orderBy, order]
  );

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(data?.map((_, index) => index));
    } else {
      setSelected([]);
    }
  };

  const handleRowClick = (event: React.MouseEvent<unknown>, index: number) => {
    const selectedIndex = selected.indexOf(index);
    let newSelected: number[] = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, index);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const handleChangePage = useCallback(
    (event: unknown, newPage: number) => {
      if (newPage === null) return;
      setPage(newPage);
      onPageClick?.(newPage, rowsPerPage);
    },
    [onPageClick, rowsPerPage, setPage]
  );

  const handleChangeRowsPerPage = useCallback(
    (event: any) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPage(1);
      onPageClick?.(1, newRowsPerPage);
    },
    [onPageClick, setRowsPerPage, setPage]
  );

  const handleQueryChange = (text: string) => {
    const filteredRows = data.filter((row) =>
      columns.some(
        (column) =>
          visibleColumns[column.field] && row[column.field]?.toString().toLowerCase().includes(text.toLowerCase())
      )
    );
    setFilterData(filteredRows);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
    setPage(1); // Reset to the first page on search change
  };

  debounce(() => handleQueryChange(searchValue), [data, searchValue], 1000);

  const handleRowExpand = (index: number) => {
    const newOpenRows = new Set(openRows);
    if (newOpenRows.has(index)) {
      newOpenRows.delete(index);
    } else {
      newOpenRows.add(index);
    }
    setOpenRows(newOpenRows);
  };

  // Paginate and sort rows
  const visibleRows = useMemo(() => {
    const sortedRows = [...filterData];
    if (orderBy) {
      sortedRows?.sort((a, b) => {
        const valueA = a[orderBy] ?? '';
        const valueB = b[orderBy] ?? '';
        if (order === 'asc') {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        }
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      });
    }
    const notUndefined = (onPageClick && typeof onPageClick === 'function') || false;
    const startIndex = notUndefined ? 0 : (page - 1) * rowsPerPage;
    const endIndex = notUndefined ? rowsPerPage : page * rowsPerPage;

    return sortedRows.slice(startIndex, endIndex);
  }, [filterData, order, orderBy, page, rowsPerPage]);

  const handleCheckAll = useCallback(() => {
    onSelectAll?.(selected);
  }, [onSelectAll, selected]);

  const handleCell = useCallback(
    (obj: any, field: string) => {
      onCellClick?.(obj, field);
    },
    [onCellClick]
  );

  useEffect(() => {
    if (!paginationOptions) {
      setRowsPerPage(500);
    }
  }, []);

  return (
    <>
      <Box sx={{ width: '100%' }}>
        {isLoading && (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableSkeleton rows={columns?.length} columns={columns?.length + 1} />
          </Paper>
        )}
        {!isLoading && (
          <Paper sx={{ width: '100%', mb: 2 }}>
            {/* Assuming TableToolbar is a custom component to handle the search and title */}
            {toolbarOptions && (
              <TableToolbar
                numSelected={selected.length}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onCheckAll={handleCheckAll}
                options={options}
                onColumnVisibility={onColumnVisibility}
                fileteredColumn={columns.filter((item) => visibleColumns[item.field])}
              />
            )}
            <Menu anchorEl={anchorColVisibilityEl} open={isColVisiblityMenuOpen} onClose={handleColumnVisibility}>
              <FormGroup sx={{ padding: '6px' }}>
                {columns.map((column, idx) => (
                  <FormControlLabel
                    key={column.field}
                    control={
                      <Checkbox
                        disabled={0 === idx}
                        color={color || 'primary'}
                        size="small"
                        checked={visibleColumns[column.field]}
                        onChange={() => handleColumnToggle(column.field)}
                      />
                    }
                    label={<Typography sx={{ fontSize: fontSize || '14px' }}>{column.headerName}</Typography>}
                  />
                ))}
              </FormGroup>
            </Menu>
            <TableContainer
              sx={{
                maxHeight: height && enableStrikyHeader ? height : 'auto',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#a1a1a1',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                },
              }}
            >
              <Table size="small">
                <TableHeadComponent
                  columns={columns}
                  childrens={childrens}
                  visibleColumns={visibleColumns}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                  onSelectedAll={handleSelectAll}
                  rowCount={data.length}
                  numSelected={selected.length}
                  options={options}
                />
                {visibleRows?.length > 0 ? (
                  <TableBody>
                    {visibleRows.map((row, index) => (
                      <DataGridRow
                        key={index.toString()}
                        row={row}
                        index={index}
                        columns={columns}
                        childrens={childrens}
                        visibleColumns={visibleColumns}
                        isSelected={selected.includes(index)}
                        isExpanded={openRows.has(index)}
                        onRowClick={handleRowClick}
                        onExpandToggle={handleRowExpand}
                        onCellClick={handleCell}
                        options={options}
                      />
                    ))}
                  </TableBody>
                ) : (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={columns.length + 4} align="center">
                        <Typography sx={{ fontSize: fontSize || '14px', padding: '100px' }}>No data found</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
            {paginationOptions && (
              <Grid
                container
                justifyContent="flex-end"
                sx={{
                  padding: '4px',
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? '#303041' : footerBackgroundColor ? footerBackgroundColor : '#fff',
                }}
              >
                {totalCount !== 0 && (
                  <Grid display="flex" alignItems="center" sx={{ mt: '-5px', ml: 2, mr: 2 }}>
                    <Typography sx={{ fontSize: fontSize || '14px' }}>Total rows: {totalCount}</Typography>
                  </Grid>
                )}
                {/* Rows per Page Select */}
                <Grid display="flex" alignItems="center" sx={{ mt: '-5px', ml: 2, mr: 2 }}>
                  <Typography sx={{ fontSize: fontSize || '14px' }}>Rows per page:</Typography>
                  <Select
                    sx={{
                      border: 'none',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    }}
                    size="small"
                    labelId="rows-per-page-label"
                    value={rowsPerPage}
                    label="Rows per page"
                    onChange={handleChangeRowsPerPage}
                  >
                    {rowPerPage?.map((rowsPerPageOption: any) => (
                      <MenuItem key={rowsPerPageOption} value={rowsPerPageOption}>
                        {rowsPerPageOption}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
                {/* Pagination */}
                {!onPageClick && (
                  <Pagination
                    sx={{
                      '& .MuiPagination-ul': {
                        justifyContent: 'flex-end',
                      },
                      '& .MuiPaginationItem-ellipsis': {
                        color: 'gray',
                        pointerEvents: 'none',
                      },
                    }}
                    count={Math.ceil(data.length / rowsPerPage)}
                    page={page}
                    onChange={(e, newPage) => setPage(newPage)}
                    siblingCount={1}
                    boundaryCount={1}
                    showFirstButton={isFirstLastPageButton}
                    showLastButton={isFirstLastPageButton}
                  />
                )}
                {onPageClick && (
                  <Pagination
                    sx={{
                      '& .MuiPagination-ul': {
                        justifyContent: 'flex-end',
                      },
                      '& .MuiPaginationItem-ellipsis': {
                        color: 'gray',
                        pointerEvents: 'none',
                      },
                    }}
                    count={totalPages}
                    page={page}
                    onChange={handleChangePage}
                    siblingCount={1}
                    boundaryCount={1}
                    showFirstButton={isFirstLastPageButton}
                    showLastButton={isFirstLastPageButton}
                  />
                )}
              </Grid>
            )}
          </Paper>
        )}
      </Box>
    </>
  );
};

export default memo(MuiAdvancedDataGrid);