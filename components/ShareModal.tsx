import React, { useState } from 'react';
import { X, Twitter, Facebook, Link, Copy, Check } from 'lucide-react';
import { NewsStory } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: NewsStory;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, story }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/article/${story.id}`;
  const shareText = `${story.title} - ${story.summary.substring(0, 100)}...`;

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1E1E1E] w-full max-w-md rounded-2xl border border-[#2C2C2C] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#2C2C2C] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2">
            <span className="font-condensed font-black text-lg uppercase text-white">Share Story</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-bold text-white text-sm mb-2">{story.title}</h3>
            <p className="text-xs text-gray-400 line-clamp-2">{story.summary}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={shareToTwitter}
              className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#333]"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Twitter size={16} className="text-white" />
              </div>
              <span className="font-medium text-white">Share on Twitter</span>
            </button>

            <button
              onClick={shareToFacebook}
              className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#333]"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Facebook size={16} className="text-white" />
              </div>
              <span className="font-medium text-white">Share on Facebook</span>
            </button>

            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 p-3 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-colors border border-[#333]"
            >
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                {copied ? <Check size={16} className="text-green-500" /> : <Link size={16} className="text-white" />}
              </div>
              <span className="font-medium text-white">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>
          </div>

          <div className="mt-4 p-3 bg-[#121212] rounded-lg border border-[#2C2C2C]">
            <p className="text-xs text-gray-400 text-center">
              Help spread the word about Sheena Sports! 📈
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};