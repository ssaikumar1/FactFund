import "./init"
import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Profile from './components/Profile.jsx';
import CreateProposal from './components/CreateProposal';
import Landing from './components/Landing';
import Proposals from './components/Proposals';
import DonateProposal from './components/DonateProposal';
import AllProposals from './components/AllProposals';

import { useEffect, useState } from 'react';
import { canisterId, idlFactory, createActor, icpTransfer_backend } from '../../declarations/icpTransfer_backend';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  const [isPlugAvailable, setIsPlugAvailable] = useState(false)
  const [principal, setPrincipal] = useState(null)
  const [accountId, setAccountId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [actor, setActor] = useState(null)
  

  console.log("principal", principal)

  // Enhanced notify function with different toast types and promise support
  const notify = {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    warning: (msg) => toast.warning(msg),
    info: (msg) => toast.info(msg),
    default: (msg) => toast(msg),
    
    // Promise-based toast for loading states
    promise: (promise, messages) => {
      return toast.promise(
        promise,
        {
          pending: {
            render() {
              return messages.pending || 'Loading...';
            },
          },
          success: {
            render({ data }) {
              if (typeof messages.success === 'function') {
                return messages.success(data);
              }
              return messages.success || 'Success!';
            },
          },
          error: {
            render({ data }) {
              console.error('Promise toast error:', data);
              if (typeof messages.error === 'function') {
                return messages.error(data);
              }
              return messages.error || 'Something went wrong!';
            },
          }
        }
      );
    },

    // Async function wrapper for promise toasts
    async: async (asyncFn, messages) => {
      const promise = asyncFn();
      return notify.promise(promise, messages);
    }
  };

  return (
    <div>
      <Navbar 
        isConnected={isConnected} 
        principal={principal} 
        setPrincipal={setPrincipal} 
        setAccountId={setAccountId} 
        accountId={accountId}
        setIsConnected={setIsConnected} 
        setActor={setActor}
        notify={notify}
      />
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/createproposal" element={<CreateProposal notify={notify} actor={actor} />} />
        <Route path="/proposals" element={<Proposals notify={notify} actor={actor} />} />
        <Route path="/explore" element={<AllProposals notify={notify} actor={actor} />} />
        <Route
          path="/profile"
          element={<Profile principal={principal} accountId={accountId} actor={actor} notify={notify} />}
        />
        <Route path="/proposal/:id" element={<DonateProposal notify={notify} actor={actor} principal={principal} />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          fontSize: '14px',
          borderRadius: '8px',
        }}
      />
    </div>
  );

}

export default App;
