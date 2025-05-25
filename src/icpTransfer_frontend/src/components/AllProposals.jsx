import React, { useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { icpTransfer_backend, createActor } from "../../../declarations/icpTransfer_backend";
import { Link } from 'react-router-dom';
import { Principal } from '@dfinity/principal';

const AllProposals = ({ notify, actor }) => {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function bufferToBase64(buffer) {
    // use a FileReader to generate a base64 data URI:
    const base64url = await new Promise(r => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result)
      reader.readAsDataURL(new Blob([buffer]))
    });
    // remove the `data:...;base64,` part from the start
    return base64url.slice(base64url.indexOf(',') + 1);
  }

  useEffect(() => {
    const fetchProposals = async () => {
      const loadAllProposals = async () => {
        setIsLoading(true);

        const res = await icpTransfer_backend.getLatestProposals(10);
        console.log(res)

        if (res.ok) {
          const props = await Promise.all(res.ok.map(async (val) => {
            var b64 = "data:image/webp;base64," + await bufferToBase64(val.image);
            console.log({ ...val, image: b64 });
            return { ...val, image: b64, created_by_text: Principal.from(val.created_by).toString(), amount_required: Number(val.amount_required) / 10 ** 8 };
          }));
          setProposals(props)
          console.log(props)

          return { proposals: props, count: props.length };
        } else {
          throw new Error(res.err || "Failed to load proposals");
        }
      };

      try {
        await notify.promise(
          loadAllProposals(),
          {
            pending: 'Loading all proposals... 🌟',
            success: (data) => {
              if (data.count > 0) {
                return `🌟 Found ${data.count} proposal${data.count > 1 ? 's' : ''} to explore`;
              } else {
                return "No proposals available at the moment";
              }
            },
            error: (error) => `Failed to load proposals: ${error.message}`
          }
        );
      } finally {
        setIsLoading(false);
      }

    };

    fetchProposals();
  }, [icpTransfer_backend]);

  return (
    <div className="proposals-container">
      <h1>All Proposals</h1>
      {isLoading ? (
        <div className="loading-message">
          <p>Loading proposals...</p>
        </div>
      ) : (
        <>
          <div className="proposals-grid">
            {proposals.map((proposal, index) => (
              <Link
                to={`/proposal/${proposal.index}`}  // Pass the index via the URL
                key={index}
                className="proposal-card"
              >
                <div className="proposal-image">
                  <img src={proposal.image} alt='Proposal' />
                </div>
                <div className="proposal-content">
                  <h2>{proposal.title}</h2>
                  <p><strong>Goal:</strong> {Number(proposal.amount_required)} ICP</p>
                  <p><strong>By:</strong> {proposal.name}</p>
                </div>
                <br></br>
                <br></br>
                <br></br>

              </Link>
            ))}
          </div>
          {proposals.length == 0 && <h1>No Proposals have been created yet</h1>}
        </>
      )}
    </div>
  );
};

export default AllProposals;
