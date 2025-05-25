#! /bin/bash
# Take two inputs from the user like CLI arguments
# 1. account id
# 2. amount
account_id=$1
amount=$2

# Use the minter identity
dfx identity use minter

# Perform the transfer
dfx ledger transfer $account_id --amount $amount --memo 0 --fee 0

dfx identity use default