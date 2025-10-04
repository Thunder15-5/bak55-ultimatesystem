// frontend/components/audio/audio-uploader.tsx
'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAudioStore } from '@/store/audio-store';
import { Upload, Music, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const musicGenres = [
  'Afrobeats', 'Hip Hop', 'R&B', 'Gospel', 'Highlife',
  'Fuji', 'Juju', 'Apala', 'Reggae', 'Dancehall',
  'Amapiano', 'Bongo Flava', 'Azonto', 'Kwaito', 'Gqom'
];

interface UploadState {
  file: File | null;
  title: string;
  genre: string;
  isPublic: boolean;
  bpm?: number;
  key?: string;
}

export function AudioUploader() {
  const { uploadTrack } = useAudioStore();
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    title: '',
    genre: '',
    isPublic: true,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Please upload a valid audio file (MP3, WAV, FLAC, M4A)');
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size must be less than 50MB');
        return;
      }

      setUploadState(prev => ({ ...prev, file }));
      setUploadError(null);
      
      // Auto-fill title from filename
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setUploadState(prev => ({ ...prev, title }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!uploadState.file || !uploadState.title || !uploadState.genre) {
      setUploadError('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await uploadTrack({
        title: uploadState.title,
        genre: uploadState.genre,
        audioFile: uploadState.file,
        bpm: uploadState.bpm,
        key: uploadState.key,
        isPublic: uploadState.isPublic,
      }, (progress) => {
        setUploadProgress(progress);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setUploadState({ file: null, title: '', genre: '', isPublic: true });
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadState({ file: null, title: '', genre: '', isPublic: true });
    setUploadError(null);
    setUploadProgress(0);
  };

  return (
    <Card variant="glass" className="backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary-500" />
          Upload Your Music
        </CardTitle>
        <CardDescription>
          Share your talent with the world. Upload your best tracks and get discovered.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload Success */}
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-green-500 font-semibold">Upload Successful!</p>
                <p className="text-green-400 text-sm">
                  Your track is being processed and will be available shortly.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Error */}
        <AnimatePresence>
          {uploadError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-red-500 font-semibold">Upload Failed</p>
                <p className="text-red-400 text-sm">{uploadError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File Drop Zone */}
        {!uploadState.file && (
          <motion.div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-600 hover:border-primary-500 hover:bg-primary-500/5'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <input {...getInputProps()} />
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-white mb-2">
              {isDragActive ? 'Drop your audio file here' : 'Drag your audio file here'}
            </p>
            <p className="text-gray-400 text-sm">
              Supports MP3, WAV, FLAC, M4A • Max 50MB
            </p>
            <Button variant="outline" className="mt-4">
              Browse Files
            </Button>
          </motion.div>
        )}

        {/* File Preview & Form */}
        {uploadState.file && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* File Preview */}
            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Music className="h-8 w-8 text-primary-500" />
                <div>
                  <p className="font-semibold text-white">{uploadState.file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Uploading...</span>
                  <span className="text-primary-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <motion.div
                    className="bg-primary-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Track Details Form */}
            <div className="grid gap-4">
              <Input
                label="Track Title *"
                placeholder="Enter track title"
                value={uploadState.title}
                onChange={(e) => setUploadState(prev => ({ ...prev, title: e.target.value }))}
                disabled={isUploading}
              />

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Genre *
                </label>
                <select
                  value={uploadState.genre}
                  onChange={(e) => setUploadState(prev => ({ ...prev, genre: e.target.value }))}
                  disabled={isUploading}
                  className="w-full rounded-xl border border-dark-600 bg-dark-800/50 px-4 py-3 text-white focus:border-primary-500 focus:ring-primary-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select genre</option>
                  {musicGenres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="BPM (Optional)"
                  type="number"
                  placeholder="120"
                  value={uploadState.bpm || ''}
                  onChange={(e) => setUploadState(prev => ({ 
                    ...prev, 
                    bpm: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  disabled={isUploading}
                />

                <Input
                  label="Key (Optional)"
                  placeholder="C#m"
                  value={uploadState.key || ''}
                  onChange={(e) => setUploadState(prev => ({ ...prev, key: e.target.value }))}
                  disabled={isUploading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadState.isPublic}
                  onChange={(e) => setUploadState(prev => ({ ...prev, isPublic: e.target.checked }))}
                  disabled={isUploading}
                  className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-300">
                  Make this track public
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={resetUpload}
                  variant="outline"
                  className="flex-1"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1"
                  disabled={!uploadState.title || !uploadState.genre || isUploading}
                  isLoading={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Track'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
