"use client"

import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAgent, ConnectWallet } from "@nfid/identitykit/react"
import { Actor } from "@dfinity/agent"
import { canisterId, idlFactory } from "../../../declarations/icpTransfer_backend"

const Navbar = ({ isConnected, principal, setPrincipal, setAccountId, setIsConnected, setActor }) => {
  const [clicked, setClicked] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userData, setUserData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = () => {
    setClicked(!clicked)
  }

  const agent = useAgent({ host: "http://localhost:4943" })

  const authenticatedActor = useMemo(() => {
    return (
      agent &&
      Actor.createActor(idlFactory, {
        agent: agent,
        canisterId: canisterId,
      })
    )
  }, [agent])

  // This effect runs when the agent or authenticatedActor changes
  useEffect(() => {
    console.log("Agent:", agent)
    console.log("Authenticated Actor:", authenticatedActor)

    const fetchUserData = async () => {
      if (authenticatedActor) {
        try {
          
          await agent.fetchRootKey()

          // Call the getOrCreateUser function
          const user = await authenticatedActor.getOrCreateUser()
          console.log("User data:", user)
          setUserData(user)

          // Set the principal and account ID in the parent component
          if (user) {
            setPrincipal(user.principal.toString())
            setAccountId(user.accountId)
            setIsConnected(true)
            setActor(authenticatedActor)

         
            console.log("Account ID:", user.accountId)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

    if (authenticatedActor) {
      fetchUserData()
    }
  }, [agent, authenticatedActor, setPrincipal, setAccountId, setIsConnected, setActor])

  return (
    <nav className={scrolled ? "navbar scrolled" : "navbar"}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="logo2.png" alt="FactFund Logo" />
          <span>FactFund</span>
        </Link>

        <div className="menu-container">
          <ul className={clicked ? "nav-menu active" : "nav-menu"}>
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>

            <li className="nav-item dropdown">
              <span className="nav-link">Proposals</span>
              <div className="dropdown-content">
                <Link to="/createproposal" className="nav-link">Create Proposals</Link>
                <Link to="/proposals" className="nav-link">My Proposals</Link>
              </div>
            </li>

            <li className="nav-item">
              <Link to="/explore" className="nav-link">
                All Proposals
              </Link>
            </li>

            <li>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </li>

            <li className="nav-item connect-btn">
              <ConnectWallet
                onConnect={() => {
                  console.log("Wallet connected via NFID")
                }}
                onDisconnect={() => {
                  setIsConnected(false)
                  setPrincipal(null)
                  setAccountId(null)
                  setUserData(null)
                  setActor(null)
                }}
              />
            </li>
          </ul>
        </div>

        <div className="mobile-menu" onClick={handleClick}>
          <i className={clicked ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
      </div>

      {userData && (
        <div className="user-info" style={{ display: "none" }}>
      
          <p>Principal: {userData.principal?.toString()}</p>
          <p>Account ID: {userData.accountId}</p>
        </div>
      )}
    </nav>
  )
}

export default Navbar
