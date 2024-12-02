import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// Encrypt a message
export const encryptMessage = (
    message: string,
    recipientPublicKey: string,
    senderPrivateKey: string
  ) => {
    try {
      console.log('Encrypting message...');
      console.log('Message:', message);
      console.log('Recipient Public Key:', recipientPublicKey);
      console.log('Sender Private Key:', senderPrivateKey);
  
      const nonce = nacl.randomBytes(24); // Generate a unique nonce\
      const msg = naclUtil.decodeUTF8(message)
      const rpk = naclUtil.decodeBase64(recipientPublicKey)
      const spk = naclUtil.decodeBase64(senderPrivateKey)
      
      const encryptedMessage = nacl.box(
        msg,
        nonce,
        rpk,
        spk
      );
  
      if (!encryptedMessage) {
        throw new Error('Encryption failed: Unable to encrypt message');
      }
  
      const result = {
        message: naclUtil.encodeBase64(encryptedMessage),
        nonce: naclUtil.encodeBase64(nonce),
        recipientPublicKey,
        senderPrivateKey
      };
  
      console.log('Generated Nonce (Base64):', result.nonce);
      console.log('Encrypted Message (Base64):', result.message);
      console.log('Recipient Public Key:', result.recipientPublicKey);
      console.log('Sender Private Key:', result.senderPrivateKey)

      console.log(result)
  
      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  };
  
// Decrypt a message
export const decryptMessage = (
  encryptedMessage: string,
  nonce: string,
  senderPublicKey: string,
  recipientPrivateKey: string
) => {
  try {
    console.log('Decrypting message...');
    console.log('Encrypted Message (Decoded):', encryptedMessage);
    console.log('Nonce (Decoded):', nonce);
    console.log('Sender Public Key (Decoded):', senderPublicKey);
    console.log('Recipient Private Key (Decoded):', recipientPrivateKey);

    const encryptMsg = naclUtil.decodeBase64(encryptedMessage)
    const encryptNonce = naclUtil.decodeBase64(nonce)
    const encryptSPK = naclUtil.decodeBase64(senderPublicKey)
    const encryptRPK = naclUtil.decodeBase64(recipientPrivateKey)

    const decryptedMessage = nacl.box.open(
      encryptMsg,
      encryptNonce,
      encryptRPK,
      encryptSPK
    );

    console.log(decryptedMessage)

    if (!decryptedMessage) {
      console.error('Decryption failed: Unable to decrypt message');
      return null;
    }

    const decodedMessage = naclUtil.encodeUTF8(decryptedMessage);
    console.log('Decrypted Message:', decodedMessage);
    return decodedMessage;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

