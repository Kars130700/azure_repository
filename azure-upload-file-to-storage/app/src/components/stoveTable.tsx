import * as React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { TextField } from '@mui/material';

interface Column {
  id: 'name' | 'location' | 'date';
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: number) => string;
}

const columns: readonly Column[] = [
  { id: 'name', label: 'Name', minWidth: 170 },
  { id: 'location', label: 'Location', minWidth: 100 },
  {
    id: 'date',
    label: 'Date',
    minWidth: 170,
    align: 'right',
    format: (value: number) => value.toLocaleString('en-US'),
  },
];

interface Data {
  name: string;
  location: string;
  date: number;
}

function createData(
  name: string,
  location: string,
  date: number,
): Data {
  return { name, location, date};
}

const rows = [
  createData("31000227", "Rwanda, Kigali", 102023)
];

interface StickyHeadTableProps {
  rowIndex: number;
  setRowIndex: React.Dispatch<React.SetStateAction<number>>;
  columnIndex: string;
  setColumn: React.Dispatch<React.SetStateAction<string>>
}

export default function StickyHeadTable( {rowIndex, setRowIndex, columnIndex, setColumn}: StickyHeadTableProps) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    console.log(event)
    setPage(newPage);
    setRowIndex(-1);
    setColumn("");
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table 
          stickyHeader 
          aria-label="sticky table" 
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.location}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell 
                          onClick={ () => {setRowIndex(index), setColumn(column.id)}}
                          key={column.id} 
                          align={column.align}
                        >
                          {rowIndex === index && columnIndex === column.id ? (
                            <TextField />
                          ) : (
                            column.format && typeof value === 'number' ? (
                              column.format(value)
                            ) : (
                              value
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
