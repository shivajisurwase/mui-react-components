import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Toolbar,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { TableSkeletonProps } from './modal';

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 6, columns = 6 }) => {
  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      {/* Toolbar with Search and Icons */}
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: '1px solid #dbdbdb',
        }}
      >
        {/* Left: Search Field */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rectangular" width={200} height={40} />
        </Box>

        {/* Right: Icon Buttons */}
        <Box>
          <Tooltip title="Filter">
            <IconButton>
              <Skeleton variant="circular" width={40} height={40} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Table */}
      <Table aria-label="loading table">
        {/* Table Head */}
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={`head-${index}`}>
                <Skeleton variant="rectangular" height={20} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* Table Body */}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                  <Skeleton animation="wave" variant="text" width="100%" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
