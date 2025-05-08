dfx deploy --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai icp_ledger_canister

dfx deploy icp_index_canister --specified-id qhbym-qaaaa-aaaaa-aaafq-cai --argument '(record {ledger_id = principal "ryjl3-tyaaa-aaaaa-aaaba-cai"})'

dfx deploy icpTransfer_backend

dfx deploy icpTransfer_frontend

dfx deploy internet_identity --specified-id rdmx6-jaaaa-aaaaa-aaadq-cai