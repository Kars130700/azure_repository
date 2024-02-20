import { BlockBlobClient } from '@azure/storage-blob';
import { Box, Button, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ChangeEvent, useState } from 'react';
import ErrorBoundary from './components/error-boundary';
import NavBar from './components/navbar';
import { convertFileToArrayBuffer } from './lib/convert-file-to-arraybuffer';
import DragDropFile from './components/dragAndDrop';
import axios, { AxiosResponse } from 'axios';
import './App.css';

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
type ListResponse = {
  list: string[];
};

function App() {
  const containerName = `upload`;
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sasTokenUrl, setSasTokenUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [list, setList] = useState<string[]>([]);
  const [AggregatedChecked, SetAggregatedChecked] = useState<string>('false');
  const [LifetimeChecked, SetLifetimeChecked] = useState<string>('false');
  const [YearlyChecked, SetYearlyChecked] = useState<string>('false');
  const [MonthlyChecked, SetMonthlyChecked] = useState<string>('false');
  const [DailyChecked, SetDailyChecked] = useState<string>('false');
  const [PDFChecked, SetPDFChecked] = useState<string>('false');
  const [ExcelChecked, SetExcelChecked] = useState<string>('false');

  const handleFilesAccepted = (files : File[]) => {
    setSelectedFiles(files);
  };
  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const { target } = event;
  
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.files || target.files.length === 0) return;
  
    // Convert FileList to array and update state
    const filesArray = Array.from(target.files);
    setSelectedFiles(filesArray);
  
    // Reset other states
    setSasTokenUrl('');
    setUploadStatus('');
  };

  const handleFileSasToken = () => {
    const permission = 'w'; //write
    const timerange = 5; //minutes

    if (!selectedFiles[0]) return;

    request
      .post(
        `/api/sas?file=${encodeURIComponent(
          selectedFiles[0].name
        )}&permission=${permission}&container=${containerName}&timerange=${timerange}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then((result: AxiosResponse<SasResponse>) => {
        const { data } = result;
        const { url } = data;
        setSasTokenUrl(url);
      })
      .catch((error: unknown) => {
        if (error instanceof Error) {
          const { message, stack } = error;
          setSasTokenUrl(`Error getting sas token: ${message} ${stack || ''}`);
        } else {
          setUploadStatus(error as string);
        }
      });
  };

  const handleFileUpload = () => {
    if (selectedFiles.length === 0) return;
    // Converts bool to string, can be more efficient
    const aggregatedCheckedValue = AggregatedChecked ? 'true' : 'false';
    console.log(aggregatedCheckedValue);
    
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
          
      })
    )
      .then(() => {
        const filenames = selectedFiles.map(file => file.name);
        request
          .post('https://mimimotofunction.azurewebsites.net/api/http_trigger', {
            'aggregated': AggregatedChecked,
            'lifetime': LifetimeChecked,
            'yearly': YearlyChecked,
            'monthly': MonthlyChecked,
            'daily': DailyChecked,
            'PDFChecked': PDFChecked,
            'ExcelChecked': ExcelChecked,
            'filenames': filenames
          },
            {
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .catch((error: unknown) => {
            // Handle errors
            console.error(error);
          });
        
        // All files uploaded successfully
        setUploadStatus('Successfully finished upload');
        // Fetch the updated file list
        return request.get(`/api/list?container=${containerName}`);
      })
      .then((result: AxiosResponse<ListResponse>) => {
        // Update the file list
        const { data } = result;
        const { list } = data;
        setList(list);
      })
      .catch((error: unknown) => {
        // Handle errors
        if (error instanceof Error) {
          const { message, stack } = error;
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
                <div className='box-label'>
                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault5" onChange={() => SetLifetimeChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))}/>
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Display lifetime usage
                </label>
                </div>
                </div>
                <div className='box-label'>
                <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault2" onChange={() => SetYearlyChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))}/>
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  Display usage per year
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
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" onChange={() => SetPDFChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))} />
                <label className="form-check-label" htmlFor="flexRadioDefault1">
                  Create PDF file
                </label>
                </div>  
                <div className='box-label'> 
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" onChange={() => SetExcelChecked(prevValue => (prevValue === 'false' ? 'true' : 'false'))}/>
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Create excel file
                </label>
                </div>  
              </div>
              <div className='filler'></div>
              <div className='upload-button-div'>
                <Button component="label" color='secondary' variant="contained" startIcon={<CloudUploadIcon />} onClick={handleFileUpload}>
                  Upload
                </Button>
              </div>
          </div>       
          SAS Token Section
          {selectedFiles && (
            <Box
              display="block"
              justifyContent="left"
              alignItems="left"
              flexDirection="column"
              my={4}
            >
              <Button variant="contained" onClick={handleFileSasToken}>
                Get SAS Token
              </Button>
              {sasTokenUrl && (
                <Box my={2}>
                  <Typography variant="body2">{sasTokenUrl}</Typography>
                </Box>
              )}
            </Box>
          )} 
        </Box>
      </ErrorBoundary>
    </div>
    </body>
   </> 
  );
}

export default App;
