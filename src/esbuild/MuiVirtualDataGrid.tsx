/* eslint-disable */
import React, { useState, useMemo, useReducer, useRef, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TableSortLabel,
  Box,
  Skeleton,
  IconButton,
  Menu,
  Checkbox,
  FormControlLabel,
  Typography,
  FormGroup,
  Toolbar,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Chip,
  LinearProgressProps,
  InputAdornment,
  Alert,
} from '@mui/material';
import * as XLSX from 'xlsx';
import {
  ViewColumn,
  Download,
  Upload,
  CheckCircleOutlined,
  ErrorOutlineOutlined,
  Star,
  StarHalf,
  StarOutline,
  Search,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { styled, useTheme } from '@mui/system';
import moment from 'moment';
// import { TableSkeleton } from './Skeleton';

const LOADING = 1;
const LOADED = 2;
let itemStatusMap: Record<number, number> = {};

interface Column {
  field: string;
  headerName: string;
  dataType?: 'number' | 'date' | 'Date' | 'string' | 'boolean' | 'progress' | 'currency' | 'feedback';
  width?: number;
  align?: 'right' | 'left' | 'center';
  disablePadding?: boolean;
  numeric?: boolean;
  dateFormat?: string;
  renderCell?: (row: Record<string, any>) => JSX.Element;
}

interface DataRow {
  [key: string]: string | number;
}

const VisuallyHiddenInput = styled('input')({
  display: 'none',
});

const isItemLoaded = (index: number): boolean => itemStatusMap[index] === LOADED;

const loadMoreItems = async (startIndex: number, stopIndex: number): Promise<void> => {
  const itemsToLoad = [];
  for (let index = startIndex; index <= stopIndex; index++) {
    if (itemStatusMap[index] !== LOADED) {
      itemStatusMap[index] = LOADING;
      itemsToLoad.push(index);
    }
  }
  if (itemsToLoad.length === 0) return;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  for (const index of itemsToLoad) {
    itemStatusMap[index] = LOADED;
  }
};

interface MuiVirtualDataGridProps {
  columns: Column[];
  data: DataRow[];
  isLoading: boolean;
  headerHeight?: number;
  rowHeight?: number;
  options?: any;
}

interface RowRendererProps {
  index: number;
  style: React.CSSProperties;
  columns: Column[];
  data: DataRow[];
  visibleColumns: string[];
  options?: any;
}

interface MuiToolbarProps {
  columns: Column[];
  visibleColumns: string[];
  onSearchChange: (value: string) => void;
  onToggleColumn: (field: string) => void;
  options: any;
}

const MuiToolbar: React.FC<MuiToolbarProps> = ({
  columns,
  visibleColumns,
  onSearchChange,
  onToggleColumn,
  options,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { toolbarOptions, filterOptions } = options || {};
  const { onUpload, onDownload, enableColumnArrangement } = toolbarOptions || {};

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // const handleDownload = async () => {
  //   dispatch({ type: 'DOWNLOAD_START' });
  //   const { data, filename, extension = '.xlsx' } = await onDownload?.();
  //   console.log('Data:', data, filename, extension);

  //   if (!data || !filename || !extension) {
  //     const missingFields = [];
  //     if (!data) missingFields.push('Data');
  //     if (!filename) missingFields.push('Filename');
  //     if (!extension) missingFields.push('Extension');

  //     const errorMessage = `Invalid data returned from onDownload. Missing fields: ${missingFields.join(', ')}.`;
  //     console.error('Error:', errorMessage);
  //     dispatch({ type: 'RESET' });
  //     return;
  //   }
  //   // Filter visible columns
  //   const filteredColumns = columns.filter((col) => visibleColumns.includes(col.field));
  //   const filteredData = data.map((row: any) => {
  //     const filteredRow: any = {};
  //     filteredColumns.forEach((col) => {
  //       filteredRow[col.headerName] = row[col.field];
  //     });
  //     return filteredRow;
  //   });

  //   exportExcel({ data: filteredData, filename, extension })
  //     .then((message) => {
  //       dispatch({ type: 'DOWNLOAD_SUCCESS' });
  //     })
  //     .catch((error) => {
  //       console.log('error', error);
  //       dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message });
  //       dispatch({ type: 'DOWNLOAD_ERROR' });
  //     })
  //     .finally(() => {
  //       delay(5000).then(() => {
  //         dispatch({ type: 'RESET' });
  //       });
  //     });
  // };

  // const handleFileChange = (e: any) => {
  //   const file = e.target.files[0];
  //   dispatch({ type: 'SET_ERROR_MESSAGE', payload: null });

  //   if (!file) {
  //     dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'No file selected' });
  //     return;
  //   }

  //   const maxFileSize = 10 * 1024 * 1024;
  //   if (file.size > maxFileSize) {
  //     dispatch({
  //       type: 'SET_ERROR_MESSAGE',
  //       payload: `File size exceeds the 10MB limit. The selected file is ${Math.round(file.size / 1024 / 1024)}MB.`,
  //     });
  //     return;
  //   }

  //   const allowedFormats = [
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //     'application/vnd.ms-excel',
  //     'text/csv',
  //   ];

  //   if (!allowedFormats.includes(file.type)) {
  //     dispatch({
  //       type: 'SET_ERROR_MESSAGE',
  //       payload: 'Invalid file format. Only .xlsx and .csv files are allowed.',
  //     });
  //     return;
  //   }

  //   dispatch({ type: 'UPLOAD_START' });

  //   const rs = new Promise((resolve, reject) => {
  //     const fileReader = new FileReader();
  //     fileReader.readAsArrayBuffer(file);
  //     fileReader.onload = (e) => {
  //       const bufferArray = e?.target?.result;
  //       const wb = XLSX.read(bufferArray, { type: 'buffer' });
  //       const wsname = wb.SheetNames[0];
  //       const ws = wb.Sheets[wsname];
  //       const data = XLSX.utils.sheet_to_json(ws);
  //       resolve(data);
  //     };
  //     fileReader.onerror = (error) => {
  //       reject(error);
  //       if (inputRef.current) inputRef.current.value = '';
  //     };
  //   });

  //   rs.then((result) => {
  //     onUpload?.(result).then((flag: string) => {
  //       if (flag === 'success') {
  //         dispatch({ type: 'UPLOAD_SUCCESS' });
  //         delay(5000).then(() => {
  //           dispatch({ type: 'RESET' });
  //         });
  //         if (inputRef.current) inputRef.current.value = '';
  //       } else {
  //         dispatch({ type: 'UPLOAD_ERROR' });
  //         if (inputRef.current) inputRef.current.value = '';
  //         delay(5000).then(() => {
  //           dispatch({ type: 'RESET' });
  //         });
  //       }
  //     });
  //   }).catch((error) => {
  //     dispatch({ type: 'UPLOAD_ERROR', payload: error.message || 'File processing error' });
  //   });
  // };

  return (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between', // Aligns search on the left, icons on the right
          alignItems: 'center', // Vertical alignment
          padding: '0px',
        }}
      >
        {filterOptions !== false && (
          <TextField
            placeholder="Search"
            onChange={(e) => onSearchChange(e.target.value)}
            variant={filterOptions?.variant || 'standard'}
            size="small"
            sx={{ flex: '1 1 100%', maxWidth: '250px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}

        {/* Right Side: Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Upload Button */}
          {/* {onUpload && (
            <Tooltip title="Upload">
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <IconButton component="label">
                  {state?.isUploaded ? (
                    <CheckCircleOutlined color="success" />
                  ) : state?.isUploadError ? (
                    <ErrorOutlineOutlined color="error" />
                  ) : (
                    <Upload />
                  )}
                  <VisuallyHiddenInput type="file" ref={inputRef} onChange={handleFileChange} />
                </IconButton>
                {state.isLoadingUpload && (
                  <CircularProgress
                    size="40px"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 1,
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          )} */}

          {/* Download Button */}
          {/* {onDownload && (
            <Tooltip title="Download">
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <IconButton onClick={handleDownload}>
                  {state?.isDownloaded ? (
                    <CheckCircleOutlined color="success" />
                  ) : state?.isDownloadError ? (
                    <ErrorOutlineOutlined color="error" />
                  ) : (
                    <Download />
                  )}
                </IconButton>
                {state.isLoadingDownload && (
                  <CircularProgress
                    size="40px"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      zIndex: 1,
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          )} */}

          {/* Column Visibility Menu */}
          {enableColumnArrangement && (
            <Tooltip title="Column Visibility">
              <IconButton onClick={handleMenuOpen}>
                <ViewColumn />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Column Visibility Menu Dropdown */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <FormGroup sx={{ padding: '6px' }}>
            {columns.map((col, idx) => (
              <FormControlLabel
                key={col.field}
                control={
                  <Checkbox
                    disabled={idx === 0} // Disable the first column if required
                    color="primary"
                    size="small"
                    checked={visibleColumns.includes(col.field)}
                    onChange={() => onToggleColumn(col.field)}
                  />
                }
                label={<Typography sx={{ fontSize: '14px' }}>{col.headerName}</Typography>}
              />
            ))}
          </FormGroup>
        </Menu>
      </Toolbar>
    </>
  );
};

const getTFLabel = (bool: boolean): JSX.Element => {
  const text = bool ? 'Yes' : 'No';
  const color = bool ? 'success' : 'warning';

  return (
    <Chip
      label={text}
      color={color as 'success' | 'warning'}
      size="small"
      sx={{
        borderRadius: '3px',
        color: (theme) =>
          color === 'success' ? theme.palette.success.contrastText : theme.palette.warning.contrastText,
      }}
    />
  );
};

function LinearProgressWithLabel({ value }: LinearProgressProps & { value: number }) {
  let progressColor: 'error' | 'warning' | 'success' = 'success';
  let textColor = '#ffffff';

  if (value < 30) {
    progressColor = 'error';
    textColor = '#444';
  } else if (value < 70) {
    progressColor = 'warning';
    textColor = '#444';
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <LinearProgress variant="determinate" color={progressColor} value={value} sx={{ height: 16 }} />
      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: (theme) => (theme.palette.mode === 'dark' ? '#ffffff' : textColor),
        }}
      >
        {`${value}%`}
      </Typography>
    </Box>
  );
}

const FiveStarRating: React.FC<{ value: number }> = ({ value }) => {
  const rating = Math.min(Math.max(value, 0), 5);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {Array.from({ length: 5 }).map((_, index) => {
        if (rating >= index + 1) {
          return <Star key={index} color="warning" />;
        } else if (rating >= index + 0.5) {
          return <StarHalf key={index} color="warning" />;
        } else {
          return <StarOutline key={index} color="disabled" />;
        }
      })}
    </Box>
  );
};

const RowRenderer: React.FC<RowRendererProps> = React.memo(
  ({ index, style, columns, data, visibleColumns, options = {} }) => {
    if (index >= data.length) return null;

    const {
      targetRowIndex,
      targetRowColor,
      currencyOptions = {},
      dateFormat = 'DD/MM/YYYY HH:mm:ss',
      textEllipsis = 40,
      fontSize = '14px',
      enableSerialNumber,
      rowActions,
      onCellClick,
    } = options;

    console.log('RowRenderer:', index);

    // Memoized currency formatting function
    const numberFormat = useMemo(
      () => (value: any) =>
        new Intl.NumberFormat(currencyOptions.locale || 'en-IN', {
          style: currencyOptions.currencyCode ? 'currency' : 'decimal',
          currency: currencyOptions.currencyCode || 'INR',
          minimumFractionDigits: currencyOptions.decimal ?? 0,
          maximumFractionDigits: currencyOptions.decimal ?? 2,
        }).format(value ?? 0),
      [currencyOptions]
    );

    // Memoized render function
    const renderCellContent = useCallback(
      (row: Record<string, any>, column: any) => {
        const value = row[column.field];
        if (value === undefined || value === null) return '';

        if (typeof column.renderCell === 'function') {
          return column.renderCell({ ...row, rowIndex: index });
        }

        switch (column.dataType) {
          case 'date':
          case 'Date':
            return moment(value).format(dateFormat);
          case 'boolean':
            return getTFLabel(Boolean(value));
          case 'currency':
            return numberFormat(value);
          case 'progress':
            return <LinearProgressWithLabel value={Number(value)} />;
          case 'feedback':
            return <FiveStarRating value={Number(value)} />;
          default:
            return typeof value === 'string' && value.length > textEllipsis ? (
              <Tooltip title={value} arrow>
                <span style={{ fontSize }}>{value.substring(0, textEllipsis)}...</span>
              </Tooltip>
            ) : (
              <span style={{ fontSize }}>{value}</span>
            );
        }
      },
      [index, dateFormat, numberFormat, textEllipsis, fontSize]
    );

    // Memoize filtered columns to avoid recalculating in every render
    const filteredColumns = useMemo(
      () => columns.filter((col) => visibleColumns.includes(col.field)),
      [columns, visibleColumns]
    );

    return (
      <TableRow
        style={{
          ...style,
          display: 'flex',
          backgroundColor: targetRowColor && targetRowIndex === index ? targetRowColor : 'inherit',
        }}
        key={index.toString()}
      >
        {enableSerialNumber && (
          <TableCell style={{ width: 80, textAlign: 'center' }}>
            <span style={{ fontSize: fontSize || '14px' }}>
              <b>{index + 1}</b>
            </span>
          </TableCell>
        )}

        {filteredColumns.map((col, colIndex) => (
          <TableCell
            key={colIndex}
            onClick={() => onCellClick?.(data[index], col.field)}
            style={{
              flex: 1,
              width: col.width,
              textAlign: col.align || 'center',
            }}
          >
            {data[index] && itemStatusMap[index] === LOADED ? (
              renderCellContent(data[index], col)
            ) : (
              <Skeleton animation="wave" />
            )}
          </TableCell>
        ))}

        {rowActions && (
          <TableCell
            style={{
              width: rowActions?.length ? 50 * rowActions.length : 100,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {rowActions.map((action: any, idx: any) => (
              <Tooltip key={idx} title={action?.tooltip || ''} arrow>
                <IconButton
                  sx={{ marginTop: '-6px' }}
                  disabled={action?.disabled || false}
                  color={action?.color || 'primary'}
                  onClick={() => action?.onClick(data[index])}
                  aria-label={action?.tooltip?.toLowerCase() || 'action'}
                  size="small"
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          </TableCell>
        )}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.style === nextProps.style &&
      prevProps.data === nextProps.data &&
      prevProps.visibleColumns === nextProps.visibleColumns &&
      prevProps.options === nextProps.options
    );
  }
);

const MuiVirtualDataGrid: React.FC<MuiVirtualDataGridProps> = ({
  columns,
  data,
  isLoading,
  options,
  headerHeight = 50,
  rowHeight = 50,
}) => {
  const {
    toolbarOptions,
    filterOptions,
    enableSerialNumber,
    fontSize = '14px',
    rowActions,
    targetRowPosition,
    targetRowIndex,
    enableScrollToTop,
    headerColor = '#e1edfc',
  } = options || {};
  const [searchText, setSearchText] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((col) => col.field));
  const listRef = useRef<any>(null);
  const tableRef = useRef<any>(null);
  const theme = useTheme();

  const filteredData = useMemo(() => {
    let filtered = data;
    if (searchText) {
      filtered = data.filter((row) =>
        columns.some((col) => row[col.field]?.toString().toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return direction === 'asc'
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      });
    }
    return filtered;
  }, [data, searchText, sortColumn, direction]);

  const handleSort = (column: string): void => {
    if (sortColumn === column) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setDirection('asc');
    }
  };

  const handleColumnToggle = (field: string): void => {
    setVisibleColumns((prev) => (prev.includes(field) ? prev.filter((col) => col !== field) : [...prev, field]));
  };

  const loadMoreRows = (startIndex: number, stopIndex: number): Promise<void> => loadMoreItems(startIndex, stopIndex);

  useEffect(() => {
    if (targetRowIndex !== null && listRef.current) {
      setTimeout(() => {
        listRef.current.scrollToItem(targetRowIndex, targetRowPosition || 'center');
      }, 500);
    }
    if (enableScrollToTop && tableRef.current) {
      setTimeout(() => {
        tableRef.current.scrollIntoView({
          behavior: 'smooth',
        });
      }, 500);
    }
  }, [targetRowIndex, enableScrollToTop]);

  return (
    <Box style={{ marginBottom: '16px', padding: '10px' }} ref={tableRef}>
      {isLoading && (
        <Paper sx={{ width: '100%' }}>
          {/* <TableSkeleton rows={columns?.length} columns={columns?.length + 1} /> */}
        </Paper>
      )}
      {!isLoading && (
        <Paper sx={{ width: '100%' }}>
          {(toolbarOptions || filterOptions) && (
            <MuiToolbar
              columns={columns}
              visibleColumns={visibleColumns}
              onSearchChange={setSearchText}
              onToggleColumn={handleColumnToggle}
              options={options}
            />
          )}
          <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={filteredData.length} loadMoreItems={loadMoreRows}>
            {({ onItemsRendered, ref }) => (
              <TableContainer component={Paper} style={{ width: '100%', overflow: 'auto', maxHeight: '600px' }}>
                <Table stickyHeader sx={{ minWidth: 1200 }} id="data-tables">
                  <TableHead>
                    <TableRow style={{ display: 'flex', height: '45px' }}>
                      {enableSerialNumber && (
                        <TableCell
                          style={{
                            width: 80,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: theme.palette.mode === 'dark' ? '#303041' : headerColor,
                          }}
                        >
                          <span style={{ fontSize: fontSize || '14px' }}>Sr. No</span>
                        </TableCell>
                      )}
                      {columns
                        .filter((col) => visibleColumns.includes(col.field))
                        .map((col, index) => (
                          <TableCell
                            key={index.toString()}
                            style={{
                              flex: 1,
                              width: col.width,
                              fontWeight: 'bold',
                              textAlign: 'center',
                              backgroundColor: theme.palette.mode === 'dark' ? '#303041' : headerColor,
                            }}
                            sortDirection={sortColumn === col.field ? direction : false}
                          >
                            <TableSortLabel
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '22px',
                              }}
                              active={sortColumn === col.field}
                              direction={sortColumn === col.field ? direction : 'asc'}
                              onClick={() => handleSort(col.field)}
                            >
                              {col.headerName}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                      {rowActions && (
                        <TableCell
                          style={{
                            width: rowActions?.length ? 50 * rowActions.length : 100,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: theme.palette.mode === 'dark' ? '#303041' : headerColor,
                          }}
                        >
                          <span style={{ fontSize: fontSize || '14px' }}>Actions</span>
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <List
                      overscanCount={4}
                      width={1200}
                      height={500 - headerHeight}
                      itemCount={filteredData.length}
                      itemSize={rowHeight}
                      onItemsRendered={onItemsRendered as any}
                      ref={(el) => {
                        ref(el);
                        listRef.current = el;
                      }}
                      outerElementType="div"
                      innerElementType="div"
                      style={{
                        width: '100%',
                      }}
                    >
                      {({ index, style }) => (
                        <RowRenderer
                          index={index}
                          style={style}
                          columns={columns}
                          data={filteredData}
                          visibleColumns={visibleColumns}
                          options={options}
                        />
                      )}
                    </List>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </InfiniteLoader>
        </Paper>
      )}
    </Box>
  );
};

export default MuiVirtualDataGrid;
