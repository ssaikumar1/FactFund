import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Principal "mo:base/Principal";
import Hex "mo:encoding/Hex";
import Buffer "mo:base/Buffer";

module {
    // ===== Number and Byte Conversion Utilities =====

    // Convert a natural number to an array of bytes with specified length
    public func fromNat(len : Nat, n : Nat) : [Nat8] {
        let ith_byte = func(i : Nat) : Nat8 {
            assert (i < len);
            let shift : Nat = 8 * (len - 1 - i);
            Nat8.fromIntWrap(n / 2 ** shift);
        };
        Array.tabulate<Nat8>(len, ith_byte);
    };

    // Convert a Nat64 to a byte array (used for subaccount creation)
    public func fromNat64(n : Nat64) : [Nat8] {
        fromNat(32, Nat64.toNat(n));
    };

    // Convert a natural number to a subaccount blob
    public func natAsSubaccount(n : Nat) : Blob {
        Blob.fromArray(fromNat64(Nat64.fromNat(n)));
    };

    // ===== Account and Principal Utilities =====

    // Get account ID in hex format from a principal and optional subaccount
    public func getAccountId(principal : Principal, subaccount : ?Blob) : Text {
        Text.toLowercase(Hex.encode(Blob.toArray(Principal.toLedgerAccount(principal, subaccount))));
    };

    // Convert a Principal to a 32-byte array (Blob) for use as subaccount
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
