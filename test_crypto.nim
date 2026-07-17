import nimcrypto/sha2
let s = "test"
let h = sha256.digest(s)
echo $h
