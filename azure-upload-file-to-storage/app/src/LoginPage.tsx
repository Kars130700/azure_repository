import { useState } from 'react';
import { Button } from '@mui/material';
import App from './App'; // Import the component you want to navigate to

//Maybe use Router stuff to fix this problem and increase scalability
interface TableData {
    id: number;
    fileName: string;
    uploaderName: string;
    date: string;
    url: string
  }

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [tableData, setTableData] = useState<TableData[]>([]);

  const onLogin = (username: string, password: string) => {
    console.log(username);
    console.log(password);
    console.log("CheckingPW...");

    // Check if login is successful (replace this with your actual login logic)
    const isLoginSuccessful = true; // For example
    if (isLoginSuccessful) {
      setIsLoggedIn(true); // Set isLoggedIn to true upon successful login
    }
    const fakeTableData: TableData[] = [ 
        {id: 1,
        fileName: "example.txt",
        uploaderName: "John Doe",
        date: "2024-04-20",
        url: "https://example.com/example.txt"}];
      setTableData(fakeTableData);
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
      </div>
  );}
  else {
    return(
      <App tableDataOriginal={tableData} />// Render App component if logged in
  )}
}

export default LoginPage;
