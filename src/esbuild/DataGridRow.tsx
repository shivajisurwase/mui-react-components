import React from 'react';
import {
  TableCell,
  TableRow,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  Chip,
  FormControlLabel,
  LinearProgressProps,
  LinearProgress,
  Box,
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Star, StarHalf, StarOutline } from '@mui/icons-material';
import moment from 'moment';
import { DataGridRowProps } from './modal';

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
        color: (theme) => {
          return color === 'success' ? theme.palette.success.contrastText : theme.palette.warning.contrastText;
        },
      }}
    />
  );
};

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
  let progressColor: 'error' | 'warning' | 'success' = 'success';
  let tColor = '#ffffff';

  if (props.value < 30) {
    progressColor = 'error';
    tColor = '#444';
  } else if (props.value < 70) {
    progressColor = 'warning';
    tColor = '#444';
  }
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <LinearProgress variant="determinate" color={progressColor} {...props} sx={{ height: 16 }} />
      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: (theme) => (theme.palette.mode === 'dark' ? '#ffffff' : tColor),
        }}
      >
        {`${props.value}%`}
      </Typography>
    </Box>
  );
}

const FiveStarRating = ({ value }: { value: number }) => {
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

export const DataGridRow: React.FC<DataGridRowProps> = ({
  row,
  index,
  columns,
  childrens,
  isSelected,
  isExpanded,
  onRowClick,
  onExpandToggle,
  onCellClick,
  options,
  visibleColumns,
}) => {
  const {
    currencyOptions,
    dateFormat,
    enableCellClick,
    textEllipsis,
    enableSerialNumber,
    fontSize,
    color,
    rowActions,
    toolbarOptions,
  } = options || {};
  const { enableDeleteAll } = toolbarOptions || {};
  const { currencyCode = 'INR', locale = 'en-IN', decimal } = currencyOptions || {};
  // prettier-ignore
  const numberFormat = (value: any,) => new Intl.NumberFormat(locale, {
    style: currencyCode ? 'currency' : 'decimal',
    currency: currencyCode,
    minimumFractionDigits: decimal ?? 0,
    maximumFractionDigits: decimal ?? 2,
  }).format(value ?? 0);

  const filteredColumns = visibleColumns
    ? columns.filter((column: any) => visibleColumns[column.field] !== false)
    : columns;

  const handleCellClick = (obj: Record<string, unknown>, field: string) => {
    onCellClick?.(obj, field);
  };

  const renderCellContent = (rows: Record<string, unknown>, column: any, idx: number) => {
    const columnKey = column?.field;
    const value = rows[columnKey];

    if (!column || value === undefined || value === null) {
      return '';
    }

    if (typeof column.renderCell === 'function') {
      return column.renderCell(rows, idx);
    }

    if (column.dataType === 'Date' || column.dataType === 'date') {
      return moment(value).format(dateFormat);
    }

    if (column.dataType === 'boolean') {
      return getTFLabel(Boolean(value));
    }

    if (currencyOptions && column.dataType === 'currency') {
      return numberFormat(value);
    }

    if (column.dataType === 'progress') {
      return <LinearProgressWithLabel value={Number(value ?? 0)} />;
    }

    if (column.dataType === 'feedback') {
      return <FiveStarRating value={Number(value ?? 0)} />;
    }

    if (typeof value === 'string') {
      const displayValue = value.length > textEllipsis ? `${value.substring(0, textEllipsis)}...` : value;
      return value.length > textEllipsis ? (
        <Tooltip title={value} arrow>
          <span style={{ fontSize: fontSize || '14px' }}>{displayValue}</span>
        </Tooltip>
      ) : (
        value
      );
    }
    return value;
  };

  return (
    <>
      {/* Main Row */}
      <TableRow
        hover
        selected={isSelected}
        role="checkbox"
        tabIndex={-1}
        sx={{ background: row.bgColor ?? 'transparent' }}
      >
        {enableSerialNumber && (
          <TableCell padding="checkbox">
            <span style={{ fontSize: fontSize || '14px' }}>
              <b>{index + 1}</b>
            </span>
          </TableCell>
        )}

        {/* Expand/Collapse Button Column */}
        {childrens && childrens.length > 0 && (
          <TableCell padding="none" width={8}>
            <IconButton aria-label="expand row" size="small" onClick={() => onExpandToggle(index)}>
              {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
        )}
        {/* Checkbox Column */}
        {enableDeleteAll && (
          <TableCell padding="checkbox">
            <FormControlLabel
              key={index?.toString()}
              control={
                <Checkbox
                  color={color || 'primary'}
                  size="small"
                  checked={isSelected}
                  onClick={(event) => onRowClick(event, index)}
                />
              }
              label={''}
            />
          </TableCell>
        )}
        {/* Data Columns */}
        {filteredColumns.map((column: any, idx: number) => (
          <TableCell
            onClick={() => handleCellClick(row, column.field)}
            align={column.align || 'left'}
            style={{ width: column.width || 'auto', cursor: enableCellClick ? 'pointer' : 'auto' }}
            key={column.field || idx.toString()}
          >
            <span style={{ fontSize: fontSize || '14px' }}>{renderCellContent(row, column, index)}</span>
          </TableCell>
        ))}
        {/* Dynamic Row Action Buttons */}
        {rowActions && (
          <TableCell align="center">
            {rowActions?.map((action: any, idx: number) => (
              <Tooltip key={idx.toString()} title={action?.tooltip || ''} arrow>
                <IconButton
                  disabled={action?.disabled || false}
                  color={action?.color || 'primary'}
                  onClick={() => action?.onClick(row)}
                  aria-label={action?.tooltip?.toLowerCase() || 'action'}
                  size="small"
                >
                  <action.icon fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
          </TableCell>
        )}
      </TableRow>

      {/* Child Rows (Expandable) */}
      {childrens && childrens.length > 0 && (
        <TableRow>
          <TableCell
            style={{
              paddingBottom: 0,
              paddingTop: 0,
              borderBottom: isExpanded ? '1px solid rgba(224, 224, 224, 1)' : 0,
            }}
            colSpan={columns.length + 4}
          >
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Grid sx={{ p: 1 }} container spacing={2}>
                {childrens.map((column: any, idx: number) => (
                  <Grid key={idx.toString()} item xs={4} display="flex" alignItems="center" sx={{ ml: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontSize: fontSize || '14px' }}>
                      {column.headerName}:
                    </Typography>
                    <Typography variant="body2" style={{ marginLeft: '5px', fontSize: fontSize || '14px' }}>
                      {renderCellContent(row, column, index)}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};
