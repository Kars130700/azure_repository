import {useDropzone} from 'react-dropzone';
import './dragAndDrop.css';
import ControlPointRoundedIcon from '@mui/icons-material/ControlPointRounded';

interface AcceptProps {
  onFilesAccepted: (files: File[]) => void;
}

const Accept: React.FC<AcceptProps> = ({ onFilesAccepted }) => {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/plain': [".DAT"],  // Allow .txt files
    },
    onDrop: (files) => {
      onFilesAccepted(files); // Call the callback with accepted files
    },
  });
  
  const filesSelectedText =
    acceptedFiles.length > 0 ? (
      <p className="drag-drop-text">{acceptedFiles.length} file(s) have been selected</p>
    ) : (
      <p className="drag-drop-text">
        <ControlPointRoundedIcon color="disabled" fontSize="large"/>
        Drag & Drop or click to choose .dat files
      </p>
    );

  return (
    <section className="container">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        {filesSelectedText}
      </div>
      
    </section>
  );
};

export default Accept