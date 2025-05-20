import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { icpTransfer_backend } from '../../../declarations/icpTransfer_backend';
import { icp_index_canister } from '../../../declarations/icp_index_canister';

const CreateProposal = ({ notify, actor }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    goal: 0,
    image: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [proposalFee, setProposalFee] = useState(2); // Default to 2 ICP
  const [userBalance, setUserBalance] = useState(0);
  const [accountId, setAccountId] = useState('');

  // Fetch proposal fee and user balance on component mount
  useEffect(() => {
    const fetchProposalFeeAndBalance = async () => {
      if (actor) {
        try {
        
          const userData = await actor.getOrCreateUser();
          console.log("User data:", userData);
          setAccountId(userData.accountId);
          
          // Get user balance from index canister
          if (userData.accountId) {
            try {
              console.log("Fetching balance for account:", userData.accountId);
              const balanceE8s = await icp_index_canister.get_account_identifier_balance(userData.accountId);
              console.log("Raw balance in e8s:", balanceE8s.toString());
              
              const balanceICP = Number(balanceE8s) / 10**8;
              console.log("Balance in ICP:", balanceICP);
              
              setUserBalance(balanceICP);
              
              // Calculate available balance (total - locked)
              const lockedBalanceICP = Number(userData.locked_balance) / 10**8;
              console.log("Locked balance in ICP:", lockedBalanceICP);
              
              const availableBalanceICP = balanceICP - lockedBalanceICP;
              console.log("Available balance in ICP:", availableBalanceICP);
              
              // Update user balance to available balance
              setUserBalance(availableBalanceICP);
            } catch (err) {
              console.error("Error fetching balance:", err);
            }
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };
    
    fetchProposalFeeAndBalance();
  }, [actor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    const reader = new FileReader();
    console.log("Reading file...")
    reader.onloadend = async () => {
      const uri = reader.result;
      console.log("File read complete");
      const binary = convertDataURIToBinary(uri);
      setFormData({
        ...formData,
        image: binary,
      });
    };
    reader.readAsDataURL(e.target.files[0])
  };

  const convertDataURIToBinary = dataURI =>
    Uint8Array.from(window.atob(dataURI.replace(/^data[^,]+,/, '')), v => v.charCodeAt(0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actor) {
      notify("Please Login To Continue");
      return;
    }
    
    if (!formData.image) {
      notify("No image file selected");
      return;
    }
    
  
    try {
      const userData = await actor.getOrCreateUser();
      const balanceE8s = await icp_index_canister.get_account_identifier_balance(userData.accountId);
      const balanceICP = Number(balanceE8s) / 10**8;
      const lockedBalanceICP = Number(userData.locked_balance) / 10**8;
      const availableBalanceICP = balanceICP - lockedBalanceICP;
      
      console.log("Pre-submission check:");
      console.log("- Total balance (ICP):", balanceICP);
      console.log("- Locked balance (ICP):", lockedBalanceICP);
      console.log("- Available balance (ICP):", availableBalanceICP);
      console.log("- Proposal fee (ICP):", proposalFee);
      
      // Check if user has enough balance for the proposal fee
      if (availableBalanceICP < proposalFee) {
        notify(`Insufficient balance. You need at least ${proposalFee} ICP available to create a proposal.`);
        console.error(`Insufficient balance: ${availableBalanceICP} ICP available, ${proposalFee} ICP required`);
        return;
      }
    } catch (err) {
      console.error("Error checking balance before submission:", err);
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating proposal with data:", {
        name: formData.name,
        title: formData.title,
        description: formData.description,
        goal: formData.goal,
        
      });
      
      
      const goalE8s = BigInt(Math.round(parseFloat(formData.goal) * 10**8));
      console.log("Goal in ICP:", formData.goal);
      console.log("Goal in e8s:", goalE8s.toString());
      
      // Call the createProposal function
      const response = await actor.createProposal(
        formData.name, 
        formData.title, 
        formData.description, 
        goalE8s, 
        formData.image
      );
      
      console.log('Proposal creation response:', response);
      
   
      if ("ok" in response) {
        console.log("Proposal created successfully with ID:", Number(response.ok));
        notify(`Proposal Created with id: ${Number(response.ok)}`);
        navigate("/proposals");
      } else if ("err" in response) {
        console.error("Error creating proposal:", response.err);
        notify(response.err);
      } else if ("Ok" in response) {
        console.log("Proposal created successfully with ID:", Number(response.Ok));
        notify(`Proposal Created with id: ${Number(response.Ok)}`);
        navigate("/proposals");
      } else if ("Err" in response) {
        console.error("Error creating proposal:", response.Err);
        notify(response.Err);
      } else {
        console.log("Unknown response format:", response);
        notify("Unknown response from backend");
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      notify(`Error creating proposal: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">Create a New Proposal</h1>
      
     
      <div className="fee-info-container">
        <div className="fee-info">
          <h3>Important Information</h3>
          <p>Creating a proposal requires a lock amount of <strong>{proposalFee} ICP</strong> which will be locked until the proposal is completed.</p>
          <p>Your current available balance: <strong>{userBalance.toFixed(2)} ICP</strong></p>
          {userBalance < proposalFee && (
            <p className="insufficient-balance-warning">
              ⚠️ You don't have enough available balance to create a proposal. Please add funds to your account.
            </p>
          )}
          {accountId && (
            <p className="account-id-info">
              {/* Account ID: <strong>{accountId}</strong> */}
            </p>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="form-field">
            <label>Your Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="form-field">
            <label>Campaign Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Write a title"
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Campaign Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Write your Campaign Description"
            required
          />
        </div>
        <div className="info-banner">
          <p>You will get 100% of the raised amount</p>
          <p>A lock amount of {proposalFee} ICP will be held until the proposal is completed</p>
        </div>
        <div className="form-group">
          <div className="form-field">
            <label>Goal (in ICP) *</label>
            <input
              type="number"
              step="0.0001"
              min="0.5"
              pattern="^\d*(\.\d{0,4})?$"
              placeholder="10.0000"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
            />
            <small>Minimum goal is 0.5 ICP</small>
          </div>
        </div>
        <div className="form-group">
          <label>Campaign Image *</label>
          <input
            type="file"
            name="image"
            accept='image/*'
            onChange={handleFileChange}
            required
          />
          <small>Please select an image for your campaign</small>
        </div>
        <button 
          className="submit-btn" 
          type="submit" 
          disabled={isLoading || userBalance < proposalFee || !formData.image}
        >
          {isLoading ? 'Creating Proposal...' : 'Create Proposal'}
        </button>
        
        {userBalance < proposalFee && (
          <div className="error-message">
            You need at least {proposalFee} ICP available to create a proposal
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateProposal;