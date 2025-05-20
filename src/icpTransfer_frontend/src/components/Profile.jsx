"use client"

import { useState, useEffect } from "react"
import { Copy, ExternalLink, ArrowDown, ArrowUp } from 'lucide-react'
import { icp_index_canister } from '../../../declarations/icp_index_canister'

const Profile = ({ principal, accountId, actor }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState(null)
  const [balance, setBalance] = useState({
    totalBalance: 0,
    lockedBalance: 0,
    availableBalance: 0,
  })
  const [transactions, setTransactions] = useState([])

  // Fetch user data, balance, and transactions
  useEffect(() => {
    const fetchUserData = async () => {
      if (!actor || !principal) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
         
        const user = await actor.getOrCreateUser();
        console.log("User data:", user);
        setUserData(user);
        
        // If we have the account ID, fetch balance and transactions
        if (user.accountId) {
          try {
            console.log("Fetching balance for account:", user.accountId);
         
            const balanceE8s = await icp_index_canister.get_account_identifier_balance(user.accountId);
            console.log("Balance in e8s:", balanceE8s.toString());
          
            const totalBalanceIcp = Number(balanceE8s) / 10**8;
          
            const lockedBalanceIcp = Number(user.locked_balance) / 10**8;
    
            const availableBalanceIcp = totalBalanceIcp - lockedBalanceIcp;
            
            setBalance({
              totalBalance: totalBalanceIcp,
              lockedBalance: lockedBalanceIcp,
              availableBalance: availableBalanceIcp,
            });
            
            // Fetch transactions
            try {
              console.log("Fetching transactions for account:", user.accountId);
              
              
              const txResult = await icp_index_canister.get_account_identifier_transactions({
                account_identifier: user.accountId,
                max_results: BigInt(100), 
                start: [], 
              });
              
              console.log("Transaction result:", txResult);
              
              if (txResult && "Ok" in txResult) {
            
                const formattedTxs = txResult.Ok.transactions.map(tx => {
                  try {
                    const transaction = tx.transaction;
                    let type = "unknown";
                    let from = "";
                    let to = "";
                    let amount = 0;
                    
                    // Determine transaction type and details based on operation
                    if (transaction.operation && "Transfer" in transaction.operation) {
                      const transfer = transaction.operation.Transfer;
                      from = transfer.from || "Unknown";
                      to = transfer.to || "Unknown";
                      amount = transfer.amount && typeof transfer.amount.e8s !== 'undefined' 
                        ? Number(transfer.amount.e8s) / 10**8 
                        : 0;
                      
                      // Determine if this is a deposit, withdraw, donate, or claim
                      if (from === user.accountId) {
                        // If the user is sending funds
                        if (to.includes("proposal")) {
                          type = "donate";
                        } else {
                          type = "withdraw";
                        }
                      } else if (to === user.accountId) {
                        // If the user is receiving funds
                        if (from.includes("proposal")) {
                          type = "claim";
                        } else {
                          type = "deposit";
                        }
                      }
                    } else if (transaction.operation && "Mint" in transaction.operation) {
                      const mint = transaction.operation.Mint;
                      to = mint.to || "Unknown";
                      amount = mint.amount && typeof mint.amount.e8s !== 'undefined'
                        ? Number(mint.amount.e8s) / 10**8
                        : 0;
                      type = "deposit";
                      from = "Minting Account";
                    } else if (transaction.operation && "Burn" in transaction.operation) {
                      const burn = transaction.operation.Burn;
                      from = burn.from || "Unknown";
                      amount = burn.amount && typeof burn.amount.e8s !== 'undefined'
                        ? Number(burn.amount.e8s) / 10**8
                        : 0;
                      type = "burn";
                      to = "Burning Account";
                    }
                    
           
                    let timestamp = new Date();
                    if (transaction.timestamp && typeof transaction.timestamp.timestamp_nanos !== 'undefined') {
                      timestamp = new Date(Number(transaction.timestamp.timestamp_nanos) / 1000000);
                    }
                    
                    return {
                      id: typeof tx.id !== 'undefined' ? Number(tx.id) : Math.random(),
                      from,
                      to,
                      amount,
                      type,
                      timestamp,
                    };
                  } catch (err) {
                    console.error("Error processing transaction:", err, tx);
                  
                    return {
                      id: Math.random(),
                      from: "Error",
                      to: "Error",
                      amount: 0,
                      type: "unknown",
                      timestamp: new Date(),
                    };
                  }
                });
                
                setTransactions(formattedTxs);
              } else if (txResult && "Err" in txResult) {
                console.error("Error fetching transactions:", txResult.Err);
              } else {
                console.error("Unexpected transaction result format:", txResult);
              }
            } catch (txErr) {
              console.error("Error in transaction fetch:", txErr);
              
            }
          } catch (err) {
            console.error("Error fetching balance:", err);
            
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [actor, principal, accountId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const formatDate = (date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "donate":
        return <ArrowUp className="transaction-icon donate" />;
      case "claim":
        return <ArrowDown className="transaction-icon claim" />;
      case "deposit":
        return <ArrowDown className="transaction-icon deposit" />;
      case "withdraw":
        return <ArrowUp className="transaction-icon withdraw" />;
      default:
        return null;
    }
  };

  const getTransactionClass = (type) => {
    switch (type) {
      case "donate":
        return "donate";
      case "claim":
        return "claim";
      case "deposit":
        return "deposit";
      case "withdraw":
        return "withdraw";
      default:
        return "";
    }
  };

  const getTransactionType = (type) => {
    switch (type) {
      case "donate":
        return "Donate To Proposal";
      case "claim":
        return "Funds Claim from Proposal";
      case "deposit":
        return "Deposit";
      case "withdraw":
        return "Withdraw";
      case "burn":
        return "Burn";
      default:
        return type;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <div className="account-info">
          <div className="account-id">
            <h2>Account ID</h2>
            <div className="id-container">
              <span className="id-text">{userData?.accountId || "Not connected"}</span>
              <button
                className="icon-button"
                onClick={() => copyToClipboard(userData?.accountId)}
                disabled={!userData?.accountId}
              >
                <Copy size={16} />
              </button>
              <a
                href={`https://dashboard.internetcomputer.org/account/${userData?.accountId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-button"
                style={{ opacity: userData?.accountId ? 1 : 0.5 }}
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
          
          {userData?.principal && (
            <div className="principal-id">
              <h2>Principal ID</h2>
              <div className="id-container">
                <span className="id-text">{principal}</span>
                <button
                  className="icon-button"
                  onClick={() => copyToClipboard(principal)}
                >
                  <Copy size={16} />
                </button>
                <a
                  href={`https://dashboard.internetcomputer.org/principal/${principal}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-button"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile data...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : !userData ? (
          <div className="not-connected-state">
            <p>Please connect your wallet to view your profile.</p>
          </div>
        ) : (
          <>
            <div className="balance-cards">
              <div className="balance-card total">
                <h3>Total Balance</h3>
                <div className="balance-amount">{balance.totalBalance.toFixed(2)} ICP</div>
                <p className="balance-description">Total ICP in your account</p>
              </div>
              <div className="balance-card locked">
                <h3>Locked Balance</h3>
                <div className="balance-amount">{balance.lockedBalance.toFixed(2)} ICP</div>
                <p className="balance-description">ICP locked for active proposals</p>
              </div>
              <div className="balance-card available">
                <h3>Available Balance</h3>
                <div className="balance-amount">{balance.availableBalance.toFixed(2)} ICP</div>
                <p className="balance-description">ICP available for use</p>
              </div>
            </div>
{/*
            {userData.created_proposals && userData.created_proposals.length > 0 && (
              <div className="proposals-section">
                <h2>My Proposals</h2>
                <p className="section-description">You have created {userData.created_proposals.length} proposals</p>
                <div className="proposals-list">
                  {userData.created_proposals.map((proposalId, index) => (
                    <div key={index} className="proposal-item">
                      <span>Proposal #{proposalId.toString()}</span>
                      <a href={`/proposals/${proposalId}`} className="view-proposal-link">
                        View Details
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
*/}
            <div className="transactions-section">
              <h2>Transaction History</h2>
              <p className="section-description">Recent transactions for your account</p>

              <div className="transactions-container">
                <div className="transactions-header">
                  <div className="transaction-cell">From</div>
                  <div className="transaction-cell">To</div>
                  <div className="transaction-cell">Amount</div>
                  <div className="transaction-cell">Type</div>
                  <div className="transaction-cell">Date</div>
                </div>

                {transactions.length > 0 ? (
                  <div className="transactions-body">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="transaction-row">
                        <div className="transaction-cell from" data-label="From:">
                          {transaction.from && transaction.from.length > 10 
                            ? `${transaction.from.substring(0, 10)}...` 
                            : transaction.from}
                        </div>
                        <div className="transaction-cell to" data-label="To:">
                          {transaction.to && transaction.to.length > 10 
                            ? `${transaction.to.substring(0, 10)}...` 
                            : transaction.to}
                        </div>
                        <div className="transaction-cell amount" data-label="Amount:">
                          {transaction.amount.toFixed(2)} ICP
                        </div>
                        <div
                          className={`transaction-cell type ${getTransactionClass(transaction.type)}`}
                          data-label="Type:"
                        >
                          {getTransactionIcon(transaction.type)}
                          {getTransactionType(transaction.type)}
                        </div>
                        <div className="transaction-cell date" data-label="Date:">
                          {formatDate(transaction.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-transactions">
                    <p>No transactions found.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;