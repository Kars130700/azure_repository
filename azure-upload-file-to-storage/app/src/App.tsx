import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ChangeEvent, useState } from 'react';
import ErrorBoundary from './components/error-boundary';
import NavBar from './components/navbar';
import { convertFileToArrayBuffer } from './lib/convert-file-to-arraybuffer';
import DragDropFile from './components/dragAndDrop';
import axios, { AxiosResponse } from 'axios';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  aggregated: string;
  lifetime: string;
  yearly: string;
  monthly: string;
  daily: string;
  PDFChecked: string;
  ExcelChecked: string;
  filenames: string[];
  email: string;
}
type ValidKeys = 'lifetime' | 'yearly' | 'monthly' | 'daily' | 'PDFChecked' | 'ExcelChecked';

function App() {
  const containerName = `upload`;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [email, setEmail] = useState('');
  const [AggregatedChecked, SetAggregatedChecked] = useState<string>('false');
  const [LifetimeChecked, SetLifetimeChecked] = useState<string>('false');
  const [MonthlyChecked, SetMonthlyChecked] = useState<string>('false');
  const [DailyChecked, SetDailyChecked] = useState<string>('false');
  const [PDFChecked, SetPDFChecked] = useState<string>('false');
  const [ExcelChecked, SetExcelChecked] = useState<string>('false');
  const notifyError = (text : string) =>  {
        toast.error(text, {
        position: "bottom-center"
      })
    };
  const notifyUpload = (text : string) =>  {
      toast.success(text, {
      position: "bottom-center"
    })
  };
  const handleOutputChange = (input : string) => {
    if (input === 'PDF') {
      SetPDFChecked('true');
      SetExcelChecked('false');
    } else if (input === 'Excel') {
      SetPDFChecked('false');
      SetExcelChecked('true');
    }
  };

  const validateInputs = (data: InputData) => {
    const timePeriods: ValidKeys[] = ['lifetime', 'yearly', 'monthly', 'daily'];
    const fileFormats: ValidKeys[] = ['PDFChecked', 'ExcelChecked'];

    const isValidTimePeriod = timePeriods.some((period) => data[period] === 'true');
    const isValidFileFormat = fileFormats.some((format) => data[format] === 'true');

    return isValidTimePeriod && isValidFileFormat;
  };
  const handleFilesAccepted = (files : File[]) => {
    setSelectedFiles(files);
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
    }
    else {
      notifyError('Please provide a valid email address')
    }

  }
  const handleFileUpload = () => {
    if (selectedFiles.length == 0) {
      notifyError('No files are selected');
      return;
    }
    const filenames = selectedFiles.map(file => file.name);
    const inputs = {
      'aggregated': AggregatedChecked,
      'lifetime': LifetimeChecked,
      'yearly': 'false',
      'monthly': MonthlyChecked,
      'daily': DailyChecked,
      'PDFChecked': PDFChecked,
      'ExcelChecked': ExcelChecked,
      'filenames': filenames,
      'email': email
    }
    if (!validateInputs(inputs)) {
      notifyError('Please select a time period and filetype')
      return;
    }
    // Converts bool to string, can be more efficient
    const aggregatedCheckedValue = AggregatedChecked ? 'true' : 'false';
    console.log(aggregatedCheckedValue);
    EmailValidation(email);
    
    Promise.all(
      selectedFiles.map((file) => {
        // Fetch SAS token htmlFor the current file
        return request
          .post(
            `/api/sas?file=${encodeURIComponent(
              file.name
            )}&permission=w&container=${containerName}&timerange=5`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
          .then((result: AxiosResponse<SasResponse>) => {
            const { data } = result;
            const { url } = data;
            console.log(`SAS Token URL htmlFor ${file.name}: ${url}`);
            // Upload the file using the obtained SAS token
            return convertFileToArrayBuffer(file).then((fileArrayBuffer) => {
              if (
                fileArrayBuffer === null ||
                fileArrayBuffer.byteLength < 1 ||
                fileArrayBuffer.byteLength > 256000
              )
                return;
              console.log('we hebben nu de request gehad');
              const blockBlobClient = new BlockBlobClient(url);
              return blockBlobClient.uploadData(fileArrayBuffer);
            });
          });
          console.log(uploadStatus)
          
      })
    )
      .then(() => {

        request
          .post('https://mimimotofunction.azurewebsites.net/api/http_trigger', inputs,
            {
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .catch((error: unknown) => {
            // Handle errors
            notifyError('Something went wrong, please try again');
            console.error(error);
          });
        
        // All files uploaded successfully
        notifyUpload('Successfully finished upload');
        // Fetch the updated file list
        return request.get(`/api/list?container=${containerName}`);
      })
      .catch((error: unknown) => {
        // Handle errors
        if (error instanceof Error) {
          const { message, stack } = error;
          notifyError(message);
          setUploadStatus(
            `Failed to finish upload with error: ${message} ${stack || ''}`
          );
        } else {
          setUploadStatus(error as string);
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
            <h1 className='h1'>Upload files</h1>
            <DragDropFile onFilesAccepted={handleFilesAccepted}></DragDropFile>
            <h2>Export options</h2>
              <div className='filler'></div>
              <div className='checkboxes-left'>
                <div className='box-label'>
                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault1" onChange={() => SetAggregatedChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))} / >
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Create aggregated file
                </label>
                </div>
                <div className='box-label'>
                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault5" onChange={() => SetLifetimeChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))}/>
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Display lifetime usage
                </label>
                </div>
                <div className='box-label'>
                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault3" onChange={() => SetMonthlyChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))}/>
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Display usage per month
                </label>
                </div>
              </div>
              <div className='checkboxes-right'>
                <div className='box-label'>
                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault4" onChange={() => SetDailyChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))}/>
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Display usage per day
                </label>
                </div>
                <div className='box-label'>
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" onChange={() => handleOutputChange('PDF')}/>
                <label className="form-check-label" htmlFor="flexRadioDefault1">
                  Create PDF file
                </label>
                </div>  
                <div className='box-label'> 
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" onChange={() => handleOutputChange('Excel')}/>
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Create excel file
                </label>
                </div>  
              </div>
              <div className='filler'></div>
              <div className='upload-button-div'>
              <TextField
                required
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
