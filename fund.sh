#! /bin/bash
# Take two inputs from the user like CLI arguments
# 1. account id
# 2. amount
from_account_id=$1
to_account_id=$2
amount=$3

dfx identity use $from_account_id

# Perform the transfer
dfx ledger transfer $to_account_id --amount $amount --memo 0

dfx identity use default