"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { Principal } from "@dfinity/principal"
import { icpTransfer_backend } from "../../../declarations/icpTransfer_backend"
import { icp_index_canister } from '../../../declarations/icp_index_canister'

const DonateProposal = ({ actor, notify, principal }) => {
  const { id } = useParams()
  const [proposal, setProposal] = useState(null)
  const [amount, setAmount] = useState("")
  const [claimPrincipal, setClaimPrincipal] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [proposalFiles, setProposalFiles] = useState([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)

  async function bufferToBase64(buffer) {
    // use a FileReader to generate a base64 data URI:
    const base64url = await new Promise((r) => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result)
      reader.readAsDataURL(new Blob([buffer]))
    })
    // remove the `data:...;base64,` part from the start
    return base64url.slice(base64url.indexOf(",") + 1)
  }

  const fetchProposalFiles = async () => {
    if (!actor || !id) return

    try {
      setIsLoadingFiles(true)
      const filesList = await actor.getProposalFilesList(Number(id))
      setProposalFiles(filesList)
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const fetchProposal = async () => {
    if (!id) {
      notify("Invalid Proposal ID")
      setIsLoading(false)
      return
    }

    if (!actor) {
      notify("Please Login To Continue")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const res = await actor.getProposal(Number(id))

      if (res.ok) {
        const val = res.ok
        const b64 = "data:image/webp;base64," + (await bufferToBase64(val.image))

        console.log("val", val)

        // Format proposal data with proper checks for amount_raised
        const amount_raised = Number(await icp_index_canister.get_account_identifier_balance(val.accountId)) / 10 ** 8

        const prop = {
          ...val,
          image: b64,
          created_by_text: Principal.from(val.created_by).toString(),
          amount_required: Number(val.amount_required) / 10 ** 8,
          amount_raised: amount_raised, // Add default of 0
          donations: val.donations || [], // Ensure donations exists
        }

        setProposal(prop)


        fetchProposalFiles()
      } else {
        notify(res.err || "Failed to fetch proposal")
      }
    } catch (error) {
      console.error("Error fetching proposal:", error)
      notify(`Error: ${error.message || "Failed to fetch proposal"}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {


    fetchProposal()
  }, [actor, id, notify])

  const handleInputChange = (e) => {
    // Only allow numeric input with up to 8 decimal places
    const value = e.target.value
    if (/^\d*\.?\d{0,8}$/.test(value) || value === "") {
      setAmount(value)
    }
  }

  const handleClaimInputChange = (e) => {
    setClaimPrincipal(e.target.value)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Function to handle donation
  const handleDonateClick = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      notify("Please enter a valid amount")
      return
    }

    if (!proposal) {
      notify("Proposal data not available")
      return
    }

    const amountToFund = Number.parseFloat(amount)
    const remainingToFund = proposal.amount_required - proposal.amount_raised

    if (amountToFund > remainingToFund) {
      notify(`Amount must not exceed ${remainingToFund.toFixed(8)} ICP`)
      return
    }

    console.log("amountToFund", amountToFund, "remainingToFund", remainingToFund)

    try {
      const params = {
        to: proposal.accountId,
        amount: Math.round(amountToFund * 10 ** 8),
        memo: "123451231231",
      }

      const result = await actor.donateToProposal(Number(id), amountToFund * 10 ** 8)

      console.log("result", result)

      if (result.ok) {
        notify("Funding successful!")

        await fetchProposal()
      }
    } catch (transferError) {
      console.error("Transfer error:", transferError)
      notify(`Transfer failed: ${transferError.message || "Unknown error"}`)
    }
  }

  // Function to handle claiming funds
  const handleClaimClick = async () => {
    if (!claimPrincipal) {
      notify("Please enter a principal ID")
      return
    }

    try {
      setIsClaiming(true)

      const result = await actor.claimProposal(Number(id))

      if (result.ok) {
        notify(`Successfully claimed funds`)

        // Update proposal to show claimed status
        setProposal((prev) => ({
          ...prev,
          claimed: true,
        }))

        setClaimPrincipal("") // Clear input after successful claim
      } else {
        notify(`Error occurred: ${result.err || "Failed to claim funds"}`)
      }
    } catch (error) {
      if (error.message && error.message.includes("Invalid principal")) {
        notify(`Invalid Principal: ${claimPrincipal}`)
      } else {
        console.error("Claim error:", error)
        notify(`Error: ${error.message || "Failed to claim funds"}`)
      }
    } finally {
      setIsClaiming(false)
    }
  }

  // Function to handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !actor) {
      notify("Please select a file first")
      return
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Read file as chunks
      const fileType = selectedFile.type || "application/octet-stream"
      const chunkSize = 500 * 1024 // 500KB chunks
      const totalChunks = Math.ceil(selectedFile.size / chunkSize)

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize
        const end = Math.min(start + chunkSize, selectedFile.size)
        const chunk = selectedFile.slice(start, end)

        // Convert chunk to array buffer
        const arrayBuffer = await chunk.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Upload chunk
        const result = await actor.uploadFileChunk(Number(id), selectedFile.name, uint8Array, chunkIndex, fileType)

        if (result.err) {
          throw new Error(result.err)
        }

        // Update progress
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        setUploadProgress(progress)
      }

      notify(`File "${selectedFile.name}" uploaded successfully`)
      setSelectedFile(null)
      setUploadProgress(0)

      // Refresh file list
      fetchProposalFiles()
    } catch (error) {
      console.error("Upload error:", error)
      notify(`Upload failed: ${error.message || "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  // Function to download a file
  const handleFileDownload = async (fileName, fileType) => {
    if (!actor || !id) return

    try {
      notify("Downloading file...")

      // Get total chunks
      const totalChunks = await actor.getProposalFileTotalChunks(Number(id), fileName)

      console.log("Total chunks:", totalChunks)

      if (totalChunks === 0) {
        throw new Error("File not found or has no chunks")
      }

      // Download all chunks
      const chunks = []
      for (let i = 0; i < totalChunks; i++) {
        const chunkResult = await actor.getProposalFileChunk(Number(id), fileName, i)
        console.log("Chunk result:", chunkResult)
        if (chunkResult) {
          chunks.push(chunkResult[0].chunk)
        }
      }

      console.log("Chunks:", chunks)

      // Combine chunks and create download link
      const blob = new Blob(chunks, { type: fileType })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      notify("Download complete")
    } catch (error) {
      console.error("Download error:", error)
      notify(`Download failed: ${error.message || "Unknown error"}`)
    }
  }

  // Function to delete a file
  const handleFileDelete = async (fileName) => {
    if (!actor || !id) return

    try {
      notify("Deleting file...")

      const result = await actor.deleteProposalFile(Number(id), fileName)

      if (result.err) {
        throw new Error(result.err)
      }

      notify(`File "${fileName}" deleted successfully`)

      // Refresh file list
      fetchProposalFiles()
    } catch (error) {
      console.error("Delete error:", error)
      notify(`Delete failed: ${error.message || "Unknown error"}`)
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#ffffff" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>Proposal not found</h2>
        <p style={{ marginTop: "10px", color: "#b0b0b0" }}>
          The proposal you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#62d9aa",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  const progressPercentage = (proposal.amount_raised / proposal.amount_required) * 100
  const isGoalReached = proposal.amount_raised >= proposal.amount_required
  const isCreator = proposal.created_by_text === principal
  const canClaim = isGoalReached && isCreator && !proposal.claimed
  const remainingToFund = Math.max(0, proposal.amount_required - proposal.amount_raised)

  return (
    <div className="proposal-details">
      <div className="left-section">
        <div className="proposal-image-section">
          <img src={proposal.image || "/placeholder.svg"} alt={proposal.title} />
        </div>

        <div className="proposal-meta">
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "10px" }}>{proposal.title}</h1>
          <p style={{ color: "#b0b0b0", marginBottom: "15px" }}>Created by {proposal.name}</p>

          {/* File Upload Section - Only visible to creator */}
          {isCreator && (
            <div className="file-upload-section">
              <h3>Upload Files</h3>
              <div className="file-input-container">
                <input type="file" onChange={handleFileChange} className="file-input" disabled={isUploading} />
              </div>

              {selectedFile && (
                <div style={{ marginTop: "10px", color: "#b0b0b0" }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </div>
              )}

              {isUploading && (
                <div style={{ marginTop: "15px" }}>
                  <div style={{ height: "6px", backgroundColor: "#1f1f21", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        backgroundColor: "#62d9aa",
                        transition: "width 0.3s ease",
                      }}
                    ></div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "12px", color: "#b0b0b0", marginTop: "5px" }}>
                    {uploadProgress}%
                  </div>
                </div>
              )}

              <button onClick={handleFileUpload} className="upload-button" disabled={!selectedFile || isUploading}>
                {isUploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
          )}

          <div className="proposal-story">
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Story</h2>
            <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>{proposal.description}</p>
          </div>

          {/* Files Section */}
          <div className="proposal-files">
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Project Files</h2>

            {isLoadingFiles ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div className="spinner"></div>
                <p style={{ marginTop: "15px", color: "#b0b0b0" }}>Loading files...</p>
              </div>
            ) : proposalFiles.length > 0 ? (
              <div className="file-list">
                {proposalFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <div className="file-icon">
                        {file.fileType.startsWith("image/") ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        ) : file.fileType.startsWith("text/") ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="file-name">{file.name}</div>
                        {/*<div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>*/}
                      </div>
                    </div>

                    <div className="file-actions">
                      <button
                        onClick={() => handleFileDownload(file.name, file.fileType)}
                        className="file-action-button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download
                      </button>

                      {isCreator && (
                        <button
                          onClick={() => handleFileDelete(file.name)}
                          className="file-action-button delete-button"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-files">
                <div className="empty-files-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </div>
                <p>No files have been uploaded for this project yet.</p>
                {isCreator && (
                  <p style={{ fontSize: "14px", marginTop: "10px" }}>Upload files to share with your supporters.</p>
                )}
              </div>
            )}
          </div>

          {proposal.donations && proposal.donations.length > 0 && (
            <div className="proposal-donators">
              <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Donations</h2>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {proposal.donations.map((donation, index) => (
                  <div
                    key={index}
                    style={{ padding: "12px", backgroundColor: "#1f1f21", borderRadius: "5px", marginBottom: "10px" }}
                  >
                    <div
                      style={{ fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {donation.account}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>Amount:</span>
                      <span style={{ fontSize: "14px", color: "#62d9aa" }}>
                        {Number(donation.amount.e8s) / 10 ** 8} ICP
                      </span>
                    </div>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#b0b0b0" }}>
                      <span style={{ fontWeight: "500" }}>Transaction:</span>{" "}
                      <a
                        href={`https://dashboard.internetcomputer.org/transaction/${Number(donation.transaction_id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#62d9aa", textDecoration: "none" }}
                      >
                        {Number(donation.transaction_id)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="right-section">
        <div className="proposal-funding">
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Funding Status</h2>

          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#b0b0b0" }}>Goal</span>
              <span style={{ fontWeight: "bold" }}>{proposal.amount_required.toFixed(8)} ICP</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#b0b0b0" }}>Raised</span>
              <span style={{ fontWeight: "bold" }}>{proposal.amount_raised.toFixed(8)} ICP</span>
            </div>
          </div>

          <div className="progress-container">
            <div
              className="progress-bar"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "14px",
              marginTop: "8px",
              color: "#b0b0b0",
            }}
          >
            <span>{progressPercentage.toFixed(1)}%</span>
            <span>{remainingToFund.toFixed(8)} ICP to go</span>
          </div>

          {isGoalReached && (
            <div
              style={{
                textAlign: "center",
                padding: "10px",
                backgroundColor: "#1f1f21",
                borderRadius: "5px",
                marginTop: "15px",
                color: "#62d9aa",
              }}
            >
              Goal Reached!
            </div>
          )}

          {isGoalReached && proposal.claimed && (
            <div
              style={{
                textAlign: "center",
                padding: "10px",
                backgroundColor: "#1f1f21",
                borderRadius: "5px",
                marginTop: "10px",
                color: "#62d9aa",
              }}
            >
              Funds Claimed
            </div>
          )}
        </div>

        {/* Claim Funds Section - Only visible to creator when goal is reached and not claimed */}
        {canClaim && (
          <div className="proposal-funding">
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Claim Funds</h2>
            <div
              style={{
                padding: "10px",
                backgroundColor: "#1f1f21",
                borderRadius: "5px",
                marginBottom: "15px",
                color: "#62d9aa",
              }}
            >
              As the creator, you can now claim {proposal.amount_raised.toFixed(8)} ICP
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#b0b0b0" }}>Recipient Principal ID</label>
              <input
                type="text"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={claimPrincipal}
                onChange={handleClaimInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#1f1f21",
                  border: "none",
                  borderRadius: "5px",
                  color: "#ffffff",
                  marginBottom: "10px",
                }}
                disabled={isClaiming}
              />
              <p style={{ fontSize: "12px", color: "#b0b0b0", marginBottom: "15px" }}>
                Enter the principal ID where you want to receive the funds
              </p>
            </div>

            <button onClick={handleClaimClick} className="fund-button" disabled={isClaiming}>
              {isClaiming ? "Processing..." : "Claim Funds"}
            </button>
          </div>
        )}

        {/* Donate Section - Only visible when goal is not reached */}
        {!isGoalReached && (
          <div className="proposal-funding">
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>Donate</h2>

            <div>
              <label style={{ display: "block", marginBottom: "8px", color: "#b0b0b0" }}>Amount (ICP)</label>
              <input
                type="text"
                placeholder="0.0001"
                min="0.0001"
                max={remainingToFund.toFixed(8)}
                step="0.0001"
                value={amount}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#1f1f21",
                  border: "none",
                  borderRadius: "5px",
                  color: "#ffffff",
                  marginBottom: "10px",
                }}
                disabled={isSyncing}
              />
              <p style={{ fontSize: "12px", color: "#b0b0b0", marginBottom: "15px" }}>
                Maximum: {remainingToFund.toFixed(8)} ICP
              </p>
            </div>

            <button onClick={handleDonateClick} className="fund-button" disabled={isSyncing}>
              {isSyncing ? "Processing..." : "Fund Campaign"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DonateProposal
