import React, { useState, useRef, useReducer } from 'react';
import {
  Box,
  Toolbar,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  ViewColumn,
  Download,
  Upload,
  Delete,
  Search,
  CheckBoxOutlineBlank,
  CheckBox,
  CheckCircleOutlined,
  ErrorOutlineOutlined,
  FilterList,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import * as XLSX from 'xlsx';
import { exportExcel, delay } from './utility';
import { TableToolbarProps } from './modal';

const VisuallyHiddenInput = styled('input')({
  display: 'none',
});

const initialState = {
  isDownloaded: false,
  isDownloadError: false,
  isUploaded: false,
  isUploadError: false,
  isLoadingDownload: false,
  isLoadingUpload: false,
  errMsg: null,
};

const reducer = (state: any, action: any) => {
  switch (action.type) {
    case 'DOWNLOAD_START':
      return { ...state, isLoadingDownload: true, isDownloadError: false };
    case 'DOWNLOAD_SUCCESS':
      return { ...state, isLoadingDownload: false, isDownloaded: true };
    case 'DOWNLOAD_ERROR':
      return { ...state, isLoadingDownload: false, isDownloadError: true };
    case 'UPLOAD_START':
      return { ...state, isLoadingUpload: true, isUploadError: false };
    case 'UPLOAD_SUCCESS':
      return { ...state, isLoadingUpload: false, isUploaded: true };
    case 'UPLOAD_ERROR':
      return { ...state, isLoadingUpload: false, isUploadError: true };
    case 'SET_ERROR_MESSAGE':
      return { ...state, errMsg: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

// === TableToolbar ===
export const TableToolbar: React.FC<TableToolbarProps> = ({
  numSelected,
  searchValue,
  options,
  onSearchChange,
  onCheckAll,
  onColumnVisibility,
  fileteredColumn,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [isFilterColumn, setIsFilterColumn] = useState(false);
  const { color, fontSize, toolbarOptions, filterOptions, textFieldVariant } = options || {};
  const { enableDeleteAll, enableColumnArrangement, CustomToolbar, onUpload, onDownload, toolbarActions } =
    toolbarOptions || {};
  const { enableMultipleColumnSelection, onQuerySearch } = filterOptions || {};

  const handleCheckAll = () => {
    onCheckAll?.();
  };

  const handleAutocompleteChange = (event: any, newValue: any) => {
    setSelectedColumns(newValue); // Update the selected columns state
  };

  const handleSearchByColumn = () => {
    setIsFilterColumn((prev) => !prev);
  };

  const handleQuerySearch = () => {
    const res = (selectedColumns || [])?.map((x: any) => x?.field);
    if (filterValue.trim() !== '' && res?.length > 0) {
      if (typeof onQuerySearch === 'function') {
        onQuerySearch(filterValue, res);
      }
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: null });
    } else {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'Please select at least one column and enter a filter value' });
    }
  };

  const handleDownload = async () => {
    dispatch({ type: 'DOWNLOAD_START' });
    const { data, filename, extension = '.xlsx' } = await onDownload?.();
    if (!data || !filename || !extension) {
      const missingFields = [];
      if (!data) missingFields.push('Data');
      if (!filename) missingFields.push('Filename');
      if (!extension) missingFields.push('Extension');

      const errorMessage = `Invalid data returned from onDownload. Missing fields: ${missingFields.join(', ')}.`;
      console.error('Error:', errorMessage);
      dispatch({ type: 'RESET' });
      return;
    }
    exportExcel({ data, filename, extension })
      .then((message) => {
        dispatch({ type: 'DOWNLOAD_SUCCESS' });
      })
      .catch((error) => {
        console.log('error', error);
        dispatch({ type: 'SET_ERROR_MESSAGE', payload: error.message });
        dispatch({ type: 'DOWNLOAD_ERROR' });
      })
      .finally(() => {
        delay(5000).then(() => {
          dispatch({ type: 'RESET' });
        });
      });
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    dispatch({ type: 'SET_ERROR_MESSAGE', payload: null });

    if (!file) {
      dispatch({ type: 'SET_ERROR_MESSAGE', payload: 'No file selected' });
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;
    if (file.size > maxFileSize) {
      dispatch({
        type: 'SET_ERROR_MESSAGE',
        payload: `File size exceeds the 10MB limit. The selected file is ${Math.round(file.size / 1024 / 1024)}MB.`,
      });
      return;
    }

    const allowedFormats = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!allowedFormats.includes(file.type)) {
      dispatch({
        type: 'SET_ERROR_MESSAGE',
        payload: 'Invalid file format. Only .xlsx and .csv files are allowed.',
      });
      return;
    }

    dispatch({ type: 'UPLOAD_START' });

    const rs = new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = (e) => {
        const bufferArray = e?.target?.result;
        const wb = XLSX.read(bufferArray, { type: 'buffer' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        resolve(data);
      };
      fileReader.onerror = (error) => {
        reject(error);
        if (inputRef.current) inputRef.current.value = '';
      };
    });

    rs.then((result) => {
      onUpload?.(result).then((flag: string) => {
        if (flag === 'success') {
          dispatch({ type: 'UPLOAD_SUCCESS' });
          delay(5000).then(() => {
            dispatch({ type: 'RESET' });
          });
          if (inputRef.current) inputRef.current.value = '';
        } else {
          dispatch({ type: 'UPLOAD_ERROR' });
          if (inputRef.current) inputRef.current.value = '';
          delay(5000).then(() => {
            dispatch({ type: 'RESET' });
          });
        }
      });
    }).catch((error) => {
      dispatch({ type: 'UPLOAD_ERROR', payload: error.message || 'File processing error' });
    });
  };

  return (
    <>
      {state.errMsg && (
        <Alert severity="error">
          <b>{state.errMsg}</b>
        </Alert>
      )}
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
        }}
      >
        {enableDeleteAll && numSelected > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%', fontSize: fontSize || '14px' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} {numSelected > 1 ? 'Records selected' : 'Record selected'}
          </Typography>
        ) : (
          <Typography sx={{ flex: '1 1 100%' }} variant="h6" component="div">
            {filterOptions !== false && !isFilterColumn && (
              <TextField
                placeholder="Search"
                value={searchValue}
                onChange={onSearchChange}
                variant={textFieldVariant || 'standard'}
                size="small"
                sx={{ flex: '1 1 100%' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {filterOptions !== false && isFilterColumn && (
              <Grid
                sx={{
                  mt: textFieldVariant === 'outlined' ? '0px' : '-16px',
                  width: 500,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                {/* Autocomplete Field */}
                <Autocomplete
                  multiple={enableMultipleColumnSelection || false}
                  limitTags={1}
                  id="checkboxes-tags-demo"
                  size="small"
                  sx={{ flex: 1 }}
                  options={fileteredColumn || []}
                  value={selectedColumns}
                  onChange={handleAutocompleteChange}
                  getOptionLabel={(option: any) => option?.headerName || ''}
                  renderOption={(props, option: any, { selected }) => {
                    const { key, ...optionProps } = props as any;
                    return (
                      <li key={key} {...optionProps} style={{ padding: 0, fontSize: '14px' }}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlank fontSize="small" />}
                          checkedIcon={<CheckBox fontSize="small" />}
                          style={{ marginRight: 2 }}
                          checked={selected}
                        />
                        {option?.headerName}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant={textFieldVariant || 'standard'}
                      label="Select Columns"
                      sx={{ fontSize: '14px' }}
                      fullWidth
                    />
                  )}
                />

                {/* Search TextField */}
                <TextField
                  label="Filter value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  variant={textFieldVariant || 'standard'}
                  size="small"
                  fullWidth
                  sx={{ flex: 1 }}
                />
                <Tooltip title="Query Search">
                  <IconButton
                    onClick={handleQuerySearch}
                    size="small"
                    sx={{
                      mt: textFieldVariant === 'outlined' ? '0px' : '20px',
                      bgcolor: (theme) => (color ? (theme.palette.mode === 'dark' ? '#303041' : color) : color),
                    }}
                  >
                    <Search />
                  </IconButton>
                </Tooltip>
              </Grid>
            )}
          </Typography>
        )}

        {enableDeleteAll && numSelected > 0 ? (
          <Tooltip title="Delete All">
            <IconButton onClick={() => handleCheckAll()}>
              <Delete />
            </IconButton>
          </Tooltip>
        ) : (
          <Grid sx={{ display: 'flex', gap: '10px' }}>
            {CustomToolbar && (
              <Grid>
                {typeof CustomToolbar === 'function'
                  ? CustomToolbar()
                  : React.isValidElement(CustomToolbar)
                  ? CustomToolbar
                  : console.warn('Invalid CustomToolbar type')}
              </Grid>
            )}
            {toolbarActions && (
              <>
                {toolbarActions?.map((action: any, idx: number) => (
                  <Tooltip key={idx.toString()} title={action?.tooltip || ''} arrow>
                    <IconButton
                      disabled={action?.disabled || false}
                      sx={{ bgcolor: (theme) => (color ? (theme.palette.mode === 'dark' ? '#303041' : color) : color) }}
                      onClick={() => action?.onClick()}
                      aria-label={action?.tooltip?.toLowerCase() || 'action'}
                    >
                      <action.icon />
                    </IconButton>
                  </Tooltip>
                ))}
              </>
            )}
            {onUpload && (
              <Tooltip title="Upload">
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <IconButton
                    component="label"
                    sx={{ bgcolor: (theme) => (color ? (theme.palette.mode === 'dark' ? '#303041' : color) : color) }}
                  >
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
            )}

            {onDownload && (
              <Tooltip title="Download">
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <IconButton
                    onClick={handleDownload}
                    sx={{
                      bgcolor: (theme) => (color ? (theme.palette.mode === 'dark' ? '#303041' : color) : color),
                    }}
                  >
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
            )}

            {enableColumnArrangement !== false && (
              <Tooltip title="Filter By Column">
                <IconButton
                  onClick={handleSearchByColumn}
                  sx={{
                    bgcolor: (theme) => (color ? (theme.palette.mode === 'dark' ? '#303041' : color) : color),
                  }}
                >
                  <FilterList />
                </IconButton>
              </Tooltip>
            )}
            {enableColumnArrangement !== false && (
              <Tooltip title="Manage column visibility">
                <IconButton
                  onClick={onColumnVisibility}
                  sx={{
                    bgcolor: (theme) => (color ? (theme.palette.mode === 'dark' ? '#303041' : color) : color),
                  }}
                >
                  <ViewColumn />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        )}
      </Toolbar>
    </>
  );
};
