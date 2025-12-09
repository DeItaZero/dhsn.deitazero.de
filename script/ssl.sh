#!/bin/bash

# 1. Define filenames and URLs
CERT_URL="http://crt.harica.gr/HARICA-GEANT-TLS-R1.cer"
DER_FILE="harica_temp.der"
PEM_FILE="harica_intermediate.pem"
FINAL_BUNDLE="campus_dual_fixed_bundle.pem"

echo "--- Starting SSL Fix ---"

# 2. Download the missing intermediate certificate
echo "[1/5] Downloading missing intermediate certificate..."
if command -v wget &> /dev/null; then
    wget -q -O "$DER_FILE" "$CERT_URL"
elif command -v curl &> /dev/null; then
    curl -s -o "$DER_FILE" "$CERT_URL"
else
    echo "Error: Neither wget nor curl found."
    return 1 2>/dev/null || exit 1
fi

# 3. Convert DER (binary) to PEM (text)
echo "[2/5] Converting certificate to PEM format..."
openssl x509 -inform DER -in "$DER_FILE" -out "$PEM_FILE"

# 4. Find Python's default certifi bundle
echo "[3/5] Locating Python's default certificate store..."
CERTIFI_PATH=$(python3 -m certifi)

if [ -z "$CERTIFI_PATH" ]; then
    echo "Error: Could not find 'certifi'. Ensure 'requests' is installed (pip install requests)."
    return 1 2>/dev/null || exit 1
fi
echo "      Found at: $CERTIFI_PATH"

# 5. Create the new combined bundle
# We combine the standard Python certs + your new intermediate cert
echo "[4/5] Creating new combined certificate bundle..."
cat "$CERTIFI_PATH" "$PEM_FILE" > "$FINAL_BUNDLE"
PWD_BUNDLE="$(pwd)/$FINAL_BUNDLE"

# 6. Cleanup temp files
rm "$DER_FILE" "$PEM_FILE"

# 7. Export the environment variable
echo "[5/5] Setting environment variable..."
export REQUESTS_CA_BUNDLE="$PWD_BUNDLE"

echo ""
echo "✅ SUCCESS!"
echo "The environment variable 'REQUESTS_CA_BUNDLE' has been set to:"
echo "   $PWD_BUNDLE"
echo ""
echo "You can now run your python script in this terminal:"
echo "   python3 your_script.py"
