import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ChangeEvent, useState, useRef } from 'react';
import ErrorBoundary from './components/error-boundary';
import NavBar from './components/navbar';
import { convertFileToArrayBuffer } from './lib/convert-file-to-arraybuffer';
import DragDropFile from './components/dragAndDrop';
import axios, { AxiosResponse } from 'axios';
import './App.css';
import { Id, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import StickyHeadTable from './components/stoveTable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

// Used only htmlFor local development
const API_SERVER = import.meta.env.VITE_API_SERVER as string;

const request = axios.create({
  baseURL: API_SERVER,
  headers: {
    'Content-type': 'application/json'
  }
});

type SasResponse = {
  url: string;
};
interface InputData {
  PDFChecked: boolean;
  ExcelChecked: boolean;
  filenames: string[];
  email: string;
  // To debug, should not be Data, but string list
  locations: string[];
  dates: string[];
}

interface Data {
  name: string;
  location: string;
  date: string;
}

function createData(
  name: string,
  location: string,
  date: string,
): Data {
  return { name, location, date};
}

function removeExtension(filename : string): string{
  return filename.replace(/\.[^/.]+$/, "")
}

function App() {
  const containerName = `upload`;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [email, setEmail] = useState('');
  const [PDFChecked, SetPDFChecked] = useState<boolean>(false);
  const [ExcelChecked, SetExcelChecked] = useState<boolean>(false);
  const [dialogOpen, SetDialogOpen] = useState(false);

  const [rowIndex, setRowIndex] = useState(-1);
  const [columnIndex, setColumn] = useState("");
  //const [location, setLocation] = useState("");
  // const [date, setDate] = useState(202020);
  const [rows, setRows] = useState<Data[]>([])

  const notifyError = (text : string) =>  {
        toast.error(text, {
        position: "bottom-center"
      })
    };
  // const notifyUpload = (text : string) =>  {
  //     toast.success(text, {
  //     position: "bottom-center"
  //   })
  // };
  
  const notifyUploading = useRef<Id>("");
  
  const handleOpenDateDialog = () => { 
    if (selectedFiles.length == 0){
      notifyError("Please select at least 1 file");
  }else
      { SetDialogOpen(true);}

  };

  const handleDateFieldChange = (rowInd: number, value: Dayjs | null, allRows: boolean) => {
    if (rows.length !== 0)
    { if (value !== null && value !== undefined)
    { if (allRows){
      rows.map((row) => row["date"] = value.format('MM/DD/YYYY'))
      }
      else {
        rows[rowInd]["date"] = value.format('MM/DD/YYYY')
      }
    }
    }
  };
  
  const handleLocationFieldChange = (rowInd: number, value: string | null, allRows: boolean) => {
    if (rows.length !== 0) {
      const oldValue = rows[rowInd]["location"];
      if (value !== null && value !== undefined)
      if (allRows) {
        console.log(value);
        rows.forEach((row) => {
          if (row["location"] === oldValue || row["location"] === "") {
            row["location"] = value;
          }
        });
      } else {
        rows[rowInd]["location"] = value;
      }
    }
  };
  const handleCloseDialog = () => {
    SetDialogOpen(false);
    setRowIndex(-1);
    setColumn("");
  };
  
  const handleOutputChange = (input : string) => {
    if (input === 'PDF') {
      SetPDFChecked(true);
      SetExcelChecked(false);
    } else if (input === 'Excel') {
      SetPDFChecked(false);
      SetExcelChecked(true);
    }
  };

  const validateInputs = (data: InputData) => {
    return data.PDFChecked || data.ExcelChecked;
  };

  //debug, would be better if the array became empty after the user selected the files (not on pressing the upload box)
  const handleFilesAccepted = (files : File[]) => {
    setSelectedFiles(files);
    rows.length = 0
    files.forEach((file) => {rows.push(createData(removeExtension(file.name), "", dayjs('2022-04-17').format('DD/MM/YYYY')))})
    setRows(rows)
  };
  const handleOnEmailChange = (event : ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    setEmail(email);
  }
  const EmailValidation = (email : string) => {
    // eslint-disable-next-line no-useless-escape
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if ( re.test(email) ) {
        setEmail(email);
        return true;
    }
    else {
      notifyError('Please provide a valid email address')
      return false;
    }

  }
  const filenames = selectedFiles.map(file => file.name);
  const locations = rows.map(row => row.location);
  const dates = rows.map(row => row.date);
  const inputs = {
    'PDFChecked': PDFChecked,
    'ExcelChecked': ExcelChecked,
    'email': email,
    'filenames': filenames,
    'locations': locations,
    'dates': dates,
  }
  const validationChecks = () => {
    if (selectedFiles.length == 0) {
      notifyError('No files are selected');
      return false;
    }
    if (!validateInputs(inputs)) {
      notifyError('Please select a time period and filetype')
      return false;
    }
    if(!EmailValidation(email)) {return false}
    console.log(inputs)
    return true;
  }
  
  const fetchSasToken = (file : File) => {
    return request
      .post(
        `/api/sas?file=${encodeURIComponent(file.name)}&permission=w&container=${containerName}&timerange=5`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((result: AxiosResponse<SasResponse>)  => {
        const { data } = result;
        return { url: data.url };
      })
      .catch((error) => {
        if (error instanceof Error) {
          const { message, stack } = error;
          toast.update(notifyUploading.current, {render: (`Failed to finish upload with error: ${message} ${stack || ''}`), type: "error", isLoading: false, autoClose: 5000});
          throw error
        } else {
          toast.update(notifyUploading.current, {render: error as string, type: "error", isLoading: false, autoClose: 5000});
          throw error
        }
      });
  };
  
  const uploadFileWithToken = (file : File, url : string) => {
    return convertFileToArrayBuffer(file).then((fileArrayBuffer) => {
      if (
        fileArrayBuffer === null ||
        fileArrayBuffer.byteLength < 1 ||
        fileArrayBuffer.byteLength > 256000
      ) {
        return;
      }
      const blockBlobClient = new BlockBlobClient(url);
      return blockBlobClient.uploadData(fileArrayBuffer);
    });
  };
  const handleFileUpload = () => {
    if (!validationChecks()) {
      return;
    }
    const notify = (text : string) => notifyUploading.current = toast(text, {type: "info", isLoading: true, position: "bottom-center"});
    notify("Uploading Files")
      Promise.all(
        selectedFiles.map((file) => {
          return fetchSasToken(file).then(({ url }) => {
            return uploadFileWithToken(file, url);
          });
        })
      )
      
      .then(() => {
        toast.update(notifyUploading.current, {render: "Uploading complete", type: "success", isLoading: false, autoClose: 5000})
        notify("Converting files")
        return request.post('https://cmmtrigger3.azurewebsites.net/api/HttpTrigger1?', inputs, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      })
      .then(() => {
        toast.update(notifyUploading.current, {render: "Uploading complete", type: "success", isLoading: false, autoClose: 5000})
        notify("Emailing Files")
        inputs['filenames'] = inputs['filenames'].map(filename => filename.replace('.DAT', '.TXT'));
        inputs.locations = rows.map(row => row.location);
        inputs.dates = rows.map(row => row.date);
        console.log(rows);
        return request.post('https://mimimotofunction.azurewebsites.net/api/http_trigger', inputs, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      })
      .then(() => {
        // All files uploaded successfully
        toast.update(notifyUploading.current, {render: "Emailed succesfully", type: "success", isLoading: false, autoClose: 5000});
        // Fetch the updated file list
        return request.get(`/api/list?container=${containerName}`);
      })
      .catch((error) => {
        // Handle errors
        if (error instanceof Error) {
          const { message, stack } = error;
          toast.update(notifyUploading.current, {render: (`Failed to finish upload with error: ${message} ${stack || ''}`), type: "error", isLoading: false, autoClose: 5000});
        } else {
          toast.update(notifyUploading.current, {render: error as string, type: "error", isLoading: false, autoClose: 5000});
        }
      });
  };

  return (
    <>
    <body className= 'body'>
      <NavBar></NavBar>
    <div className='app-container'>
      <ErrorBoundary>
        <Box>
          <div className='backgroundDragDrop'>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto&display=swap"/>
            <h1 style={{ fontSize: '2em' }}>Upload files</h1>
            <DragDropFile onFilesAccepted={handleFilesAccepted}></DragDropFile>
            <h2 style={{ fontSize: '1.5em' }}>Export options</h2>
              <div className='filler'></div>
                <div className='checkboxes-left'>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      className = "datepicker"
                      label="Day of collection"
                      slotProps={{ textField: { size: 'small' } }}
                      defaultValue={dayjs()}
                      onChange = {(newValue : Dayjs | null) => handleDateFieldChange(0, newValue, true)}/>
                  </LocalizationProvider>
                </div>
                <div className='checkboxes-right'>
                <TextField
                      required
                      className='locationpicker'
                      id="outlined-required"
                      label="Location of collection"
                      helperText='*Required'
                      size='small'
                      color='secondary'
                      onChange={ (newLocation) => handleLocationFieldChange(0, newLocation.target.value, true) }
                    />
                </div>
              <div className='filler'></div>
              <div className='filler'/>
              <div className='specify-per-stove-div'>
                <Button size= 'medium' color = 'secondary' variant="contained" onClick={handleOpenDateDialog} className='specify-button'>
                Specify per stove
                </Button>
                <Dialog
                  open={dialogOpen}
                  onClose={handleCloseDialog}
                  PaperProps={{
                    component: 'form',
                    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      handleCloseDialog();
                    },
                  style: { maxWidth: '40vw',
                    width: "100%",}
                  }}>
                  <DialogTitle>Stove information</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Indicate the date of data collection for each stove.
                    </DialogContentText>
                    <StickyHeadTable 
                    rowIndex={rowIndex} 
                    setRowIndex = {setRowIndex} 
                    columnIndex={columnIndex} 
                    setColumn={setColumn} 
                    rows={rows} 
                    setRows={setRows} 
                    handleDateFieldChange={handleDateFieldChange}
                    handleLocationFieldChange = {handleLocationFieldChange}/>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button type="submit">Submit</Button>
                  </DialogActions>
                </Dialog>
              </div>
              
              <div className='filler'></div>
              <div className='upload-button-div'>
              <div className='filler'></div>
              <div className='checkboxes-left'>
                <div className='box-label'>
                  <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" onChange={() => handleOutputChange('PDF')}/>
                  <label className="form-check-label" htmlFor="flexRadioDefault1">
                    Create PDF file
                  </label>
                </div>
                <div className='box-label'> 
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" onChange={() => handleOutputChange('Excel')}/>
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Create Excel file
                </label>
                </div> 
              </div>
              <div className='checkboxes-right'/>
              <div className='filler'/>
              </div>              
              <div className='upload-button-div'>
              <TextField
                required
                autoComplete='email'
                id="outlined-required"
                label="E-mail"
                helperText='*Required'
                size='small'
                color='secondary'
                value={email}
                onChange={ handleOnEmailChange }
              />
              </div>
              <div className='upload-button-div'>
                <Button component="label" color='secondary' variant="contained" startIcon={<CloudUploadIcon />} onClick={handleFileUpload}>
                  Upload
                </Button>
              </div>
              <ToastContainer />
          </div>
        </Box>
      </ErrorBoundary>
    </div>
    </body>
   </> 
  );
}
export default App;
