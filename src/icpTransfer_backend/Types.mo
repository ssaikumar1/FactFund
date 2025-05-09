module {

    public type User = {
        principal : Principal;
        subaccount : Blob;
        accountId : Text;
        created_proposals : [Nat64];
        locked_balance : Nat64;
    };

    public type Proposal = {
        index : Nat64;
        name : Text;
        title : Text;
        description : Text;
        image : Blob;
        subaccount : Blob;
        accountId : Text;
        created_by : Principal;
        amount_required : Nat64;
        claimed : Bool;
    };

    public type Vector<Proposal> = {
        var data_blocks : [var [var ?Proposal]];
        var i_block : Nat;
        var i_element : Nat;
    };

    public type HashUtils<Principal> = (
        getHash : (Principal) -> Nat32,
        areEqual : (Principal, Principal) -> Bool,
    );
};
