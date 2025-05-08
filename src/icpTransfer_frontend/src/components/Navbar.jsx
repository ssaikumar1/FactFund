"use client"

import { useState } from "react"

import { Link, useNavigate } from "react-router-dom"
// import { ConnectBtn } from "./ConnectBtn"
// import { canisterId } from '../../../declarations/icpTransfer_backend';
import { useAgent } from "@nfid/identitykit/react"
import { ConnectWallet } from "@nfid/identitykit/react"
import { useEffect, useMemo } from "react"
import { canisterId, idlFactory, icpTransfer_backend } from '../../../declarations/icpTransfer_backend';
import { Actor } from "@dfinity/agent";

const Navbar = ({ isConnected, principal, setPrincipal, setAccountId, setIsConnected, setActor }) => {
  const [clicked, setClicked] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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

   const handleAuthenticatedClick = async (link) => {
    try {
      if (!isConnected) {
        const publicKey = await window.ic.plug.requestConnect({ whitelist: [canisterId] })
        const connected = await window.ic.plug.isConnected()
        setIsConnected(connected)
        if (connected) {
          setPrincipal(window.ic.plug.principalId)
          setAccountId(window.ic.plug.accountId)
          const actor = await window.ic.plug.createActor({ canisterId: canisterId, interfaceFactory: idlFactory })
          setActor(actor)
          navigate(link)
        }
      } else {
        navigate(link)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleClick = () => {
    setClicked(!clicked)
  } 
    const agent = useAgent({host: "http://localhost:4943"})

    const authenticatedActor = useMemo(() => {
        return (
            agent &&
            // or nonTargetIdlFactory
            Actor.createActor(idlFactory, {
                agent: agent,
                canisterId: canisterId, // or NON_TARGET_CANISTER_ID_TO_CALL
            })
        )
    }, [agent, idlFactory])

    useEffect(() => {
        console.log(agent, "agent")
        console.log(authenticatedActor, "authenticatedActor")

        if (authenticatedActor) {
            agent.fetchRootKey().then(console.log).then(() => {
                console.log(authenticatedActor.checkPrincipal().then(console.log), "checkPrincipal")
            })
        }
    }, [agent, authenticatedActor])

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
                <a onClick={() => handleAuthenticatedClick("/createproposal")}>Create Proposals</a>
                <a onClick={() => handleAuthenticatedClick("/proposals")}>My Proposals</a>
              </div>
            </li>

            <li className="nav-item">
              <Link to="/explore" className="nav-link">
                All Proposals
              </Link>
            </li>

            {/* <li className="nav-item connect-btn">
              <ConnectBtn
                isConnected={isConnected}
                principal={principal}
                setPrincipal={setPrincipal}
                setAccountId={setAccountId}
                setIsConnected={setIsConnected}
                setActor={setActor}
              />
            </li> */}
            <ConnectWallet />
          </ul>
        </div>

        <div className="mobile-menu" onClick={handleClick}>
          <i className={clicked ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
