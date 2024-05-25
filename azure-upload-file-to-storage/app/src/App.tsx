import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ChangeEvent, useState, useRef, useEffect } from 'react';
import ErrorBoundary from './components/error-boundary';
import NavBar from './components/navbar';
import { convertFileToArrayBuffer } from './lib/convert-file-to-arraybuffer';
import DragDropFile from './components/dragAndDrop';
//import signalRService from './components/signalRservice';
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
import DownloadTable from './components/downloadTable';
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
  name: string;
  // To debug, should not be Data, but string list
  locations: string[];
  dates: string[];
}

interface Data {
  name: string;
  location: string;
  date: string;
}
interface TableData {
  id: number;
  fileName: string;
  uploaderName: string;
  date: string;
  url: string 
}
interface UserData {
  username: string;
  password: string;
  tableData: TableData[];
  login: boolean;
}
// interface Message {
//   user: string;
//   message: string;
// }

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
interface Props{
  username: string;
  //debug: should password be here?
  password: string;
  tableDataOriginal: TableData[];
}
function App({ username, password, tableDataOriginal }: Props) {
  const containerName = 'upload';
  const [tableData, setTableData] = useState<TableData[]>(tableDataOriginal);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [PDFChecked, setPDFChecked] = useState<boolean>(false);
  const [ExcelChecked, setExcelChecked] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rowIndex, setRowIndex] = useState(-1);
  const [columnIndex, setColumn] = useState("");
  const [rows, setRows] = useState<Data[]>([]);
  const [downloadURL, setURL] = useState("");

  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, '0');
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const year = currentDate.getFullYear();
  const date = `${day}-${month}-${year}`;

  const notifyError = (text: string) => {
    toast.error(text, {
      position: "bottom-center"
    });
  };

  const notifyUploading = useRef<Id>("");

  const handleOpenDateDialog = () => {
    if (selectedFiles.length === 0) {
      notifyError("Please select at least 1 file");
    } else {
      setDialogOpen(true);
    }
  };

  const handleDateFieldChange = (rowInd: number, value: Dayjs | null, allRows: boolean) => {
    if (rows.length !== 0 && value !== null) {
      if (allRows) {
        setRows(rows.map((row) => ({ ...row, date: value.format('DD/MM/YYYY') })));
      } else {
        const updatedRows = [...rows];
        updatedRows[rowInd].date = value.format('DD/MM/YYYY');
        setRows(updatedRows);
      }
    }
  };

  const handleLocationFieldChange = (rowInd: number, value: string | null, allRows: boolean) => {
    if (rows.length !== 0 && value !== null) {
      const oldValue = rows[rowInd].location;
      if (allRows) {
        setRows(rows.map((row) => ({
          ...row,
          location: row.location === oldValue || row.location === "" ? value : row.location
        })));
      } else {
        const updatedRows = [...rows];
        updatedRows[rowInd].location = value;
        setRows(updatedRows);
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setRowIndex(-1);
    setColumn("");
  };

  const handleOutputChange = (input: string) => {
    setPDFChecked(input === 'PDF');
    setExcelChecked(input === 'Excel');
  };

  const validateInputs = (data: InputData) => data.PDFChecked || data.ExcelChecked;

  const handleFilesAccepted = (files: File[]) => {
    setSelectedFiles(files);
    const newRows = files.map((file) => createData(removeExtension(file.name), "", dayjs().format('DD/MM/YYYY')));
    setRows(newRows);
  };

  const handleOnEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleOnNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const emailValidation = (email: string) => {
    // eslint-disable-next-line no-useless-escape
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(email)) {
      setEmail(email);
      return true;
    } else {
      notifyError('Please provide a valid email address');
      return false;
    }
  };

  const filenames = selectedFiles.map(file => file.name);
  const locations = rows.map(row => row.location);
  const dates = rows.map(row => row.date);
  const lastModifiedDates: string[] = [];
  addLastModifiedDates(selectedFiles, lastModifiedDates);

  const inputs = {
    PDFChecked,
    ExcelChecked,
    email,
    name,
    filenames,
    locations,
    dates,
    lastModifiedDates
  };

  function addLastModifiedDates(selectedFiles: File[], lastModifiedDates: string[]) {
    lastModifiedDates.length = 0;
    selectedFiles.forEach(file => {
      lastModifiedDates.push(new Date(file.lastModified).toLocaleString());
    });
  }

  const validationChecks = () => {
    if (selectedFiles.length === 0) {
      notifyError('No files are selected');
      return false;
    }
    if (!validateInputs(inputs)) {
      notifyError('Please select a time period and filetype');
      return false;
    }
    if (!emailValidation(email)) return false;
    return true;
  };

  const fetchSasToken = async (file: File, folderName: string) => {
    try {
      //DEBUG TODO foldername moet gecheckt wordne
      const fileName = encodeURIComponent(`${folderName}/${file.name}`);
      //inputs['filenames'] = inputs['filenames'].map(filename => `${folderName}/${filename}`);
      const result = await axios.post<SasResponse>(
        `/api/sas?file=${fileName}&permission=w&container=${containerName}&timerange=5`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return { url: result.data.url };
    } catch (error) {
      notifyError("SAS code not generated");
      throw error;
    }
  };

  const uploadFileWithToken = async (file: File, url: string) => {
    const fileArrayBuffer = await convertFileToArrayBuffer(file);
    if (fileArrayBuffer && fileArrayBuffer.byteLength > 0 && fileArrayBuffer.byteLength <= 256000) {
      const blockBlobClient = new BlockBlobClient(url);
      await blockBlobClient.uploadData(fileArrayBuffer);
    }
  };

  const getURL = (sentence: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = sentence.match(urlRegex);
    return match ? match[1] : "";
  };

  useEffect(() => {
    const updateTableDataInDataBase = async () => {
      const url = 'https://cmmtrigger3.azurewebsites.net/api/LoginFunction?';
      const jsonPayload: UserData = {
        username,
        password,
        tableData,
        login: false,
      };

      try {
        const response = await axios.post(url, jsonPayload);
        console.log('Response:', response.data);
      } catch (error) {
        notifyError("Table not saved correctly");
      }
    };

    if (downloadURL !== '') {
      const lastIndex = tableData.length - 1;
      if (lastIndex >= 0) {
        const newTableData = [...tableData];
        newTableData[lastIndex].url = downloadURL;
        setTableData(newTableData);
        updateTableDataInDataBase().catch((error) => {
          console.error('Unhandled promise rejection:', error);
      });
        setURL("");
      }
    }
    console.log('rerender');
  }, [downloadURL, tableData, username, password]);

  const addTableData = (fileName: string, uploaderName: string, url: string) => {
    const id = tableData.length + 1;
    const newTableData = [...tableData, { id, fileName, uploaderName, date, url }];
    setTableData(newTableData);
  };

  const handleFileName = () => {
    let _fileName = "";
    if (PDFChecked) {
      _fileName = "MM" + name.replace(/\s/g, "") + date + ".pdf";
    } else {
      _fileName = "MM" + name.replace(/\s/g, "") + date + ".xlsx";
    }
    addTableData(_fileName, name, "");
    handleFileUpload();
  };

  const handleFileUpload = () => {
    
    if (!validationChecks()) {
      return;
    }
    const notify = (text : string) => notifyUploading.current = toast(text, {type: "info", isLoading: true, position: "bottom-center"});
    notify("Uploading Files")
      Promise.all(
        selectedFiles.map((file) => {
          return fetchSasToken(file, name).then(({ url }) => {
            return uploadFileWithToken(file, url);
          });
        })
      )
      //First, we convert the .DAT files to .TXT files, using the MM_Decoder
      .then(() => {
        toast.update(notifyUploading.current, {render: "Uploading complete", type: "success", isLoading: false, autoClose: 5000})
        notify("Converting files from .DAT to .TXT")
        inputs.dates = rows.map(row => row.date);
        console.log(inputs)
        return request.post('https://cmmtrigger3.azurewebsites.net/api/HttpTrigger1?', inputs, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      })
      .then(() => {
        toast.update(notifyUploading.current, {render: "Conversion complete", type: "success", isLoading: false, autoClose: 5000})
        notify("Making Excel or PDF document")
        inputs['filenames'] = inputs['filenames'].map(filename => filename.replace('.DAT', '.TXT'));
        inputs.locations = rows.map(row => row.location);
        return request.post('https://mimimotofunction.azurewebsites.net/api/http_trigger', inputs, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      })
      .then((response: AxiosResponse<string>) => {
        // All files uploaded successfully
        toast.update(notifyUploading.current, {render: "Documents ready", type: "success", isLoading: false, autoClose: 5000});
        const responseData = response.data
        //DEBUG
        const url = getURL(responseData)
        setURL(url)
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
  // const [messages, setMessages] = useState<Message[]>([]);
  // const [user, setUser] = useState<string>('');
  // const [message, setMessage] = useState<string>('');

  // useEffect(() => {
  //   signalRService.startConnection('https://cmmtrigger3.azurewebsites.net/api/SignalRFunction?');

  //   signalRService.onReceiveMessage((receivedUser: string, receivedMessage: string) => {
  //     setMessages((prevMessages) => [...prevMessages, { user: receivedUser, message: receivedMessage }]);
  //   });

  //   return () => {
  //     signalRService.connection?.stop().catch(error => console.error('Error stopping SignalR connection:', error));
  //   };
  // }, []); // Make sure to remove `messages` from the dependency array to prevent infinite re-renders

  // const debug = () => {
  //   setUser ("Kars");
  //   setMessage("sjongejonge zeg");
  //   console.log(messages)
  //   sendMessage()
  // }
  // const sendMessage = () => {
  //   signalRService.sendMessage(user, message);
  //   setMessage('');
  // };
  document.body.style.backgroundColor = '#F1F1F1';
  return (
    <>
    <NavBar/>
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
                      format="DD/MM/YYYY"
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
              <TextField
                required
                autoComplete='name'
                id="outlined-required"
                label="Name"
                helperText='*Required'
                size='small'
                color='secondary'
                value={name}
                onChange={ handleOnNameChange }
              />
              </div>
              <div className='upload-button-div'>
                <Button component="label" 
                  color='secondary' 
                  variant="contained" 
                  startIcon={<CloudUploadIcon />} 
                  onClick={handleFileName}
                  //onClick={debug}
                  >
                  Upload
                </Button>
              </div>
              <DownloadTable tableData={tableData} setTableData={setTableData} />
              <ToastContainer />
          </div>
        </Box>
      </ErrorBoundary>
    </div>
    </>
  );
}
export default App;
