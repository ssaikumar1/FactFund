import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import Hex "mo:encoding/Hex";
import Buffer "mo:base/Buffer";
module {
    public func fromNat(len : Nat, n : Nat) : [Nat8] {
        let ith_byte = func(i : Nat) : Nat8 {
            assert (i < len);
            let shift : Nat = 8 * (len - 1 - i);
            Nat8.fromIntWrap(n / 2 ** shift);
        };
        Array.tabulate<Nat8>(len, ith_byte);
    };

    public func fromNat64(n : Nat64) : [Nat8] {
        fromNat(32, Nat64.toNat(n));
    };

    public func getAccountId(principal : Principal, subaccount : ?Blob) : Text {
        Text.toLowercase(Hex.encode(Blob.toArray(Principal.toLedgerAccount(principal, subaccount))));
    };

    public func natAsSubaccount(n : Nat) : Blob {
        Blob.fromArray(fromNat64(Nat64.fromNat(n)));
    };

    // Convert a Principal to a 32-byte array (Blob)
    public func principalAsThirtyTwoBytes(p : Principal) : Blob {
        let p_bytes = Blob.toArray(Principal.toBlob(p));
        let buf = Buffer.Buffer<Nat8>(32);
        buf.add(Nat8.fromNat(p_bytes.size()));
        for (b in p_bytes.vals()) {
            buf.add(b);
        };
        // Fill the rest with zeros if needed
        while (buf.size() < 32) {
            buf.add(0);
        };
        Blob.fromArray(Buffer.toArray(buf));
    };

    // Convert a 32-byte array (Blob) back to a Principal
    public func thirtyTwoBytesAsPrincipal(bytes : Blob) : Principal {
        let arr = Blob.toArray(bytes);
        let len = arr[0];
        let principalBytes = Array.tabulate<Nat8>(Nat8.toNat(len), func(i) { arr[i + 1] });
        Principal.fromBlob(Blob.fromArray(principalBytes));
    };

};
