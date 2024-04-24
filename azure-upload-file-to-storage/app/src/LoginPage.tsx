import { useState } from 'react';
import { Button } from '@mui/material';
import axios, { AxiosResponse } from 'axios';
import App from './App'; // Import the component you want to navigate to
import {  ToastContainer, toast } from 'react-toastify';

//Maybe use Router stuff to fix this problem and increase scalability
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
const notifyError = (text : string) =>  {
  toast.error(text, {
  position: "bottom-center"
})
};
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [tableData, setTableData] = useState<TableData[]>([]);

  async function checkLogin(): Promise<void> {
    const url = 'https://cmmtrigger3.azurewebsites.net/api/LoginFunction?';

    const jsonPayload: UserData = {
        username: username,
        password: password,
        tableData: [
        ],
        login: true,
    };

    try {
        const response: AxiosResponse = await axios.post(url, jsonPayload);
        console.log('Response:', response.data);
        setIsLoggedIn(true)
        setTableData(response.data as TableData[]);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Axios error
            notifyError("Login unsuccesful, please try again");
        } else {
            // Non-Axios error
            notifyError("Login unsuccesful, please try again");
        }
    }
}
  const onLogin = (username: string, password: string) => {
    console.log(username);
    console.log(password);
    console.log("CheckingPW...");

    // Check if login is successful (replace this with your actual login logic)
    checkLogin().catch((error) => {
      console.error('Unhandled promise rejection:', error)});
  };

  const handleByPass = () => {
    setIsLoggedIn(true)
  };
  // Conditional rendering: Render LoginPage if not logged in, otherwise render App
  if (!isLoggedIn){ 
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#F1F1F1', // Set background color to light gray
      }}>
        <div style={{
          background: 'white', // Set background color to white
          padding: '20px',
          borderRadius: '10px', // Set border radius to create rounded corners
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', // Add a slight shadow for depth
        }}>
          <h2>Login</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none' }}
              />
            </div>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <Button
              component="label"
              color='secondary'
              variant="contained"
              onClick={() => onLogin(username, password)}
            >
              Login
            </Button>
          </div>
          <div style={{ paddingTop: '10px' }}>
            <Button
              component="label"
              color='secondary'
              variant="contained"
              onClick={handleByPass}
            >
              Guest Access 
            </Button>
          </div>
        </div>
        <ToastContainer/>
      </div>
  );}
  else {
    return(
      <App username={username} password= {password} tableDataOriginal={tableData} />// Render App component if logged in
  )}
}

export default LoginPage;
