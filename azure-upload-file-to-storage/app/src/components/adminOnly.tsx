import { ChangeEvent, useState } from 'react';
import { Button, TextField } from '@mui/material';
import axios from 'axios';

const handleAdminProcessing = async (filenames: string[]) => { // Make function async
    const url = 'https://mimimotofunction.azurewebsites.net/api/http_trigger_admin?';
    console.log(filenames);
    const jsonPayload = {
        filenames
    };

    try {
        console.log("we're going to post");
        const response = await axios.post(url, jsonPayload); // Await the response
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error during POST request:', error);
    }
}

const AdminOnly = () => {
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        // Split the input string by commas and remove any leading/trailing whitespace
        const files = value.split(',').map(file => file.trim());
        setSelectedFiles(files);
    }
    const handleClick = () => {
        handleAdminProcessing(selectedFiles).catch((error) => {
            console.error('Unhandled promise rejection: ', error);
        });
    }

    return (
        <div className='backgroundAdmin'>
             <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Overview files</h1>
            <h2 style={{ fontSize: '1.5em', marginBottom: '10px' }}>- Admin only -</h2>
            <h2 style={{ fontSize: '1em', marginBottom: '10px' }}>Please specify the files you would like to have a detailed overview from. These files can be downloaded on the Azure storage</h2>
            <h2 style={{ fontSize: '1em', marginBottom: '5px' }}>Format:</h2>
            <h2 style={{ fontSize: '1em', marginBottom: '20px' }}>420000297.TXT, 420000285.TXT, etc</h2>
            <div className='upload-button-div'>
                <TextField
                    required
                    className='locationpicker'
                    id="outlined-required"
                    label="Files to make overview file from"
                    helperText='*Required'
                    size='small'
                    color='secondary'
                    onChange={handleFileChange}
                />
            </div>
            <div className='upload-button-div'>
                <Button 
                  color='secondary' 
                  variant="contained" 
                  onClick={handleClick}
                >
                  Upload
                </Button>
            </div>
        </div>
    )
}
export default AdminOnly;