import { useState } from "react";
import { CompressionModal } from "./components/CompressionModal";
import { UploadBox } from "./components/UploadBox";
import { uploadVideo, type UploadResponse } from "./services/api";

function App() {
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const uploaded = await uploadVideo(file);
      setUpload(uploaded);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setUpload(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,#ffffff,#f8fafc)] text-slate-950">
      <UploadBox
        isUploading={isUploading}
        error={error}
        onFileSelected={handleFileSelected}
        onValidationError={setError}
      />
      {upload && <CompressionModal upload={upload} onClose={() => setUpload(null)} onReset={reset} />}
    </main>
  );
}

export default App;
