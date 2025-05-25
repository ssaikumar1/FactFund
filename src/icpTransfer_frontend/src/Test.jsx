import { useAgent } from "@nfid/identitykit/react"
import { ConnectWallet } from "@nfid/identitykit/react"
import { useEffect, useMemo } from "react"
import { canisterId, idlFactory, icpTransfer_backend } from '../../declarations/icpTransfer_backend';
import { Actor } from "@dfinity/agent";

export default function Test() {

    const agent = useAgent({ host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app" });

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
        <div>
            <h1>Test</h1>
            <ConnectWallet />
        </div>
    )
}