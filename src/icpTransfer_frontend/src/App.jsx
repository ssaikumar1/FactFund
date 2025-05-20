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

  const notify = (msg) => toast(msg);


  return (
    <div>
      <Navbar isConnected={isConnected} principal={principal} setPrincipal={setPrincipal} setAccountId={setAccountId} setIsConnected={setIsConnected} setActor={setActor} />
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
  element={<Profile principal={principal} accountId={accountId} actor={actor} />}
/>
        <Route path="/proposal/:id" element={<DonateProposal notify={notify} actor={actor} principal={principal} />} />
      </Routes>
      <ToastContainer />
    </div>
  );

}

export default App;
