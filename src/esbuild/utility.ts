import { useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const exportExcel = ({ data, filename, extension }: any) => {
    return new Promise((resolve, reject) => {
        try {
            // Convert JSON data to Excel sheet
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = {
                Sheets: { Sheet1: ws },
                SheetNames: ['Sheet1'],
            };

            // Generate Excel buffer
            const excelBuffer = XLSX.write(wb, {
                bookType: 'xlsx',
                type: 'array',
            });

            // Create Blob for Excel file
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
            });

            // Create an anchor element and trigger download
            const a = document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = `${filename}${extension}`;
            a.click();
            resolve('success');
        } catch (error) {
            reject(error);
        }
    });
};

export const debounce = (callback: any, dependencies: any, delay: any) => {
    const memoizedCallback = useCallback(callback, dependencies);

    useEffect(() => {
        const handler = setTimeout(memoizedCallback, delay);

        return () => {
            clearTimeout(handler); // Cleanup the timeout on dependency changes
        };
    }, [memoizedCallback, delay]);
};