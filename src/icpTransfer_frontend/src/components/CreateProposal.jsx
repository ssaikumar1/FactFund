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
  const [proposalFee, setProposalFee] = useState(1); // Default to 1 ICP
  const [userBalance, setUserBalance] = useState(0);
  const [accountId, setAccountId] = useState('');

  // Fetch proposal fee and user balance on component mount
  useEffect(() => {
    const fetchProposalFeeAndBalance = async () => {
      if (actor) {
        const loadAccountData = async () => {
          const userData = await actor.getOrCreateUser();
          console.log("User data:", userData);
          setAccountId(userData.accountId);
          
          // Get user balance from index canister
          if (userData.accountId) {
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
            
            return { availableBalance: availableBalanceICP };
          }
          throw new Error("No account ID found");
        };

        notify.promise(
          loadAccountData(),
          {
            pending: 'Loading your account information...',
            success: (data) => `Account loaded! Available balance: ${data.availableBalance.toFixed(4)} ICP`,
            error: 'Failed to load account information'
          }
        );
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
    const file = e.target.files[0];
    
    // Check if file is selected
    if (!file) {
      notify.error("No file selected");
      return;
    }
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      notify.error("Please select a valid image file (JPG, PNG, GIF, etc.)");
      e.target.value = ''; // Clear the input
      return;
    }
    
    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      notify.error(`Image size is too large (${fileSizeInMB}MB). Please select an image smaller than 2MB`);
      e.target.value = ''; // Clear the input
      return;
    }
    
    const reader = new FileReader();
    console.log("Reading file...", file.name, `(${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    
    const processFile = new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const uri = reader.result;
          console.log("File read complete");
          const binary = convertDataURIToBinary(uri);
          setFormData({
            ...formData,
            image: binary,
          });
          resolve(`Image "${file.name}" processed successfully`);
        } catch (error) {
          console.error("Error processing file:", error);
          reject(new Error(`Failed to process image: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        console.error("FileReader error");
        reject(new Error("Failed to read the image file. Please try again with a different image."));
      };
      
      reader.readAsDataURL(file);
    });

    notify.promise(
      processFile,
      {
        pending: 'Processing image file...',
        success: 'Image uploaded successfully! 📁',
        error: (error) => error.message
      }
    );
  };

  const convertDataURIToBinary = dataURI =>
    Uint8Array.from(window.atob(dataURI.replace(/^data[^,]+,/, '')), v => v.charCodeAt(0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actor) {
      notify.error("Please login to continue");
      return;
    }
    
    if (!formData.image) {
      notify.warning("Please select an image for your proposal");
      return;
    }
    
    if (!formData.name.trim()) {
      notify.warning("Please enter your name");
      return;
    }
    
    if (!formData.title.trim()) {
      notify.warning("Please enter a proposal title");
      return;
    }
    
    if (!formData.description.trim()) {
      notify.warning("Please enter a proposal description");
      return;
    }
    
    if (!formData.goal || parseFloat(formData.goal) < 0.5) {
      notify.warning("Goal must be at least 0.5 ICP");
      return;
    }

    const createProposalProcess = async () => {
      // Check balance first
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
        throw new Error(`Insufficient balance. You need at least ${proposalFee} ICP available to create a proposal.`);
      }

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
        const proposalId = Number(response.ok);
        setTimeout(() => navigate("/proposals"), 1000);
        return { proposalId };
      } else if ("err" in response) {
        console.error("Error creating proposal:", response.err);
        throw new Error(response.err);
      } else if ("Ok" in response) {
        console.log("Proposal created successfully with ID:", Number(response.Ok));
        const proposalId = Number(response.Ok);
        setTimeout(() => navigate("/proposals"), 1000);
        return { proposalId };
      } else if ("Err" in response) {
        console.error("Error creating proposal:", response.Err);
        throw new Error(response.Err);
      } else {
        console.log("Unknown response format:", response);
        throw new Error("Received unexpected response from server");
      }
    };

    setIsLoading(true);
    
    try {
      await notify.promise(
        createProposalProcess(),
        {
          pending: 'Creating your proposal... 🚀',
          success: (data) => `🎉 Proposal created successfully! ID: ${data.proposalId}`,
          error: (error) => `Failed to create proposal: ${error.message}`
        }
      );
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
          <small>Please select an image for your campaign (max 2MB)</small>
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