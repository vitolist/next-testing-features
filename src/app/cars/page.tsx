'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Car, Sparkles, Download, Palette, Hash } from 'lucide-react'

interface ProcessedImage {
    url: string
    transparent: boolean
}

interface FinalImage {
    dataUrl: string
    gradient: string
    number: string
}

export default function CarTransformPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null)
    const [finalImage, setFinalImage] = useState<FinalImage | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedGradient, setSelectedGradient] = useState('from-blue-500 to-purple-600')
    const [carNumber, setCarNumber] = useState('95')
    const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
    const [customGradient, setCustomGradient] = useState({
        color1: '#3b82f6',
        color2: '#7c3aed',
        direction: 'to-br'
    })
    const [numberSettings, setNumberSettings] = useState({
        x: 50, // percentage from left
        y: 30, // percentage from top
        size: 120, // font size in pixels
        font: 'monospace'
    })
    const [isCustomizing, setIsCustomizing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const gradientOptions = [
        { name: 'Ocean', class: 'from-blue-500 to-purple-600', colors: { color1: '#3b82f6', color2: '#7c3aed' } },
        { name: 'Sunset', class: 'from-orange-500 to-red-600', colors: { color1: '#f97316', color2: '#dc2626' } },
        { name: 'Forest', class: 'from-green-500 to-emerald-600', colors: { color1: '#22c55e', color2: '#059669' } },
        { name: 'Fire', class: 'from-red-500 to-yellow-600', colors: { color1: '#ef4444', color2: '#ca8a04' } },
        { name: 'Night', class: 'from-gray-900 to-purple-900', colors: { color1: '#111827', color2: '#581c87' } },
        { name: 'Dawn', class: 'from-pink-500 to-orange-500', colors: { color1: '#ec4899', color2: '#f97316' } },
        { name: 'Electric', class: 'from-cyan-500 to-blue-600', colors: { color1: '#06b6d4', color2: '#2563eb' } },
        { name: 'Custom', class: 'custom', colors: { color1: customGradient.color1, color2: customGradient.color2 } },
    ]

    const fontOptions = [
        { name: 'MONO', value: 'monospace' },
        { name: 'SANS', value: 'sans-serif' },
        { name: 'SERIF', value: 'serif' },
        { name: 'IMPACT', value: 'Impact, sans-serif' },
        { name: 'ARIAL BLACK', value: 'Arial Black, sans-serif' },
        { name: 'COOPER BLACK', value: 'Cooper Black, serif' }
    ]

    const gradientDirections = [
        { name: 'TOP-RIGHT', value: 'to-br' },
        { name: 'RIGHT', value: 'to-r' },
        { name: 'BOTTOM-RIGHT', value: 'to-br' },
        { name: 'BOTTOM', value: 'to-b' },
        { name: 'BOTTOM-LEFT', value: 'to-bl' },
        { name: 'LEFT', value: 'to-l' },
        { name: 'TOP-LEFT', value: 'to-tl' },
        { name: 'TOP', value: 'to-t' }
    ]

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            setProcessedImage(null)
            setFinalImage(null)
        }
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            setProcessedImage(null)
            setFinalImage(null)
        }
    }

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
    }

    const processImage = async () => {
        if (!selectedFile) return

        setIsProcessing(true)
        try {
            const formData = new FormData()
            formData.append('image', selectedFile)

            const response = await fetch('/api/transform-car', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to process image')
            }

            const data = await response.json()
            setProcessedImage({
                url: data.imageUrl,
                transparent: true
            })
        } catch (error) {
            console.error('Error processing image:', error)
            alert('Failed to process image. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const generateFinalImage = async () => {
        if (!processedImage || !canvasRef.current) return

        setIsGeneratingFinal(true)
        try {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Set canvas size
            canvas.width = 800
            canvas.height = 600

            // Create gradient background
            let gradient
            if (selectedGradient === 'custom') {
                // Use custom gradient
                if (customGradient.direction === 'to-r') {
                    gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
                } else if (customGradient.direction === 'to-l') {
                    gradient = ctx.createLinearGradient(canvas.width, 0, 0, 0)
                } else if (customGradient.direction === 'to-b') {
                    gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
                } else if (customGradient.direction === 'to-t') {
                    gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
                } else if (customGradient.direction === 'to-br') {
                    gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
                } else if (customGradient.direction === 'to-bl') {
                    gradient = ctx.createLinearGradient(canvas.width, 0, 0, canvas.height)
                } else if (customGradient.direction === 'to-tr') {
                    gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0)
                } else {
                    gradient = ctx.createLinearGradient(canvas.width, canvas.height, 0, 0)
                }
                gradient.addColorStop(0, customGradient.color1)
                gradient.addColorStop(1, customGradient.color2)
            } else {
                // Use preset gradient
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
                const gradientColors = getGradientColors(selectedGradient)
                gradient.addColorStop(0, gradientColors.from)
                gradient.addColorStop(1, gradientColors.to)
            }

            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Load and draw the car image
            const carImg = new Image()
            carImg.crossOrigin = 'anonymous'

            await new Promise((resolve, reject) => {
                carImg.onload = resolve
                carImg.onerror = reject
                carImg.src = processedImage.url
            })

            // Calculate car position and size
            const carWidth = Math.min(500, canvas.width * 0.6)
            const carHeight = (carImg.height / carImg.width) * carWidth
            const carX = (canvas.width - carWidth) / 2
            const carY = (canvas.height - carHeight) / 2

            // Draw racing number with custom settings
            if (carNumber) {
                ctx.font = `bold ${numberSettings.size}px ${numberSettings.font}`
                ctx.fillStyle = '#000000'
                ctx.strokeStyle = '#FFFFFF'
                ctx.lineWidth = Math.max(6, numberSettings.size / 20)
                ctx.textAlign = 'center'

                // Calculate position based on percentages
                const numberX = (canvas.width * numberSettings.x) / 100
                const numberY = (canvas.height * numberSettings.y) / 100

                // Shadow effect
                ctx.fillStyle = '#000000'
                ctx.fillText(carNumber, numberX + 4, numberY + 4)

                // Main number
                ctx.fillStyle = '#FFFFFF'
                ctx.strokeText(carNumber, numberX, numberY)
                ctx.fillText(carNumber, numberX, numberY)
            }

            ctx.drawImage(carImg, carX, carY, carWidth, carHeight)


            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png')
            setFinalImage({
                dataUrl,
                gradient: selectedGradient,
                number: carNumber
            })
        } catch (error) {
            console.error('Error generating final image:', error)
            alert('Failed to generate final image. Please try again.')
        } finally {
            setIsGeneratingFinal(false)
        }
    }

    const getGradientColors = (gradientClass: string) => {
        const colorMap: { [key: string]: { from: string; to: string } } = {
            'from-blue-500 to-purple-600': { from: '#3b82f6', to: '#7c3aed' },
            'from-orange-500 to-red-600': { from: '#f97316', to: '#dc2626' },
            'from-green-500 to-emerald-600': { from: '#22c55e', to: '#059669' },
            'from-red-500 to-yellow-600': { from: '#ef4444', to: '#ca8a04' },
            'from-gray-900 to-purple-900': { from: '#111827', to: '#581c87' },
            'from-pink-500 to-orange-500': { from: '#ec4899', to: '#f97316' },
            'from-cyan-500 to-blue-600': { from: '#06b6d4', to: '#2563eb' },
            'from-lime-500 to-green-600': { from: '#84cc16', to: '#16a34a' },
        }
        return colorMap[gradientClass] || colorMap['from-blue-500 to-purple-600']
    }

    const downloadImage = () => {
        if (!finalImage) return

        const link = document.createElement('a')
        link.download = `disney-car-${carNumber}-${Date.now()}.png`
        link.href = finalImage.dataUrl
        link.click()
    }

    return (
        <div className="min-h-screen bg-black text-white font-mono">
            {/* Brutal Header */}
            <div className="border-b-4 border-white bg-yellow-400 text-black p-6">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <div className="bg-black p-3 border-4 border-black">
                        <Car className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider">
                            CAR TRANSFORMER
                        </h1>
                        <p className="text-lg font-bold">
                            UPLOAD • TRANSFORM • CUSTOMIZE • DOWNLOAD
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Upload Section */}
                <Card className="bg-white border-4 border-black text-black">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-black p-2">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-black uppercase">STEP 01: UPLOAD CAR IMAGE</h2>
                        </div>

                        <div
                            className="border-4 border-dashed border-black p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <div className="space-y-4">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-64 mx-auto border-4 border-black"
                                    />
                                    <p className="font-bold">READY TO TRANSFORM</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Upload className="w-16 h-16 mx-auto" />
                                    <div>
                                        <p className="text-xl font-bold">DROP YOUR CAR IMAGE HERE</p>
                                        <p className="font-bold mt-2">OR CLICK TO SELECT FILE</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {selectedFile && (
                            <div className="mt-6">
                                <Button
                                    onClick={processImage}
                                    disabled={isProcessing}
                                    className="bg-black text-white border-4 border-black hover:bg-white hover:text-black font-black text-lg px-8 py-3 uppercase tracking-wider"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                            TRANSFORMING...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            TRANSFORM TO DISNEY CARS
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Processed Image Section */}
                {processedImage && (
                    <Card className="bg-red-500 border-4 border-black text-white">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-black p-2">
                                    <Car className="w-6 h-6 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-black uppercase">STEP 02: DISNEY CARS TRANSFORMATION</h2>
                            </div>

                            <div className="bg-white p-4 border-4 border-black inline-block">
                                <img
                                    src={processedImage.url}
                                    alt="Transformed car"
                                    className="max-w-full max-h-64"
                                />
                            </div>

                            <p className="mt-4 text-xl font-bold">✓ TRANSPARENT BACKGROUND APPLIED</p>
                            <p className="text-lg font-bold">✓ DISNEY CARS STYLE TRANSFORMATION COMPLETE</p>
                        </div>
                    </Card>
                )}

                {/* Customization Section */}
                {processedImage && (
                    <Card className="bg-blue-500 border-4 border-black text-white">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-black p-2">
                                    <Palette className="w-6 h-6 text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-black uppercase">STEP 03: CUSTOMIZE YOUR CAR</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <Label className="text-xl font-black uppercase mb-4 block">
                                        <Hash className="w-5 h-5 inline mr-2" />
                                        Racing Number
                                    </Label>
                                    <Input
                                        type="text"
                                        value={carNumber}
                                        onChange={(e) => setCarNumber(e.target.value)}
                                        placeholder="95"
                                        maxLength={3}
                                        className="text-black border-4 border-black font-black text-2xl text-center h-16 mb-4"
                                    />

                                    {/* Number Customization */}
                                    <div className="bg-black p-4 border-4 border-white">
                                        <h3 className="text-lg font-black mb-4">NUMBER SETTINGS</h3>

                                        {/* Font Selection */}
                                        <div className="mb-4">
                                            <Label className="text-sm font-black mb-2 block">FONT STYLE</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {fontOptions.map((font) => (
                                                    <button
                                                        key={font.value}
                                                        onClick={() => setNumberSettings(prev => ({ ...prev, font: font.value }))}
                                                        className={`p-2 border-2 border-white text-xs font-black ${numberSettings.font === font.value ? 'bg-white text-black' : 'bg-black text-white'
                                                            }`}
                                                        style={{ fontFamily: font.value }}
                                                    >
                                                        {font.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Size Control */}
                                        <div className="mb-4">
                                            <Label className="text-sm font-black mb-2 block">SIZE: {numberSettings.size}px</Label>
                                            <input
                                                type="range"
                                                min="60"
                                                max="200"
                                                value={numberSettings.size}
                                                onChange={(e) => setNumberSettings(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                                                className="w-full h-4 bg-white border-2 border-black"
                                            />
                                        </div>

                                        {/* Position Controls */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-black mb-2 block">X: {numberSettings.x}%</Label>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="90"
                                                    value={numberSettings.x}
                                                    onChange={(e) => setNumberSettings(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                                    className="w-full h-4 bg-white border-2 border-black"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-black mb-2 block">Y: {numberSettings.y}%</Label>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="90"
                                                    value={numberSettings.y}
                                                    onChange={(e) => setNumberSettings(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                                    className="w-full h-4 bg-white border-2 border-black"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xl font-black uppercase mb-4 block">
                                        Background Gradient
                                    </Label>

                                    {/* Preset Gradients */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {gradientOptions.slice(0, -1).map((option) => (
                                            <button
                                                key={option.name}
                                                onClick={() => {
                                                    setSelectedGradient(option.class)
                                                    setIsCustomizing(false)
                                                }}
                                                className={`p-4 border-4 border-black font-black uppercase text-sm ${selectedGradient === option.class && !isCustomizing
                                                        ? 'bg-white text-black'
                                                        : 'bg-black text-white hover:bg-white hover:text-black'
                                                    }`}
                                            >
                                                <div className={`w-full h-8 bg-gradient-to-r ${option.class} mb-2 border-2 border-black`} />
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Gradient Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedGradient('custom')
                                            setIsCustomizing(true)
                                        }}
                                        className={`w-full p-4 border-4 border-black font-black uppercase text-sm mb-4 ${isCustomizing
                                                ? 'bg-white text-black'
                                                : 'bg-black text-white hover:bg-white hover:text-black'
                                            }`}
                                    >
                                        <div
                                            className="w-full h-8 mb-2 border-2 border-black"
                                            style={{
                                                background: `linear-gradient(${customGradient.direction.replace('to-', '')}, ${customGradient.color1}, ${customGradient.color2})`
                                            }}
                                        />
                                        CUSTOM GRADIENT
                                    </button>

                                    {/* Custom Gradient Controls */}
                                    {isCustomizing && (
                                        <div className="bg-black p-4 border-4 border-white">
                                            <h3 className="text-lg font-black mb-4">CUSTOM GRADIENT</h3>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <Label className="text-sm font-black mb-2 block">COLOR 1</Label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={customGradient.color1}
                                                            onChange={(e) => setCustomGradient(prev => ({ ...prev, color1: e.target.value }))}
                                                            className="w-12 h-12 border-4 border-white rounded-none bg-transparent cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={customGradient.color1}
                                                            onChange={(e) => setCustomGradient(prev => ({ ...prev, color1: e.target.value }))}
                                                            className="flex-1 p-2 text-black font-black border-2 border-white"
                                                            placeholder="#3b82f6"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-black mb-2 block">COLOR 2</Label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={customGradient.color2}
                                                            onChange={(e) => setCustomGradient(prev => ({ ...prev, color2: e.target.value }))}
                                                            className="w-12 h-12 border-4 border-white rounded-none bg-transparent cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={customGradient.color2}
                                                            onChange={(e) => setCustomGradient(prev => ({ ...prev, color2: e.target.value }))}
                                                            className="flex-1 p-2 text-black font-black border-2 border-white"
                                                            placeholder="#7c3aed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Gradient Direction */}
                                            <div>
                                                <Label className="text-sm font-black mb-2 block">DIRECTION</Label>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {gradientDirections.map((direction) => (
                                                        <button
                                                            key={direction.value}
                                                            onClick={() => setCustomGradient(prev => ({ ...prev, direction: direction.value }))}
                                                            className={`p-2 border-2 border-white text-xs font-black ${customGradient.direction === direction.value ? 'bg-white text-black' : 'bg-black text-white'
                                                                }`}
                                                        >
                                                            {direction.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button
                                    onClick={generateFinalImage}
                                    disabled={isGeneratingFinal}
                                    className="bg-white text-black border-4 border-black hover:bg-black hover:text-white font-black text-lg px-8 py-3 uppercase tracking-wider"
                                >
                                    {isGeneratingFinal ? (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                            GENERATING...
                                        </>
                                    ) : (
                                        <>
                                            <Palette className="w-5 h-5 mr-2" />
                                            GENERATE FINAL IMAGE
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Final Result Section */}
                {finalImage && (
                    <Card className="bg-green-500 border-4 border-black text-white">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-black p-2">
                                    <Download className="w-6 h-6 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-black uppercase">STEP 04: YOUR FINAL MASTERPIECE</h2>
                            </div>

                            <div className="bg-white p-4 border-4 border-black inline-block">
                                <img
                                    src={finalImage.dataUrl}
                                    alt="Final car with background"
                                    className="max-w-full max-h-96"
                                />
                            </div>

                            <div className="mt-6">
                                <Button
                                    onClick={downloadImage}
                                    className="bg-white text-black border-4 border-black hover:bg-black hover:text-white font-black text-lg px-8 py-3 uppercase tracking-wider"
                                >
                                    <Download className="w-5 h-5 mr-2" />
                                    DOWNLOAD HIGH QUALITY IMAGE
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Hidden canvas for image composition */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}