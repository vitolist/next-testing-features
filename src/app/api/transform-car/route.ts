// src/app/api/transform-car/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
const fs = require('fs');
const path = require('path');

export const runtime = 'nodejs' // Buffer support

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DEBUG = true;

// Neutral, IP-safe style prompt
// const STYLE_PROMPT = `
// Convert the described real-world car into a friendly cartoon character:
// - Large expressive eyes on the windshield
// - Subtle smile suggested in the grille/bumper
// - Rounded, approachable proportions
// - Glossy, smooth surfaces with clean, bold shading
// - Vibrant, punchy colors
// - Absolutely no background: fully transparent PNG (crisp cutout edges)
// - No logos, badges, license plates, or brand marks; keep it generic
// `

const STYLE_PROMPT = `You are an expert image editor specialized in transforming real car photos into Disney Pixar Cars movie style characters. Your task is to:

1. STYLE TRANSFORMATION:
   - Convert the realistic car into a cartoon-style vehicle that matches the Disney Pixar Cars aesthetic
   - Add large, expressive cartoon eyes on the windshield (the eyes should be the most prominent feature)
   - Give the car a friendly, animated personality through facial expressions
   - Add a subtle smile using the front grille or bumper area
   - Make the car look alive and character-like, not just a vehicle

2. VISUAL CHARACTERISTICS:
   - Maintain bright, vibrant colors typical of Disney Cars characters
   - Add glossy, smooth surfaces with cartoon-like shading
   - Enhance the car's proportions to be more rounded and friendly
   - Keep the car's basic shape and type recognizable
   - Add subtle personality details like eyebrows or expression lines

3. BACKGROUND REMOVAL:
   - CRITICAL: Remove ALL background elements completely
   - Make the background 100% transparent
   - Ensure clean edges around the car with no artifacts
   - The car should be perfectly isolated on a transparent background
   - The car can only cast transparent shadows

4. QUALITY REQUIREMENTS:
   - High resolution and crisp details
   - Professional quality suitable for printing or digital use
   - Maintain aspect ratio of the original car
   - Ensure the transformation looks natural and well-integrated

5. CHARACTER PERSONALITY:
   - Make the car look friendly and approachable
   - The eyes should be large, expressive, and positioned naturally on the windshield
   - Add subtle character details that make it feel alive
   - Maintain the dignity and appeal of the original vehicle while adding cartoon charm

Remember: The most important elements are the large cartoon eyes, complete background removal, and maintaining the Disney Pixar Cars visual style. The result should look like it could be a character from the actual movies.`

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const imageFile = formData.get('image') as File | null

        if (!imageFile) {
            return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
        }
        if (!imageFile.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Please upload a valid image file' }, { status: 400 })
        }

        // Read file (for vision analysis)
        const bytes = await imageFile.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mime = imageFile.type

        if (DEBUG) {
            // Return a sample image from /public/sample.png as base64 data URL for debugging
            const samplePath = path.join(process.cwd(), 'public', '3fbb8469-f242-493d-a536-38b7c9363fcb.png');
            const sampleBuffer = fs.readFileSync(samplePath);
            const sampleB64 = sampleBuffer.toString('base64');
            const dataUrl = `data:image/png;base64,${sampleB64}`;
            return NextResponse.json({
                debug: true,
                imageUrl: dataUrl,
                message: 'Sample image returned in debug mode.',
            });
        }

        // 1) Analyze the uploaded image with a current vision-capable model
        const analysis = await openai.chat.completions.create({
            model: 'gpt-4o', // replacement for deprecated gpt-4-vision-preview
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Describe this car (type, color, body style, unique visual cues). Be concise but specific.' },
                        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}`, detail: 'high' } },
                    ],
                },
            ],
            max_tokens: 300,
            temperature: 0.2,
        })

        const carDescription =
            analysis.choices?.[0]?.message?.content?.trim() || 'a car'

        // 2) Generate a transparent-background cartoon version with Images API
        const gen = await openai.images.generate({
            model: 'gpt-image-1',
            prompt: `Create an original cartoon car character based on: ${carDescription}.
${STYLE_PROMPT}
Square/portrait composition with the character centered.`,
            size: '1024x1024',
            n: 1,
            background: 'transparent', // transparent PNG with alpha
        })

        const b64 = gen.data?.[0]?.b64_json
        if (!b64) throw new Error('No image data returned from OpenAI')

        // Return a data URL (PNG). Alternatively, upload and return a CDN URL.
        const dataUrl = `data:image/png;base64,${b64}`

        return NextResponse.json({
            success: true,
            imageUrl: dataUrl,
            carDescription,
            message: 'Cartoon car generated with transparent background.',
        })
    } catch (error: any) {
        console.error('Error transforming image:', error)

        if (error?.code === 'invalid_api_key') {
            return NextResponse.json({ error: 'Invalid OpenAI API key' }, { status: 401 })
        }
        if (error?.code === 'insufficient_quota') {
            return NextResponse.json({ error: 'OpenAI API quota exceeded' }, { status: 429 })
        }
        if (error?.code === 'rate_limit_exceeded') {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        }

        return NextResponse.json(
            {
                error: 'Failed to transform image',
                details:
                    process.env.NODE_ENV === 'development'
                        ? error?.message || 'Unknown error'
                        : 'An unexpected error occurred',
            },
            { status: 500 },
        )
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'Car transformation API endpoint. Use POST to transform images.' },
        { status: 200 },
    )
}
