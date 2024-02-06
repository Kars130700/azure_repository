import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
const [progress, setProgress] = React.useState(0);
  const [showProgressBar, setShowProgressBar] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          //setShowProgressBar(false); // Hide progress bar after reaching 100%
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 500);
    setShowProgressBar(true);

    return () => {
      clearInterval(timer);
    };
  },[]);