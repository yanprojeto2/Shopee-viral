'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Download, Loader2, PenLine, Sparkles, Type, PaintBucket, Palette, X, ChevronDown, Music2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import type { ProductWithMedia } from '@/types/database'

const CTA_OPTIONS = [
  'POV',
  'VOCÊ ACHOU O PRODUTO PERFEITO',
  'POV PARECE DE RICA MAS É DA SHOPEE',
  'POV VOCÊ NÃO SABIA QUE ISSO EXISTIA',
  'POV VOCÊ DESCOBRIU O PRODUTO MAIS ÚTIL DA SUA VIDA',
  'POV VOCÊ RIU DESSE PRODUTO ATÉ TESTAR',
]

const PRESET_COLORS = ['#ffffff', '#ffcc00', '#ff4d00', '#000000']

const FONT_OPTIONS = [
  { label: 'Clássico', value: 'Impact, "Arial Black", sans-serif' },
  { label: 'Serifa', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Sans Serif', value: 'Arial, Helvetica, sans-serif' },
]

type BgStyle = 'full' | 'translucido' | 'none'

const BG_PRESET_COLORS = ['#000000', '#ff6633', '#ffffff', '#1a1a2e', '#ffcc00']

interface VideoEditorModalProps {
  product: ProductWithMedia
  open: boolean
  onClose: () => void
}

// Instagram Reels — resolução fixa 9:16
const REEL_W = 1080
const REEL_H = 1920

// ---------------------------------------------------------------------------
// Draws one frame: video + CTA text overlay on a canvas
// ---------------------------------------------------------------------------
function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return { r, g, b }
}

function drawFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  cta: string,
  color: string,
  fontFamily: string,
  bgStyle: BgStyle,
  bgColor: string,
  pos: { x: number; y: number },
  fontScale: number
) {
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.width === 0 || canvas.height === 0) return

  // Fundo preto
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Vídeo centralizado com object-contain (bordas se formato diferente de 9:16)
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    const vr = video.videoWidth / video.videoHeight
    const cr = canvas.width / canvas.height
    let dw: number, dh: number
    if (vr > cr) { dw = canvas.width;  dh = canvas.width / vr }
    else          { dh = canvas.height; dw = canvas.height * vr }
    const dx = (canvas.width  - dw) / 2
    const dy = (canvas.height - dh) / 2
    ctx.drawImage(video, dx, dy, dw, dh)
  }

  const fontSize = Math.max(12, Math.floor(canvas.height * 0.042 * fontScale))
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'

  const maxWidth = canvas.width * 0.85
  const words = cta.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const lineH = fontSize * 1.35
  const padV = 14
  const padH = 24
  const bgH = lines.length * lineH + padV * 2
  const longestLineW = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const bgW = longestLineW + padH * 2
  // Position centered on the drag point, clamped to canvas bounds
  const bgX = Math.max(0, Math.min(canvas.width - bgW, canvas.width * pos.x - bgW / 2))
  const bgY = Math.max(0, Math.min(canvas.height - bgH, canvas.height * pos.y - bgH / 2))
  const r = 10

  // Draw background based on style
  if (bgStyle !== 'none') {
    const { r: cr, g: cg, b: cb } = hexToRgb(bgColor)
    const alpha = bgStyle === 'full' ? 1 : 0.5
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`
    ctx.beginPath()
    ctx.moveTo(bgX + r, bgY)
    ctx.lineTo(bgX + bgW - r, bgY)
    ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + r)
    ctx.lineTo(bgX + bgW, bgY + bgH - r)
    ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - r, bgY + bgH)
    ctx.lineTo(bgX + r, bgY + bgH)
    ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - r)
    ctx.lineTo(bgX, bgY + r)
    ctx.quadraticCurveTo(bgX, bgY, bgX + r, bgY)
    ctx.closePath()
    ctx.fill()
  }

  // Centro horizontal do bloco de texto
  const textCenterX = bgX + bgW / 2

  ctx.fillStyle = color
  ctx.shadowColor = 'rgba(0,0,0,0.85)'
  ctx.shadowBlur = bgStyle === 'none' ? 8 : 3
  lines.forEach((line, i) => {
    ctx.fillText(line, textCenterX, bgY + padV + fontSize + i * lineH)
  })
  ctx.shadowBlur = 0
}

// ---------------------------------------------------------------------------
export default function VideoEditorModal({
  product,
  open,
  onClose,
}: VideoEditorModalProps) {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [selectedCta, setSelectedCta] = useState(CTA_OPTIONS[0])
  const [textColor, setTextColor] = useState('#ffffff')
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0].value)
  const [bgStyle, setBgStyle] = useState<BgStyle>('none')
  const [bgColor, setBgColor] = useState('#000000')
  const [textPos, setTextPos] = useState({ x: 0.5, y: 0.82 })
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [converting, setConverting] = useState(false)
  const [convertProgress, setConvertProgress] = useState(0)
  const ffmpegRef = useRef<any>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const [activeMobilePanel, setActiveMobilePanel] = useState<'ia' | 'font' | 'bg' | 'color' | 'music' | null>(null)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicVolume, setMusicVolume] = useState(0.7)
  const musicInputRef = useRef<HTMLInputElement>(null)

  const hasEdits =
    selectedCta !== CTA_OPTIONS[0] ||
    textColor !== '#ffffff' ||
    selectedFont !== FONT_OPTIONS[0].value ||
    bgStyle !== 'none' ||
    bgColor !== '#000000' ||
    musicFile !== null

  const requestClose = () => {
    if (hasEdits && !recording) { setConfirmClose(true); return }
    onClose()
  }
  const [isEditingText, setIsEditingText] = useState(false)
  const isEditingRef = useRef(false)
  isEditingRef.current = isEditingText

  // Ao abrir o overlay de edição: foca e coloca cursor no final do texto
  useEffect(() => {
    if (!isEditingText) return
    const ta = textareaRef.current
    if (!ta) return
    const len = ta.value.length
    ta.focus()
    ta.setSelectionRange(len, len)
    ta.scrollTop = ta.scrollHeight
  }, [isEditingText])

  const togglePanel = (panel: 'ia' | 'font' | 'bg' | 'color' | 'music') =>
    setActiveMobilePanel((p) => (p === panel ? null : panel))

  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasNode, setCanvasNode] = useState<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const cancelRef = useRef<(() => void) | null>(null)
  const isDragging = useRef(false)
  const textPosRef = useRef({ x: 0.5, y: 0.82 })
  const fontScaleRef = useRef(1.0)
  const pinchStartDistRef = useRef<number | null>(null)
  const pinchStartScaleRef = useRef(1.0)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ref para evitar closure stale no useEffect de touch
  const handleCanvasClickRef = useRef(() => {})

  // Callback ref — sets both the mutable ref (for rAF) and state (to trigger touch useEffect)
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
    previewCanvasRef.current = node
    setCanvasNode(node)
  }, [])

  // Atualizado em cada render — sem closure stale
  handleCanvasClickRef.current = () => {
    if (CTA_OPTIONS.includes(selectedCta)) setSelectedCta('')
    setIsEditingText(true)
    setTimeout(() => textareaRef.current?.focus(), 80)
  }

  const getPosFromEvent = useCallback((clientX: number, clientY: number) => {
    const canvas = previewCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    const x = Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width))
    const y = Math.max(0.02, Math.min(0.98, (clientY - rect.top) / rect.height))
    return { x, y }
  }, [])

  const firstVideo = product.media.find((m) => m.type === 'video')
  const videoSrc = firstVideo
    ? firstVideo.url.startsWith('/')
      ? firstVideo.url
      : `/api/media/stream/${firstVideo.id}`
    : null

  // ------------------------------------------------------------------
  // Set canvas dimensions once when video metadata is known
  // ------------------------------------------------------------------
  const syncCanvasSize = useCallback(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    canvas.width  = REEL_W
    canvas.height = REEL_H
  }, [])

  // ------------------------------------------------------------------
  // Garante que o vídeo de preview está rodando ao abrir o modal
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    const video = previewVideoRef.current
    if (!video) return
    syncCanvasSize()
    video.play().catch(() => {})
  }, [open, syncCanvasSize])

  // ------------------------------------------------------------------
  // Preview rAF loop
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!open) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const loop = () => {
      const video = previewVideoRef.current
      const canvas = previewCanvasRef.current
      if (video && canvas && video.readyState >= 2) {
        if (canvas.width === 0) syncCanvasSize()
        drawFrame(video, canvas, isEditingRef.current ? '' : selectedCta, textColor, selectedFont, bgStyle, bgColor, textPosRef.current, fontScaleRef.current)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [open, selectedCta, textColor, selectedFont, bgStyle, bgColor, syncCanvasSize])

  // ------------------------------------------------------------------
  // Cleanup on close
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!open) cancelRef.current?.()
  }, [open])

  // ------------------------------------------------------------------
  // Touch (drag + pinch) e wheel — canvasNode garante elemento existe
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!canvasNode) return

    const pinchDist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2) {
        isDragging.current = false
        touchStartRef.current = null
        pinchStartDistRef.current = pinchDist(e.touches)
        pinchStartScaleRef.current = fontScaleRef.current
      } else {
        isDragging.current = true
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        const pos = getPosFromEvent(e.touches[0].clientX, e.touches[0].clientY)
        if (pos) textPosRef.current = pos
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
        const ratio = pinchDist(e.touches) / pinchStartDistRef.current
        fontScaleRef.current = Math.max(0.4, Math.min(4.0, pinchStartScaleRef.current * ratio))
      } else if (e.touches.length === 1 && isDragging.current) {
        const pos = getPosFromEvent(e.touches[0].clientX, e.touches[0].clientY)
        if (pos) textPosRef.current = pos
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDistRef.current = null
      if (e.touches.length === 0) {
        isDragging.current = false
        // Detecta tap (movimento mínimo)
        if (touchStartRef.current && e.changedTouches.length > 0) {
          const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x)
          const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y)
          if (dx < 10 && dy < 10) handleCanvasClickRef.current()
        }
        touchStartRef.current = null
      }
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.08 : 0.08
      fontScaleRef.current = Math.max(0.4, Math.min(4.0, fontScaleRef.current + delta))
    }

    canvasNode.addEventListener('touchstart', onTouchStart, { passive: false })
    canvasNode.addEventListener('touchmove', onTouchMove, { passive: false })
    canvasNode.addEventListener('touchend', onTouchEnd)
    canvasNode.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      canvasNode.removeEventListener('touchstart', onTouchStart)
      canvasNode.removeEventListener('touchmove', onTouchMove)
      canvasNode.removeEventListener('touchend', onTouchEnd)
      canvasNode.removeEventListener('wheel', onWheel)
    }
  }, [canvasNode, getPosFromEvent])

  // Mouse drag handlers — usados diretamente no JSX, sem useEffect
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    const pos = getPosFromEvent(e.clientX, e.clientY)
    if (pos) textPosRef.current = pos
  }, [getPosFromEvent])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const pos = getPosFromEvent(e.clientX, e.clientY)
    if (pos) textPosRef.current = pos
  }, [getPosFromEvent])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    isDragging.current = false
    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x)
      const dy = Math.abs(e.clientY - dragStartRef.current.y)
      if (dx < 6 && dy < 6) handleCanvasClickRef.current()
      dragStartRef.current = null
    }
  }, [])

  // ------------------------------------------------------------------
  // Download handler — creates fresh video + canvas, no DOM pollution
  // ------------------------------------------------------------------
  const handleDownload = async () => {
    if (!videoSrc || !firstVideo) return
    setRecording(true)
    setProgress(0)

    const video = document.createElement('video')
    video.src = videoSrc
    video.crossOrigin = 'anonymous'
    video.playsInline = true
    video.preload = 'metadata'

    // Wait for metadata
    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('Falha ao carregar vídeo'))
        video.load()
        setTimeout(() => reject(new Error('Timeout ao carregar vídeo')), 15000)
      })
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' })
      setRecording(false)
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width  = REEL_W
    canvas.height = REEL_H

    // Audio via Web Audio API — video audio + music track (opcional)
    const canvasStream = canvas.captureStream(30)
    let audioCtx: AudioContext | null = null
    let musicSource: AudioBufferSourceNode | null = null
    let audioDestNode: MediaStreamAudioDestinationNode | null = null
    let finalStream: MediaStream = canvasStream

    try {
      audioCtx = new AudioContext()
      audioDestNode = audioCtx.createMediaStreamDestination()

      // Video original audio
      try {
        const videoAudioSrc = audioCtx.createMediaElementSource(video)
        videoAudioSrc.connect(audioDestNode)
      } catch { /* sem áudio no vídeo */ }

      // Música de fundo (se selecionada)
      if (musicFile) {
        const arrayBuf = await musicFile.arrayBuffer()
        const audioBuf = await audioCtx.decodeAudioData(arrayBuf)
        musicSource = audioCtx.createBufferSource()
        musicSource.buffer = audioBuf
        musicSource.loop = true
        const gainNode = audioCtx.createGain()
        gainNode.gain.value = musicVolume
        musicSource.connect(gainNode)
        gainNode.connect(audioDestNode)
        musicSource.start()
      }

      finalStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDestNode.stream.getAudioTracks(),
      ])
    } catch {
      finalStream = canvasStream
    }

    // Snapshots compartilhados entre os dois paths
    const ctaSnapshot = selectedCta
    const colorSnapshot = textColor
    const fontSnapshot = selectedFont
    const bgStyleSnapshot = bgStyle
    const bgColorSnapshot = bgColor
    const textPosSnapshot = textPosRef.current
    const fontScaleSnapshot = fontScaleRef.current
    const timestamp = Date.now()
    const filename = `video-editado-${timestamp}.mp4`

    // ── WebCodecs path (iOS/mobile) — grava direto em H.264/MP4 ─────────────
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const hasWebCodecs = isMobileDevice
      && typeof VideoEncoder !== 'undefined'
      && typeof AudioEncoder !== 'undefined'

    if (hasWebCodecs) {
      const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')
      const target = new ArrayBufferTarget()

      const muxer = new Muxer({
        target,
        video: { codec: 'avc', width: REEL_W, height: REEL_H },
        ...(audioCtx ? {
          audio: { codec: 'aac', sampleRate: audioCtx.sampleRate, numberOfChannels: 2 },
        } : {}),
        fastStart: 'in-memory',
      } as any)

      const videoEncoder = new VideoEncoder({
        output: (chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata | undefined) =>
          muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('VideoEncoder error:', e),
      })
      videoEncoder.configure({
        codec: 'avc1.42001f',
        width: REEL_W,
        height: REEL_H,
        bitrate: 2_500_000,
        framerate: 30,
      })

      let audioEncoder: AudioEncoder | null = null
      let scriptProcessor: ScriptProcessorNode | null = null
      let audioTimestampUs = 0

      if (audioCtx && audioDestNode) {
        audioEncoder = new AudioEncoder({
          output: (chunk: EncodedAudioChunk, meta: EncodedAudioChunkMetadata | undefined) =>
            muxer.addAudioChunk(chunk, meta),
          error: (e) => console.error('AudioEncoder error:', e),
        })
        audioEncoder.configure({
          codec: 'mp4a.40.2',
          sampleRate: audioCtx.sampleRate,
          numberOfChannels: 2,
          bitrate: 128_000,
        })

        const streamSrc = audioCtx.createMediaStreamSource(audioDestNode.stream)
        scriptProcessor = audioCtx.createScriptProcessor(1024, 2, 2)
        streamSrc.connect(scriptProcessor)
        scriptProcessor.connect(audioCtx.destination)

        const localAudioCtx = audioCtx
        const localAudioEncoder = audioEncoder
        scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (localAudioEncoder.state !== 'configured') return
          const left = e.inputBuffer.getChannelData(0)
          const right = e.inputBuffer.getChannelData(1)
          const planar = new Float32Array(left.length * 2)
          planar.set(left, 0)
          planar.set(right, left.length)
          const ad = new AudioData({
            format: 'f32-planar',
            sampleRate: localAudioCtx.sampleRate,
            numberOfFrames: left.length,
            numberOfChannels: 2,
            timestamp: audioTimestampUs,
            data: planar,
          })
          localAudioEncoder.encode(ad)
          ad.close()
          audioTimestampUs += Math.round(left.length / localAudioCtx.sampleRate * 1_000_000)
        }
      }

      const fps = 30
      const frameDurationUs = Math.round(1_000_000 / fps)
      let frameIndex = 0
      let lastFrameMs = 0
      let rafId = 0

      const dur = isFinite(video.duration) ? video.duration : 0
      const interval = setInterval(() => {
        if (dur > 0) setProgress(Math.min(99, Math.round((video.currentTime / dur) * 100)))
      }, 200)

      const finishWebCodecs = async () => {
        clearInterval(interval)
        cancelAnimationFrame(rafId)
        scriptProcessor?.disconnect()
        video.pause()
        musicSource?.stop()

        try {
          await videoEncoder.flush()
          if (audioEncoder) await audioEncoder.flush()
          muxer.finalize()
        } catch (e) {
          console.error('WebCodecs finalize error:', e)
        }

        audioCtx?.close()
        setRecording(false)
        setProgress(0)
        cancelRef.current = null

        const mp4Blob = new Blob([target.buffer], { type: 'video/mp4' })
        const mp4File = new File([mp4Blob], filename, { type: 'video/mp4' })

        if (navigator.canShare?.({ files: [mp4File] })) {
          try {
            await navigator.share({ files: [mp4File], title: product.name })
            toast({ title: '✅ Vídeo pronto para salvar!', variant: 'success' })
            return
          } catch { /* cancelado */ }
        }
        const url = URL.createObjectURL(mp4Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: '✅ Download iniciado!', variant: 'success' })
      }

      const drawLoop = () => {
        if (!video.paused && !video.ended) {
          drawFrame(video, canvas, ctaSnapshot, colorSnapshot, fontSnapshot, bgStyleSnapshot, bgColorSnapshot, textPosSnapshot, fontScaleSnapshot)
          const nowMs = performance.now()
          if (nowMs - lastFrameMs >= 1000 / fps) {
            const vf = new VideoFrame(canvas, {
              timestamp: frameIndex * frameDurationUs,
              duration: frameDurationUs,
            })
            videoEncoder.encode(vf, { keyFrame: frameIndex % 30 === 0 })
            vf.close()
            frameIndex++
            lastFrameMs = nowMs
          }
          rafId = requestAnimationFrame(drawLoop)
        }
      }

      video.onended = () => { finishWebCodecs() }

      cancelRef.current = () => {
        clearInterval(interval)
        cancelAnimationFrame(rafId)
        scriptProcessor?.disconnect()
        video.pause()
        musicSource?.stop()
        audioCtx?.close()
        setRecording(false)
        setProgress(0)
        cancelRef.current = null
      }

      video.currentTime = 0
      await video.play()
      rafId = requestAnimationFrame(drawLoop)
      return
    }

    // ── MediaRecorder path (desktop) ─────────────────────────────────────────
    const preferredMime = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'].find(
      (m) => MediaRecorder.isTypeSupported(m)
    ) ?? ''
    const recorder = new MediaRecorder(
      finalStream,
      { videoBitsPerSecond: 2_500_000, ...(preferredMime ? { mimeType: preferredMime } : {}) }
    )
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = async () => {
      musicSource?.stop()
      audioCtx?.close()
      setRecording(false)
      setProgress(0)
      cancelRef.current = null

      const actualMime = recorder.mimeType || 'video/webm'
      const rawBlob = new Blob(chunks, { type: actualMime })

      if (rawBlob.size < 1000) {
        toast({ title: 'Gravação vazia — tente novamente', variant: 'destructive' })
        return
      }

      // Detecta se o blob é realmente MP4 pelos magic bytes (bytes 4-7 = 'ftyp')
      // Safari retorna mimeType vazio mas grava em MP4 nativamente
      const isMp4Blob = await (async () => {
        try {
          const buf = new Uint8Array(await rawBlob.slice(0, 12).arrayBuffer())
          return buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70
        } catch { return false }
      })()

      if (actualMime.startsWith('video/mp4') || isMp4Blob) {
        const mp4File = new File([rawBlob], filename, { type: 'video/mp4' })
        if (navigator.canShare?.({ files: [mp4File] })) {
          try {
            await navigator.share({ files: [mp4File], title: product.name })
            toast({ title: '✅ Vídeo pronto para salvar!', variant: 'success' })
            return
          } catch { /* cancelado pelo usuário */ }
        }
        const url = URL.createObjectURL(mp4File)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: '✅ Download iniciado!', variant: 'success' })
        return
      }

      // Chrome/Firefox: converte WebM → MP4 via FFmpeg.wasm
      try {
        setConverting(true)
        setConvertProgress(0)

        const { FFmpeg } = await import('@ffmpeg/ffmpeg')
        const { fetchFile, toBlobURL } = await import('@ffmpeg/util')

        if (!ffmpegRef.current) {
          const ff = new FFmpeg()
          ff.on('progress', ({ progress: p }: { progress: number }) => {
            setConvertProgress(Math.round(p * 100))
          })
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
          await ff.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          })
          ffmpegRef.current = ff
        }

        const ff = ffmpegRef.current
        await ff.writeFile('input.webm', await fetchFile(rawBlob))
        await ff.exec([
          '-i', 'input.webm',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-c:a', 'aac',
          '-movflags', '+faststart',
          'output.mp4'
        ])
        const data = await ff.readFile('output.mp4')
        const mp4Blob = new Blob([data], { type: 'video/mp4' })
        await ff.deleteFile('input.webm')
        await ff.deleteFile('output.mp4')

        const url = URL.createObjectURL(mp4Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: '✅ Download iniciado!', variant: 'success' })
      } catch (err: any) {
        console.warn('FFmpeg falhou:', err?.message)
        const webmFilename = `video-editado-${timestamp}.webm`
        const fbUrl = URL.createObjectURL(rawBlob)
        const fbA = document.createElement('a')
        fbA.href = fbUrl
        fbA.download = webmFilename
        document.body.appendChild(fbA)
        fbA.click()
        document.body.removeChild(fbA)
        URL.revokeObjectURL(fbUrl)
        toast({ title: '⚠️ Baixado como WebM — conversão falhou', variant: 'default' })
      } finally {
        setConverting(false)
        setConvertProgress(0)
      }
    }

    let rafId = 0

    const drawLoop = () => {
      if (!video.paused && !video.ended) {
        drawFrame(video, canvas, ctaSnapshot, colorSnapshot, fontSnapshot, bgStyleSnapshot, bgColorSnapshot, textPosSnapshot, fontScaleSnapshot)
        rafId = requestAnimationFrame(drawLoop)
      }
    }

    const dur = isFinite(video.duration) ? video.duration : 0
    const interval = setInterval(() => {
      if (dur > 0) setProgress(Math.min(99, Math.round((video.currentTime / dur) * 100)))
    }, 200)

    video.onended = () => {
      clearInterval(interval)
      cancelAnimationFrame(rafId)
      recorder.stop()
    }

    cancelRef.current = () => {
      clearInterval(interval)
      cancelAnimationFrame(rafId)
      if (recorder.state !== 'inactive') recorder.stop()
      video.pause()
      musicSource?.stop()
      audioCtx?.close()
      setRecording(false)
      setProgress(0)
    }

    recorder.start(100)
    video.currentTime = 0
    await video.play()
    rafId = requestAnimationFrame(drawLoop)
  }

  const handleCancel = () => {
    cancelRef.current?.()
  }

  if (!videoSrc) return null

  // ---- Conteúdo reutilizável dos painéis --------------------------------
  const textPanelContent = (
    <div>
      <p className="text-xs text-gray-500 mb-2">Escreva o texto que aparecerá no vídeo:</p>
      <textarea
        ref={textareaRef}
        rows={3}
        maxLength={120}
        placeholder="Digite seu texto aqui..."
        value={selectedCta}
        onChange={(e) => setSelectedCta(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 focus:border-shopee focus:outline-none resize-none leading-snug text-gray-800 placeholder:text-gray-400"
      />
    </div>
  )

  const iaPanelContent = (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 mb-1">Escolha um CTA pronto para usar:</p>
      {CTA_OPTIONS.map((cta) => (
        <button
          key={cta}
          onClick={() => setSelectedCta(cta)}
          className={`text-left text-xs px-3 py-2.5 rounded-lg border transition-colors leading-snug ${
            selectedCta === cta
              ? 'border-shopee bg-shopee-light text-shopee font-semibold'
              : 'border-gray-200 hover:border-shopee/60 text-gray-700'
          }`}
        >
          {cta}
        </button>
      ))}
    </div>
  )

  const fontPanelContent = (
    <div className="flex flex-col gap-2">
      {FONT_OPTIONS.map((f) => (
        <button
          key={f.value}
          onClick={() => setSelectedFont(f.value)}
          className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
            selectedFont === f.value
              ? 'border-shopee bg-shopee-light text-shopee font-semibold'
              : 'border-gray-200 hover:border-shopee/60 text-gray-700'
          }`}
          style={{ fontFamily: f.value, fontSize: '14px' }}
        >
          {f.label}
        </button>
      ))}
    </div>
  )

  const bgPanelContent = (
    <div>
      <div className="flex gap-2 mb-3">
        {([
          { key: 'full', label: 'Cheio' },
          { key: 'translucido', label: 'Translúcido' },
          { key: 'none', label: 'Sem BG' },
        ] as { key: BgStyle; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setBgStyle(key)}
            className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${
              bgStyle === key
                ? 'border-shopee bg-shopee-light text-shopee font-semibold'
                : 'border-gray-200 hover:border-shopee/60 text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {bgStyle !== 'none' && (
        <div className="flex items-center gap-3">
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" title="Cor do background" />
          <div className="flex gap-2">
            {BG_PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setBgColor(c)} title={c}
                className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === c ? 'border-shopee scale-110' : 'border-gray-300'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const colorPanelContent = (
    <div className="flex items-center gap-3">
      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
        className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200" title="Escolha uma cor" />
      <div className="flex gap-2">
        {PRESET_COLORS.map((c) => (
          <button key={c} onClick={() => setTextColor(c)} title={c}
            className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c ? 'border-shopee scale-110' : 'border-gray-300'}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  )

  const musicPanelContent = (
    <div className="flex flex-col gap-3">
      <input
        ref={musicInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setMusicFile(f) }}
      />
      {musicFile ? (
        <div className="flex items-center gap-2 bg-shopee-light rounded-lg px-3 py-2.5">
          <Music2 className="h-4 w-4 text-shopee flex-shrink-0" />
          <span className="text-sm text-gray-700 flex-1 truncate">{musicFile.name}</span>
          <button onClick={() => setMusicFile(null)}>
            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => musicInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-shopee-border rounded-lg hover:border-shopee text-sm text-gray-500 hover:text-shopee transition-colors"
        >
          <Music2 className="h-4 w-4" />
          Escolher música (MP3/AAC)
        </button>
      )}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500">Volume da música</p>
          <span className="text-xs text-gray-400">{Math.round(musicVolume * 100)}%</span>
        </div>
        <input
          type="range" min={0} max={1} step={0.05}
          value={musicVolume}
          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
          className="w-full accent-shopee"
        />
      </div>
      <p className="text-xs text-gray-400 leading-snug">
        Use músicas royalty-free do{' '}
        <strong>YouTube Audio Library</strong> ou{' '}
        <strong>Pixabay Music</strong> — gratuitas e sem direitos autorais.
      </p>
    </div>
  )

  const downloadSection = (
    <div className="mt-auto pt-3 border-t border-gray-100">
      {!recording && !converting ? (
        <Button className="w-full min-h-[44px]" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-1" />
          Baixar com edição (HD)
        </Button>
      ) : converting ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin text-shopee flex-shrink-0" />
            <span>Convertendo para MP4... {convertProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-shopee h-2 rounded-full transition-all duration-200" style={{ width: `${convertProgress}%` }} />
          </div>
          <p className="text-xs text-gray-400 text-center">Aguarde, isso pode levar alguns segundos</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Loader2 className="h-4 w-4 animate-spin text-shopee flex-shrink-0" />
            <span>Gravando... {progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-shopee h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleCancel}>Cancelar</Button>
        </div>
      )}
    </div>
  )

  // -----------------------------------------------------------------------
  const MOBILE_ICONS = [
    { key: 'ia'    as const, Icon: Sparkles,    label: 'IA'     },
    { key: 'font'  as const, Icon: Type,        label: 'Fonte'  },
    { key: 'bg'    as const, Icon: PaintBucket, label: 'Fundo'  },
    { key: 'color' as const, Icon: Palette,     label: 'Cor'    },
    { key: 'music' as const, Icon: Music2,      label: 'Música' },
  ]

  const PANEL_TITLES: Record<string, string> = {
    ia: 'CTAs prontos (IA)', font: 'Fonte', bg: 'Background', color: 'Cor do texto', music: 'Música de fundo',
  }

  if (!open || !mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={requestClose} />

      {/* Modal — tela cheia no mobile, centralizado no desktop */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden
        md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
        md:w-[900px] md:max-h-[95vh] md:rounded-xl md:shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 flex-shrink-0 bg-shopee">
          <span className="text-white font-extrabold text-lg">Editor de vídeo viral</span>
          <button onClick={requestClose} className="p-1 rounded-full hover:bg-white/20 text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wrapper com relative para o overlay de confirmação */}
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Confirmação de fechamento — overlay interno */}
        {confirmClose && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
              <p className="text-base font-bold text-gray-800 text-center leading-snug">
                Ao fechar, as edições realizadas serão perdidas.
              </p>
              <p className="text-sm text-gray-500 text-center">Tem certeza que deseja sair?</p>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => setConfirmClose(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Não, continuar
                </button>
                <button
                  onClick={() => { setConfirmClose(false); onClose() }}
                  className="flex-1 py-2.5 rounded-xl bg-shopee text-white font-semibold text-sm hover:bg-shopee-dark transition-colors"
                >
                  Sim, fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

          {/* ---- Área do vídeo ---- */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
            <video ref={previewVideoRef} src={videoSrc} crossOrigin="anonymous"
              autoPlay muted loop playsInline preload="auto"
              onLoadedMetadata={syncCanvasSize}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
            <canvas
              ref={canvasCallbackRef}
              className="max-h-full max-w-full object-contain"
              style={{ display: 'block', margin: '0 auto', cursor: 'move', touchAction: 'none' }}
              title="Arraste para reposicionar o texto"
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={() => { isDragging.current = false; dragStartRef.current = null }}
            />
            <p className="absolute bottom-2 left-0 right-0 text-center text-white/50 text-[10px] pointer-events-none select-none md:text-xs">
              Arraste para mover · Scroll/pinch para tamanho
            </p>

            {/* ---- Overlay de edição inline (mobile + desktop) ---- */}
            {isEditingText && (
              <div
                className="absolute inset-0 z-30"
                onClick={(e) => { if (e.target === e.currentTarget) setIsEditingText(false) }}
              >
                <textarea
                  ref={textareaRef}
                  rows={3}
                  maxLength={120}
                  placeholder="Digite aqui..."
                  value={selectedCta}
                  onChange={(e) => setSelectedCta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingText(false) }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: `${textPosRef.current.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: textColor,
                    fontFamily: selectedFont,
                    fontWeight: 'bold',
                    fontSize: 'clamp(16px, 5vw, 26px)',
                    textAlign: 'center',
                    textShadow: '0 2px 6px rgba(0,0,0,0.9)',
                    resize: 'none',
                    width: '85%',
                    caretColor: 'white',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                  }}
                />
                <button
                  onClick={() => setIsEditingText(false)}
                  className="absolute top-3 right-10 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-bold"
                >
                  OK
                </button>
              </div>
            )}

            {/* ---- Ícones laterais — APENAS MOBILE ---- */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 md:hidden">
              {/* Texto — abre edição inline */}
              <button
                onClick={() => { if (CTA_OPTIONS.includes(selectedCta)) setSelectedCta(''); setIsEditingText(true); setTimeout(() => textareaRef.current?.focus(), 80) }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className={`rounded-full p-2.5 transition-colors ${isEditingText ? 'bg-shopee' : 'bg-black/55'}`}>
                  <PenLine className="h-5 w-5 text-white" />
                </div>
                <span className="text-white text-[10px] drop-shadow-md">Texto</span>
              </button>

              {MOBILE_ICONS.map(({ key, Icon, label }) => (
                <button key={key} onClick={() => togglePanel(key)}
                  className="flex flex-col items-center gap-0.5">
                  <div className={`relative rounded-full p-2.5 transition-colors ${
                    activeMobilePanel === key ? 'bg-shopee' : 'bg-black/55'
                  }`}>
                    <Icon className="h-5 w-5 text-white" />
                    {key === 'music' && musicFile && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-green-400 rounded-full border border-black/30" />
                    )}
                  </div>
                  <span className="text-white text-[10px] drop-shadow-md">{label}</span>
                </button>
              ))}

              {/* Botão download / gravando / convertendo */}
              {!recording && !converting ? (
                <button onClick={handleDownload} className="flex flex-col items-center gap-0.5">
                  <div className="rounded-full p-2.5 bg-shopee">
                    <Download className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-white text-[10px] drop-shadow-md">Baixar</span>
                </button>
              ) : converting ? (
                <button disabled className="flex flex-col items-center gap-0.5 opacity-90">
                  <div className="rounded-full p-2.5 bg-yellow-500 flex flex-col items-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                    <span className="text-white text-[8px] leading-none">{convertProgress}%</span>
                  </div>
                  <span className="text-white text-[10px] drop-shadow-md">MP4...</span>
                </button>
              ) : (
                <button onClick={handleCancel} className="flex flex-col items-center gap-0.5">
                  <div className="rounded-full p-2.5 bg-red-500 flex flex-col items-center">
                    <X className="h-5 w-5 text-white" />
                    <span className="text-white text-[8px] leading-none">{progress}%</span>
                  </div>
                  <span className="text-white text-[10px] drop-shadow-md">Cancelar</span>
                </button>
              )}
            </div>

            {/* ---- Painel deslizante — APENAS MOBILE ---- */}
            <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-20 md:hidden transition-transform duration-300 ${
              activeMobilePanel ? 'translate-y-0' : 'translate-y-full'
            }`}>
              {/* Handle + título */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-800">
                  {activeMobilePanel ? PANEL_TITLES[activeMobilePanel] : ''}
                </span>
                <button onClick={() => setActiveMobilePanel(null)} className="p-1">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4 max-h-[45vh] overflow-y-auto pb-8">
                {activeMobilePanel === 'ia'    && iaPanelContent}
                {activeMobilePanel === 'font'  && fontPanelContent}
                {activeMobilePanel === 'bg'    && bgPanelContent}
                {activeMobilePanel === 'color' && colorPanelContent}
                {activeMobilePanel === 'music' && musicPanelContent}
              </div>
            </div>
          </div>

          {/* ---- Sidebar — APENAS DESKTOP ---- */}
          <div className="hidden md:flex md:flex-col w-72 gap-5 p-5 border-l border-gray-100 bg-white overflow-y-auto">
            <div><p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-shopee" />CTAs prontos (IA)</p>{iaPanelContent}</div>
            <div><p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><PenLine className="h-4 w-4 text-gray-600" />Seu texto</p>{textPanelContent}<p className="text-xs text-gray-400 mt-1">Ou clique diretamente no vídeo para editar</p></div>
            <div><p className="text-sm font-bold text-gray-800 mb-2">Fonte</p>{fontPanelContent}</div>
            <div><p className="text-sm font-bold text-gray-800 mb-2">Background do texto</p>{bgPanelContent}</div>
            <div><p className="text-sm font-bold text-gray-800 mb-2">Cor do texto</p>{colorPanelContent}</div>
            <div><p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5"><Music2 className="h-4 w-4 text-shopee" />Música de fundo</p>{musicPanelContent}</div>
            {downloadSection}
          </div>

        </div>
        </div>{/* fim wrapper relative */}
      </div>
    </>,
    document.body
  )
}
