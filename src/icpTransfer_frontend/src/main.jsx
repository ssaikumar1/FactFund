import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import "@nfid/identitykit/react/styles.css"
import { canisterId } from '../../declarations/icpTransfer_backend';
import { IdentityKitAuthType, IdentityKitTransportType } from "@nfid/identitykit"
import { IdentityKitProvider } from "@nfid/identitykit/react"
import { NFIDW, InternetIdentity, Stoic, OISY } from "@nfid/identitykit"
import { BrowserRouter as Router } from 'react-router-dom';

const localInternetIdentity = {
  ...InternetIdentity,
  providerUrl: "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943"
}
const signers = [
  NFIDW,
  localInternetIdentity,
  Stoic,
  OISY
]

ReactDOM.createRoot(document.getElementById('root')).render(
  //<React.StrictMode>
  <Router>
    <IdentityKitProvider authType={IdentityKitAuthType.DELEGATION}
      signers={signers}
      signerClientOptions={{
        targets: [canisterId]
      }}>
      {/* <Test /> */}
       <App /> 
    </IdentityKitProvider>
  </Router>
  // </React.StrictMode>,
);