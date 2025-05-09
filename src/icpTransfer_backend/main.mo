import IcpLedger "canister:icp_ledger_canister";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Nat "mo:base/Nat";
import Map "mo:map/Map";
import Vector "mo:vector";
import { phash } "mo:map/Map";
import Nat64 "mo:base/Nat64";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Types "./Types";
import Utils "./Utils";
actor IcpTransfer_backend {

    stable var users = Map.new<Principal, Types.User>();
    stable var proposals : Types.Vector<Types.Proposal> = Vector.new<Types.Proposal>();

    stable var proposal_fee : Nat64 = 2 * (10 ** 8);
    stable var fee_sink : Principal = Principal.fromText("gyvkh-qm3gw-myzkz-awlbs-g2yok-3qiuv-i44w2-mmzjj-jkd2r-wuikv-sae");

    private func _getOrCreateUser(caller : Principal) : Types.User {
        let user = Map.get<Principal, Types.User>(users, phash, caller);
        switch (user) {
            case (null) {
                let principal_as_subaccount = Utils.principalAsThirtyTwoBytes(caller);
                let newUser : Types.User = {
                    created_proposals = [];
                    locked_balance = 0;
                    principal = caller;
                    subaccount = principal_as_subaccount;
                    accountId = Utils.getAccountId(Principal.fromActor(IcpTransfer_backend), ?principal_as_subaccount);
                };
                Map.set<Principal, Types.User>(users, phash, caller, newUser);
                return newUser;
            };
            case (?user) {
                return user;
            };
        };
    };

    public shared ({ caller }) func getOrCreateUser() : async Types.User {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Anonymous User");
        };
        _getOrCreateUser(caller);
    };

    public shared ({ caller }) func getUser() : async Result.Result<Types.User, Text> {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Anonymous User");
        };
        let user = Map.get<Principal, Types.User>(users, phash, caller);
        switch (user) {
            case (null) {
                return #err("User not found");
            };
            case (?user) {
                return #ok(user);
            };
        };
    };

    public shared ({ caller }) func withdrawFromUserAccount(amount : Nat, to : Principal, subaccount : ?Blob) : async Result.Result<Bool, Text> {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Anonymous User");
        };
        let user = Map.get<Principal, Types.User>(users, phash, caller);
        switch (user) {
            case (null) {
                return #err("User not found");
            };
            case (?user) {
                let balance = await IcpLedger.account_balance_dfx({
                    account = user.accountId;
                });
                if (balance.e8s - user.locked_balance < Nat64.fromNat(amount)) {
                    return #err("Insufficient balance");
                };
                let transferResult = await IcpLedger.icrc1_transfer({
                    to = {
                        owner = to;
                        subaccount = subaccount;
                    };
                    fee = null;
                    memo = ?Text.encodeUtf8("op:withdraw");
                    from_subaccount = ?user.subaccount;
                    created_at_time = null;
                    amount = amount;
                });
                switch (transferResult) {
                    case (#Err(_)) {
                        return #err("Transfer failed");
                    };
                    case (#Ok(_)) {
                        return #ok(true);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func createProposal(name : Text, title : Text, description : Text, amount_required : Nat64, image : Blob) : async Result.Result<Nat, Text> {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Anonymous User");
        };
        var proposal_size = Vector.size<Types.Proposal>(proposals);
        var proposal_subaccount = Utils.natAsSubaccount(proposal_size);
        var user = _getOrCreateUser(caller);
        var balance = await IcpLedger.account_balance_dfx({
            account = user.accountId;
        });
        if (balance.e8s - user.locked_balance < proposal_fee) {
            return #err("Insufficient balance");
        };
        if (Float.fromInt(Nat64.toNat(amount_required)) < 0.5 * (10 ** 8)) {
            return #err("Amount required must be greater than 0.5 ICP");
        };
        // increase locked balance
        var new_locked_balance = user.locked_balance + proposal_fee;
        // create proposal
        var newProposal : Types.Proposal = {
            index = Nat64.fromNat(proposal_size);
            name = name;
            title = title;
            description = description;
            image = image;
            subaccount = proposal_subaccount;
            accountId = Utils.getAccountId(Principal.fromActor(IcpTransfer_backend), ?proposal_subaccount);
            created_by = caller;
            amount_required = amount_required;
            claimed = false;
        };
        Vector.add<Types.Proposal>(proposals, newProposal);
        var new_user = addCreatedProposalToUsers(user, Nat64.fromNat(proposal_size));
        var new_user2 = setLockedBalance(new_user, new_locked_balance);
        Map.set<Principal, Types.User>(users, phash, caller, new_user2);
        return #ok(proposal_size);
    };

    public shared ({ caller }) func claimProposal(proposalId : Nat) : async Result.Result<Bool, Text> {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Anonymous User");
        };
        var size = Vector.size<Types.Proposal>(proposals);
        if (proposalId >= size) {
            return #err("No Proposal is available with this id");
        } else {
            var proposal = Vector.getOpt<Types.Proposal>(proposals, proposalId);
            switch (proposal) {
                case (null) {
                    return #err("No Proposal is available with this id");
                };
                case (?proposal) {
                    if (proposal.created_by == caller) {
                        var amount_raised = await IcpLedger.account_balance_dfx({
                            account = proposal.accountId;
                        });
                        if (amount_raised.e8s >= proposal.amount_required) {
                            if (not proposal.claimed) {
                                var user = _getOrCreateUser(caller);
                                var fee_amount = amount_raised.e8s * 2 / 100;
                                var claimable_amount = amount_raised.e8s - fee_amount;
                                let transferResult = await IcpLedger.icrc1_transfer({
                                    to = {
                                        owner = Principal.fromActor(IcpTransfer_backend);
                                        subaccount = ?user.subaccount;
                                    };
                                    fee = null;
                                    memo = ?Text.encodeUtf8("op:claim");
                                    from_subaccount = ?proposal.subaccount;
                                    created_at_time = null;
                                    amount = Nat64.toNat(claimable_amount - 10_000);
                                });

                                switch (transferResult) {
                                    case (#Err(_)) {
                                        return #err("Claimable Amount Transfer failed");
                                    };
                                    case (#Ok(_)) {
                                        let feeTransferResult = await IcpLedger.icrc1_transfer({
                                            to = {
                                                owner = fee_sink;
                                                subaccount = null;
                                            };
                                            fee = null;
                                            memo = ?Text.encodeUtf8("op:fee");
                                            from_subaccount = ?proposal.subaccount;
                                            created_at_time = null;
                                            amount = Nat64.toNat(fee_amount - 10_000);
                                        });
                                        switch (feeTransferResult) {
                                            case (#Err(_)) {
                                                return #err("Fee Transfer failed");
                                            };
                                            case (#Ok(_)) {
                                                var new_user = setLockedBalance(user, user.locked_balance - proposal_fee);
                                                var new_proposal = setClaimed(proposal);
                                                Vector.put<Types.Proposal>(proposals, proposalId, new_proposal);
                                                Map.set<Principal, Types.User>(users, phash, caller, new_user);
                                                return #ok(true);
                                            };
                                        };
                                    };
                                };

                            } else {
                                return #err("Already Funds are Claimed");
                            };
                        } else {
                            return #err("Cannot Claim Without raising required amount");
                        };
                    } else {
                        return #err("Only Proposal Creator Can Call this Method");
                    };

                };
            };
        };
    };

    public func getProposal(id : Nat) : async Result.Result<Types.Proposal, Text> {
        var size = Vector.size<Types.Proposal>(proposals);
        if (id >= size) {
            return #err("No Proposal is available with this id");
        } else {
            var proposal = Vector.getOpt<Types.Proposal>(proposals, id);
            switch (proposal) {
                case (null) {
                    return #err("No Proposal is available with this id");
                };
                case (?proposal) {
                    return #ok(proposal);
                };
            };
        };
    };

    public query func getLatestProposals(len : Nat) : async Result.Result<[Types.Proposal], Text> {
        var size = Vector.size<Types.Proposal>(proposals);
        if (size > 0) {
            var arr = Vector.toArray<Types.Proposal>(proposals);
            if (size > len) {
                var res = Array.subArray<Types.Proposal>(arr, size - len, len);
                return #ok(res);
            } else {
                return #ok(arr);
            };
        } else {
            return #ok([]);
        };
    };

    public shared query ({ caller }) func getLatestMyProposals(len : Nat) : async Result.Result<[Types.Proposal], Text> {
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Anonymous User");
        };
        var size = Vector.size<Types.Proposal>(proposals);
        if (size > 0) {
            var arr = Vector.toArray<Types.Proposal>(proposals);
            var r_len = 0;
            switch (Map.get<Principal, Types.User>(users, phash, caller)) {
                case (null) {
                    return #ok([]);
                };
                case (?user) {
                    var props = Buffer.Buffer<Types.Proposal>(3);
                    var created_proposals = user.created_proposals;
                    for (pid in created_proposals.vals()) {
                        if (r_len < len) {
                            r_len := r_len + 1;
                            props.add(arr[Nat64.toNat(pid)]);
                        };
                    };
                    return #ok(Buffer.toArray<Types.Proposal>(props));
                };
            };
        } else {
            return #ok([]);
        };
    };

    public query func getProposalsLength() : async Nat {
        var size = Vector.size<Types.Proposal>(proposals);
        return size;
    };

    private func addCreatedProposalToUsers(user : Types.User, proposalId : Nat64) : Types.User {
        var new_created_proposals = Buffer.fromArray<Nat64>(user.created_proposals);
        switch (Buffer.indexOf<Nat64>(proposalId, new_created_proposals, Nat64.equal)) {
            case (null) {
                new_created_proposals.add(proposalId);
                var new_user : Types.User = {
                    created_proposals = Buffer.toArray(new_created_proposals);
                    locked_balance = user.locked_balance;
                    principal = user.principal;
                    subaccount = user.subaccount;
                    accountId = user.accountId;
                };
                return new_user;
            };
            case (?_index) {
                return user;
            };
        };
    };

    private func setLockedBalance(user : Types.User, new_locked_balance : Nat64) : Types.User {
        let new_user : Types.User = {
            principal = user.principal;
            subaccount = user.subaccount;
            accountId = user.accountId;
            created_proposals = user.created_proposals;
            locked_balance = new_locked_balance;
        };
        return new_user;
    };

    private func setClaimed(proposal : Types.Proposal) : Types.Proposal {
        let new_proposal : Types.Proposal = {
            index = proposal.index;
            name = proposal.name;
            title = proposal.title;
            description = proposal.description;
            image = proposal.image;
            subaccount = proposal.subaccount;
            accountId = proposal.accountId;
            created_by = proposal.created_by;
            claimed = true;
            amount_required = proposal.amount_required;
        };
        return new_proposal;
    };

    public shared ({ caller }) func getCallerPrincipal() : async Text {
        return Principal.toText(caller);
    };

    public shared ({ caller }) func getCallerAccountId() : async Text {
        return Utils.getAccountId(caller, null);
    };
};
