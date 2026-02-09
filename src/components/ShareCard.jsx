import { useState } from 'react'
import { generateShareText, copyToClipboard } from '../lib/share'

export default function ShareCard({ username, stats, generateImage }) {
  const [copied, setCopied] = useState(false)
  const [tweetHint, setTweetHint] = useState(false)
  const shareText = generateShareText({ username, stats })

  async function handleCopy() {
    await copyToClipboard(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleTweet() {
    // Copy image to clipboard so user can paste it in the tweet
    if (generateImage) {
      try {
        const blob = await generateImage()
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          setTweetHint(true)
          setTimeout(() => setTweetHint(false), 4000)
        }
      } catch {
        // Clipboard image write not supported — no big deal
      }
    }

    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleShare() {
    if (!generateImage || !navigator.share) {
      await handleTweet()
      return
    }

    try {
      const blob = await generateImage()
      const file = blob ? new File([blob], 'lights-out.png', { type: 'image/png' }) : null
      const shareData = { text: shareText }
      if (file && navigator.canShare?.({ files: [file] })) {
        shareData.files = [file]
      }
      await navigator.share(shareData)
    } catch {
      // User cancelled or failed
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="space-y-3">
      <pre className="text-xs text-gh-text-muted whitespace-pre-wrap font-mono leading-relaxed bg-gh-bg/60 rounded-lg p-3 border border-gh-border">
        {shareText}
      </pre>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-4 rounded-lg border border-gh-border text-gh-text text-sm font-medium hover:bg-gh-0 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={handleTweet}
          className="flex-1 py-2 px-4 rounded-lg bg-gh-0 border border-gh-border text-gh-text text-sm font-medium hover:bg-gh-0 transition-colors"
        >
          Tweet
        </button>
        {canNativeShare && (
          <button
            onClick={handleShare}
            className="flex-1 py-2 px-4 rounded-lg bg-[#1d9bf0] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Share
          </button>
        )}
      </div>
      {tweetHint && (
        <p className="text-xs text-gh-4 text-center animate-fade-in">
          Image copied to clipboard — paste it in your tweet!
        </p>
      )}
    </div>
  )
}
