import { useState } from 'react';
import CryptoJS from 'crypto-js';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Copy, Check, Shield, Eye, EyeOff } from 'lucide-react';
import FileDropZone from './FileDropZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const EncryptorApp = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pemFile, setPemFile] = useState<File | null>(null);

  const [password, setPassword] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showDecryptPassword, setShowDecryptPassword] = useState(false);

  const [encryptedString, setEncryptedString] = useState('');
  const [pemContent, setPemContent] = useState('');

  const [decryptInput, setDecryptInput] = useState('');
  const [decryptedFileName, setDecryptedFileName] = useState('');

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [copied, setCopied] = useState(false);

  const { toast } = useToast();

  // 🔐 ENCRYPT
  const handleEncrypt = () => {
    if (!file || !password) {
      toast({
        title: 'Missing input',
        description: 'Select a file and enter a password.',
        variant: 'destructive',
      });
      return;
    }

    setIsEncrypting(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const base64Data = arrayBufferToBase64(arrayBuffer);

      const encrypted = CryptoJS.AES.encrypt(base64Data, password).toString();

      const payload = JSON.stringify({
        name: file.name,
        type: file.type,
        data: encrypted,
      });

      setEncryptedString(payload);

      // ✅ PEM content
      const pem = `-----BEGIN ENCRYPTED FILE-----
${btoa(payload)}
-----END ENCRYPTED FILE-----`;

      setPemContent(pem);

      setIsEncrypting(false);

      toast({
        title: 'Encrypted!',
        description: 'You can copy or download PEM.',
      });
    };

    reader.readAsArrayBuffer(file);
  };

  // 🔓 DECRYPT
  const handleDecrypt = () => {
    if ((!decryptInput && !pemFile) || !decryptPassword) {
      toast({
        title: 'Missing input',
        description: 'Provide PEM or string + password.',
        variant: 'destructive',
      });
      return;
    }

    setIsDecrypting(true);

    const processPayload = (payload: any) => {
      const decryptedBase64 = CryptoJS.AES.decrypt(
        payload.data,
        decryptPassword
      ).toString(CryptoJS.enc.Utf8);

      if (!decryptedBase64) throw new Error();

      const bytes = base64ToUint8Array(decryptedBase64);

      const blob = new Blob([bytes], {
        type: payload.type || 'application/octet-stream',
      });

      saveAs(blob, decryptedFileName || payload.name || 'decrypted_file');

      toast({
        title: 'Decrypted!',
        description: 'File downloaded successfully.',
      });
    };

    try {
      // ✅ PEM FILE
      if (pemFile) {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;

            const base64Payload = text
              .replace('-----BEGIN ENCRYPTED FILE-----', '')
              .replace('-----END ENCRYPTED FILE-----', '')
              .trim();

            const payload = JSON.parse(atob(base64Payload));
            processPayload(payload);
          } catch {
            toast({
              title: 'Invalid PEM file',
              variant: 'destructive',
            });
          }

          setIsDecrypting(false);
        };

        reader.readAsText(pemFile);
        return;
      }

      // ✅ TEXT INPUT
      let payload;

      if (decryptInput.includes('-----BEGIN ENCRYPTED FILE-----')) {
        const base64Payload = decryptInput
          .replace('-----BEGIN ENCRYPTED FILE-----', '')
          .replace('-----END ENCRYPTED FILE-----', '')
          .trim();

        payload = JSON.parse(atob(base64Payload));
      } else {
        payload = JSON.parse(decryptInput);
      }

      processPayload(payload);
    } catch {
      toast({
        title: 'Decryption failed',
        description: 'Wrong password or corrupted data.',
        variant: 'destructive',
      });
    }

    setIsDecrypting(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(encryptedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <motion.div className="w-full max-w-xl">

        {/* HEADER */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">File Vault</h1>
        </div>

        <Tabs defaultValue="encrypt">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
            <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
          </TabsList>

          {/* 🔐 ENCRYPT */}
          <TabsContent value="encrypt" className="space-y-4">
            <FileDropZone onFileSelect={setFile} selectedFile={file} />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button onClick={handleEncrypt} disabled={isEncrypting}>
              <Lock className="mr-2 h-4 w-4" />
              Encrypt File
            </Button>

            <AnimatePresence>
              {encryptedString && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Encrypted Output</span>
                    <Button size="sm" onClick={handleCopy}>
                      {copied ? <Check /> : <Copy />}
                    </Button>
                  </div>

                  <pre className="max-h-32 overflow-auto bg-gray-100 p-2 text-xs">
                    {encryptedString.slice(0, 500)}
                  </pre>

                  {/* ✅ DOWNLOAD PEM BUTTON */}
                  {pemContent && (
                    <Button
                      onClick={() => {
                        const blob = new Blob([pemContent], {
                          type: 'application/x-pem-file',
                        });
                        saveAs(blob, `${file?.name || 'encrypted'}.pem`);
                      }}
                      className="w-full"
                    >
                      Download PEM File
                    </Button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* 🔓 DECRYPT */}
          <TabsContent value="decrypt" className="space-y-4">

            {/* ✅ PEM UPLOAD */}
            <FileDropZone onFileSelect={setPemFile} selectedFile={pemFile} />

            <textarea
              className="w-full border p-2 text-sm"
              rows={4}
              placeholder="Paste encrypted string or PEM..."
              value={decryptInput}
              onChange={(e) => setDecryptInput(e.target.value)}
            />

            <div className="relative">
              <Input
                type={showDecryptPassword ? 'text' : 'password'}
                placeholder="Password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
              />
              <button
                onClick={() =>
                  setShowDecryptPassword(!showDecryptPassword)
                }
                className="absolute right-3 top-2"
              >
                {showDecryptPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            </div>

            <Input
              placeholder="Custom filename (optional)"
              value={decryptedFileName}
              onChange={(e) => setDecryptedFileName(e.target.value)}
            />

            <Button onClick={handleDecrypt} disabled={isDecrypting}>
              <Unlock className="mr-2 h-4 w-4" />
              Decrypt & Download
            </Button>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default EncryptorApp;